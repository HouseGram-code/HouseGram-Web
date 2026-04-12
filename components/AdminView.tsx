'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Shield, Users, Settings, Ban, CheckCircle, AlertTriangle, Database, Activity, MessageSquare, TrendingUp, Eye, Search, Filter, Download, RefreshCw, BadgeCheck, CreditCard, Zap, Clock, CheckCheck, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { supabase } from '@/lib/supabase';

type TabType = 'users' | 'stats' | 'system' | 'database' | 'payments';

export default function AdminView() {
  const { setView, themeColor, isGlassEnabled, isAdmin } = useChat();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    totalMessages: 0,
    totalChats: 0,
    bannedUsers: 0
  });
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [starsAmount, setStarsAmount] = useState(100);
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setView('menu');
      return;
    }

    checkSupabaseConnection();
    fetchUsers();
    fetchStats();
    fetchPaymentRequests();

    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setIsMaintenance(docSnap.data().maintenanceMode || false);
      }
    });

    // Подписка на заявки в реальном времени
    const unsubscribeRequests = onSnapshot(
      collection(db, 'payment_requests'),
      (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        setPaymentRequests(requests.sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        }));
      }
    );

    return () => {
      unsubscribe();
      unsubscribeRequests();
    };
  }, [isAdmin, setView]);

  const checkSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      setSupabaseConnected(!error);
    } catch (err) {
      setSupabaseConnected(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    } catch (err) {
      console.error('Error fetching users', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => doc.data());
      
      const chatsSnapshot = await getDocs(collection(db, 'chats'));
      
      setStats({
        totalUsers: users.length,
        onlineUsers: users.filter(u => u.status === 'online').length,
        totalMessages: 0, // Подсчитывается отдельно
        totalChats: chatsSnapshot.size,
        bannedUsers: users.filter(u => u.isBanned).length
      });
    } catch (err) {
      console.error('Error fetching stats', err);
    }
  };

  const fetchPaymentRequests = async () => {
    try {
      setLoadingRequests(true);
      const snapshot = await getDocs(collection(db, 'payment_requests'));
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setPaymentRequests(requests.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }));
    } catch (err) {
      console.error('Error fetching payment requests', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const approvePayment = async (requestId: string, userId: string, stars: number) => {
    try {
      // Начисляем молнии
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)));
      
      if (!userSnap.empty) {
        const currentStars = userSnap.docs[0].data().stars || 0;
        await updateDoc(userRef, {
          stars: currentStars + stars
        });
      }

      // Обновляем статус заявки
      await updateDoc(doc(db, 'payment_requests', requestId), {
        status: 'approved',
        approvedAt: new Date().toISOString()
      });

      alert(`✅ Заявка одобрена! Начислено ${stars} ⚡`);
    } catch (err) {
      console.error('Error approving payment:', err);
      alert('Ошибка при одобрении заявки');
    }
  };

  const rejectPayment = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'payment_requests', requestId), {
        status: 'rejected',
        rejectedAt: new Date().toISOString()
      });
      alert('❌ Заявка отклонена');
    } catch (err) {
      console.error('Error rejecting payment:', err);
      alert('Ошибка при отклонении заявки');
    }
  };

  const toggleBan = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isBanned: !currentStatus
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: !currentStatus } : u));
      fetchStats();
    } catch (err) {
      console.error('Error toggling ban', err);
      alert('Ошибка при изменении статуса блокировки');
    }
  };

  const toggleMaintenance = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        maintenanceMode: !isMaintenance
      }, { merge: true });
    } catch (err) {
      console.error('Error toggling maintenance', err);
      alert('Ошибка при изменении режима тех. работ');
    }
  };

  const giveStars = async (userId: string, amount: number) => {
    try {
      // Обновляем в Firebase
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)));
      
      if (!userDoc.empty) {
        const currentStars = userDoc.docs[0].data().stars || 0;
        await updateDoc(userRef, {
          stars: currentStars + amount
        });
      }

      // Обновляем в Supabase если подключен
      if (supabaseConnected) {
        const { data: userData } = await supabase
          .from('users')
          .select('stars')
          .eq('id', userId)
          .single();
        
        const currentStars = userData?.stars || 0;
        await supabase
          .from('users')
          .update({ stars: currentStars + amount })
          .eq('id', userId);
      }

      alert(`✅ Выдано ${amount} ⚡ пользователю ${selectedUser?.name}`);
      setShowUserModal(false);
      fetchUsers();
    } catch (err) {
      console.error('Error giving stars:', err);
      alert('Ошибка при выдаче молний');
    }
  };

  const toggleOfficialBadge = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isOfficial: !currentStatus
      });
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isOfficial: !currentStatus } : u));
      alert(`✅ Синий значок ${!currentStatus ? 'выдан' : 'убран'}`);
      setShowUserModal(false);
    } catch (err) {
      console.error('Error toggling badge:', err);
      alert('Ошибка при изменении значка');
    }
  };

  const makeAdmin = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: 'admin'
      });
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'admin' } : u));
      alert(`✅ Пользователь ${selectedUser?.name} теперь администратор`);
      setShowUserModal(false);
      fetchStats();
    } catch (err) {
      console.error('Error making admin:', err);
      alert('Ошибка при назначении администратором');
    }
  };

  const removeAdmin = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: 'user'
      });
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'user' } : u));
      alert(`✅ Права администратора убраны у ${selectedUser?.name}`);
      setShowUserModal(false);
      fetchStats();
    } catch (err) {
      console.error('Error removing admin:', err);
      alert('Ошибка при удалении прав администратора');
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(users, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-export-${new Date().toISOString()}.json`;
    link.click();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (!isAdmin) return null;

  return (
    <motion.div 
      initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-white flex flex-col z-50"
    >
      <div 
        className={`text-white px-2.5 h-14 flex items-center gap-4 shrink-0 relative z-30 transition-colors ${isGlassEnabled ? 'backdrop-blur-md border-b border-black/10' : ''}`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'CC' : themeColor }}
      >
        <button onClick={() => setView('menu')} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow text-[18px] font-medium flex items-center gap-2">
          <Shield size={20} />
          Админ Панель
        </div>
        <button onClick={fetchStats} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-2 shrink-0 overflow-x-auto">
        <TabButton 
          active={activeTab === 'users'} 
          onClick={() => setActiveTab('users')}
          icon={<Users size={18} />}
          label="Пользователи"
        />
        <TabButton 
          active={activeTab === 'payments'} 
          onClick={() => setActiveTab('payments')}
          icon={<CreditCard size={18} />}
          label="Пополнения"
        />
        <TabButton 
          active={activeTab === 'stats'} 
          onClick={() => setActiveTab('stats')}
          icon={<TrendingUp size={18} />}
          label="Статистика"
        />
        <TabButton 
          active={activeTab === 'system'} 
          onClick={() => setActiveTab('system')}
          icon={<Settings size={18} />}
          label="Система"
        />
        <TabButton 
          active={activeTab === 'database'} 
          onClick={() => setActiveTab('database')}
          icon={<Database size={18} />}
          label="База данных"
        />
      </div>

      <div className="flex-grow overflow-y-auto pt-4 pb-10 no-scrollbar bg-gray-50">
        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Search and Filter */}
              <div className="px-4 mb-4 space-y-3">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по имени, email или username..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterRole('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterRole === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Все ({users.length})
                  </button>
                  <button
                    onClick={() => setFilterRole('admin')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterRole === 'admin' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Админы ({users.filter(u => u.role === 'admin').length})
                  </button>
                  <button
                    onClick={() => setFilterRole('user')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterRole === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Пользователи ({users.filter(u => u.role === 'user').length})
                  </button>
                  <button
                    onClick={exportData}
                    className="ml-auto px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <Download size={16} />
                    Экспорт
                  </button>
                </div>
              </div>

              <div className="bg-white border-y border-gray-100">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Загрузка...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">Пользователи не найдены</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredUsers.map(user => (
                      <div key={user.id} className="flex items-center px-4 py-3 gap-3 hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium shrink-0">
                          {user.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex flex-col flex-grow min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[16px] text-black font-medium truncate">{user.name}</span>
                            {user.role === 'admin' && <Shield size={14} className="text-blue-500 shrink-0" />}
                            {user.status === 'online' && (
                              <span className="w-2 h-2 bg-green-500 rounded-full shrink-0"></span>
                            )}
                            {user.isBanned && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full shrink-0">
                                Забанен
                              </span>
                            )}
                          </div>
                          <span className="text-[13px] text-gray-500 truncate">{user.email}</span>
                          <span className="text-[12px] text-gray-400 truncate">{user.username}</span>
                        </div>
                        
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => toggleBan(user.id, user.isBanned)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                              user.isBanned 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {user.isBanned ? (
                              <><CheckCircle size={16} /> Разбанить</>
                            ) : (
                              <><Ban size={16} /> Забанить</>
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-4"
            >
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Заявки на пополнение</h2>
                <p className="text-sm text-gray-600">
                  Управление заявками на покупку молний от пользователей
                </p>
              </div>

              {paymentRequests.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center">
                  <CreditCard size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Нет заявок на пополнение</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentRequests.map((request: any) => (
                    <div
                      key={request.id}
                      className={`bg-white rounded-xl p-4 border-2 ${
                        request.status === 'pending'
                          ? 'border-yellow-300 bg-yellow-50'
                          : request.status === 'approved'
                          ? 'border-green-300 bg-green-50'
                          : 'border-red-300 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {request.userName || 'Пользователь'}
                            </span>
                            {request.status === 'pending' && (
                              <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-medium rounded-full flex items-center gap-1">
                                <Clock size={12} />
                                Ожидает
                              </span>
                            )}
                            {request.status === 'approved' && (
                              <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs font-medium rounded-full flex items-center gap-1">
                                <CheckCheck size={12} />
                                Одобрено
                              </span>
                            )}
                            {request.status === 'rejected' && (
                              <span className="px-2 py-0.5 bg-red-200 text-red-800 text-xs font-medium rounded-full flex items-center gap-1">
                                <X size={12} />
                                Отклонено
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{request.userEmail}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            ID: {request.id.slice(0, 8)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-yellow-600 font-bold text-lg">
                            <Zap size={20} fill="currentColor" />
                            {request.stars}
                          </div>
                          <p className="text-sm font-semibold text-gray-700">
                            {request.price} ₽
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mb-3">
                        {request.createdAt && new Date(request.createdAt.seconds * 1000).toLocaleString('ru-RU')}
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => approvePayment(request.id, request.userId, request.stars)}
                            className="flex-1 bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={18} />
                            Одобрить
                          </button>
                          <button
                            onClick={() => rejectPayment(request.id)}
                            className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <Ban size={18} />
                            Отклонить
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-4 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={<Users size={24} className="text-blue-500" />}
                  label="Всего пользователей"
                  value={stats.totalUsers}
                  color="bg-blue-50"
                />
                <StatCard
                  icon={<Activity size={24} className="text-green-500" />}
                  label="Онлайн"
                  value={stats.onlineUsers}
                  color="bg-green-50"
                />
                <StatCard
                  icon={<MessageSquare size={24} className="text-purple-500" />}
                  label="Чатов"
                  value={stats.totalChats}
                  color="bg-purple-50"
                />
                <StatCard
                  icon={<Ban size={24} className="text-red-500" />}
                  label="Забанено"
                  value={stats.bannedUsers}
                  color="bg-red-50"
                />
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp size={20} style={{ color: themeColor }} />
                  Активность
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Процент онлайн</span>
                    <span className="font-semibold">
                      {stats.totalUsers > 0 ? Math.round((stats.onlineUsers / stats.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all"
                      style={{ 
                        width: `${stats.totalUsers > 0 ? (stats.onlineUsers / stats.totalUsers) * 100 : 0}%`,
                        backgroundColor: themeColor
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div
              key="system"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white border-y border-gray-100 mb-4">
                <div className="px-4 py-2 text-[14px] font-medium" style={{ color: themeColor }}>
                  Управление системой
                </div>
                
                <div 
                  className="flex items-center px-4 py-3 gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={toggleMaintenance}
                >
                  <div className="text-orange-500"><Settings size={24} /></div>
                  <div className="flex flex-col flex-grow">
                    <span className="text-[16px] text-black">Технические работы</span>
                    <span className="text-[13px] text-gray-500">
                      {isMaintenance ? 'Включены (пользователи не могут войти)' : 'Выключены'}
                    </span>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isMaintenance ? 'bg-orange-500' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isMaintenance ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>
              </div>

              <div className="bg-white border-y border-gray-100 mb-4">
                <div className="px-4 py-2 text-[14px] font-medium" style={{ color: themeColor }}>
                  Управление пользователями
                </div>
                
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setShowUserModal(true);
                  }}
                  className="w-full flex items-center px-4 py-3 gap-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-yellow-500"><Activity size={24} /></div>
                  <div className="flex flex-col flex-grow">
                    <span className="text-[16px] text-black">Выдать молнии</span>
                    <span className="text-[13px] text-gray-500">Начислить молнии пользователю</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setShowUserModal(true);
                  }}
                  className="w-full flex items-center px-4 py-3 gap-4 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
                >
                  <div className="text-blue-500"><CheckCircle size={24} /></div>
                  <div className="flex flex-col flex-grow">
                    <span className="text-[16px] text-black">Управление значком</span>
                    <span className="text-[13px] text-gray-500">Выдать или убрать синий значок</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setShowUserModal(true);
                  }}
                  className="w-full flex items-center px-4 py-3 gap-4 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
                >
                  <div className="text-purple-500"><Shield size={24} /></div>
                  <div className="flex flex-col flex-grow">
                    <span className="text-[16px] text-black">Управление правами</span>
                    <span className="text-[13px] text-gray-500">Назначить или убрать администратора</span>
                  </div>
                </button>
              </div>

              <div className="px-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-4 text-white">
                  <h3 className="text-lg font-semibold mb-2">HouseGram v2.1 Beta</h3>
                  <p className="text-sm opacity-90">
                    Система работает стабильно. Все сервисы доступны.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'database' && (
            <motion.div
              key="database"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="px-4 space-y-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Database size={24} style={{ color: themeColor }} />
                    <h3 className="text-lg font-semibold">Firebase Firestore</h3>
                    <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Подключено
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Основная база данных для хранения пользователей, сообщений и настроек.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Database size={24} className="text-emerald-500" />
                    <h3 className="text-lg font-semibold">Supabase</h3>
                    <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
                      supabaseConnected 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {supabaseConnected ? 'Подключено' : 'Не настроено'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Альтернативная база данных PostgreSQL для расширенных функций и аналитики.
                  </p>
                  {!supabaseConnected && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                      <p className="font-medium mb-1">Настройка Supabase:</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Создайте проект на supabase.com</li>
                        <li>Добавьте NEXT_PUBLIC_SUPABASE_URL в .env.local</li>
                        <li>Добавьте NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.local</li>
                        <li>Выполните SQL из supabase-schema.sql</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Management Modal */}
      <AnimatePresence>
        {showUserModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUserModal(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-2xl p-6 z-50 shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold mb-4">Управление пользователем</h3>
              
              {/* User Selection */}
              {!selectedUser ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <p className="text-sm text-gray-600 mb-3">Выберите пользователя:</p>
                  {users.map(user => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium shrink-0">
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="font-medium truncate">{user.name}</div>
                        <div className="text-sm text-gray-500 truncate">{user.email}</div>
                      </div>
                      {user.isOfficial && (
                        <BadgeCheck size={16} className="text-blue-500 fill-blue-500 text-white shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected User Info */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                      {selectedUser.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium flex items-center gap-1">
                        {selectedUser.name}
                        {selectedUser.isOfficial && <BadgeCheck size={16} className="text-blue-500 fill-blue-500 text-white" />}
                      </div>
                      <div className="text-sm text-gray-500">{selectedUser.email}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    {/* Give Stars */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-medium mb-2">Выдать молнии ⚡</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={starsAmount}
                          onChange={(e) => setStarsAmount(parseInt(e.target.value) || 0)}
                          className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="Количество"
                        />
                        <button
                          onClick={() => giveStars(selectedUser.id, starsAmount)}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                        >
                          Выдать
                        </button>
                      </div>
                    </div>

                    {/* Toggle Official Badge */}
                    <button
                      onClick={() => toggleOfficialBadge(selectedUser.id, selectedUser.isOfficial)}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                        selectedUser.isOfficial
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle size={24} className="text-blue-500" />
                        <div className="text-left">
                          <div className="font-medium">Синий значок</div>
                          <div className="text-sm text-gray-500">
                            {selectedUser.isOfficial ? 'Убрать значок' : 'Выдать значок'}
                          </div>
                        </div>
                      </div>
                      <div className={`w-10 h-6 rounded-full p-1 transition-colors ${selectedUser.isOfficial ? 'bg-blue-500' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${selectedUser.isOfficial ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </button>

                    {/* Toggle Admin */}
                    {selectedUser.role !== 'admin' ? (
                      <button
                        onClick={() => makeAdmin(selectedUser.id)}
                        className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-purple-200 hover:border-purple-400 transition-colors"
                      >
                        <Shield size={24} className="text-purple-500" />
                        <div className="text-left flex-grow">
                          <div className="font-medium">Назначить администратором</div>
                          <div className="text-sm text-gray-500">Полный доступ к панели</div>
                        </div>
                      </button>
                    ) : (
                      <button
                        onClick={() => removeAdmin(selectedUser.id)}
                        className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-red-200 hover:border-red-400 transition-colors"
                      >
                        <Shield size={24} className="text-red-500" />
                        <div className="text-left flex-grow">
                          <div className="font-medium">Убрать права администратора</div>
                          <div className="text-sm text-gray-500">Сделать обычным пользователем</div>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Back Button */}
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    ← Назад к списку
                  </button>
                </div>
              )}

              {/* Close Button */}
              {!selectedUser && (
                <button
                  onClick={() => setShowUserModal(false)}
                  className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Закрыть
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
        active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
        />
      )}
    </button>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={`${color} rounded-xl p-4 border border-gray-200`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
