'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Shield, Users, Settings, Ban, CheckCircle, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

export default function AdminView() {
  const { setView, themeColor, isGlassEnabled, isAdmin, systemStatus } = useChat();
  const [users, setUsers] = useState<any[]>([]);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      setView('menu');
      return;
    }

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

    fetchUsers();

    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setIsMaintenance(docSnap.data().maintenanceMode || false);
      }
    });

    return () => unsubscribe();
  }, [isAdmin, setView]);

  const toggleBan = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isBanned: !currentStatus
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: !currentStatus } : u));
    } catch (err) {
      console.error('Error toggling ban', err);
      alert('Ошибка при изменении статуса блокировки');
    }
  };

  const setAsAdmin = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: 'admin'
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'admin' } : u));
    } catch (err) {
      console.error('Error setting as admin', err);
      alert('Ошибка при назначении администратором');
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

  const updateSystemStatus = async (status: 'green' | 'yellow' | 'red' | 'blue', message: string) => {
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        systemStatus: { status, message }
      }, { merge: true });
    } catch (err) {
      console.error('Error updating system status', err);
      alert('Ошибка при изменении статуса системы');
    }
  };

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
      </div>

      <div className="flex-grow overflow-y-auto pt-4 pb-10 no-scrollbar bg-gray-50">
        <div className="bg-white border-y border-gray-100 mb-4">
          <div className="px-4 py-2 text-[14px] font-medium" style={{ color: themeColor }}>Управление системой</div>
          
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
          <div className="px-4 py-2 text-[14px] font-medium" style={{ color: themeColor }}>Статус мессенджера</div>
          
          <div className="p-4 flex flex-col gap-3">
            <button 
              onClick={() => updateSystemStatus('green', 'Все системы работают в штатном режиме')}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${systemStatus?.status === 'green' ? 'bg-green-50 border-green-200' : 'border-gray-100 hover:bg-gray-50'}`}
            >
              <CheckCircle size={24} className="text-green-500" />
              <div className="text-left">
                <div className="font-medium text-gray-900">В норме (Зеленый)</div>
                <div className="text-sm text-gray-500">Все работает стабильно</div>
              </div>
            </button>

            <button 
              onClick={() => updateSystemStatus('yellow', 'Наблюдается повышенная нагрузка на серверы')}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${systemStatus?.status === 'yellow' ? 'bg-yellow-50 border-yellow-200' : 'border-gray-100 hover:bg-gray-50'}`}
            >
              <AlertTriangle size={24} className="text-yellow-500" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Нагрузка (Желтый)</div>
                <div className="text-sm text-gray-500">Возможны задержки</div>
              </div>
            </button>

            <button 
              onClick={() => updateSystemStatus('red', 'Произошел критический сбой. Мы уже работаем над решением.')}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${systemStatus?.status === 'red' ? 'bg-red-50 border-red-200' : 'border-gray-100 hover:bg-gray-50'}`}
            >
              <Ban size={24} className="text-red-500" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Сбой (Красный)</div>
                <div className="text-sm text-gray-500">Критическая ошибка</div>
              </div>
            </button>

            <button 
              onClick={() => updateSystemStatus('blue', 'Системы восстанавливаются после сбоя')}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${systemStatus?.status === 'blue' ? 'bg-blue-50 border-blue-200' : 'border-gray-100 hover:bg-gray-50'}`}
            >
              <Settings size={24} className="text-blue-500" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Восстановление (Синий)</div>
                <div className="text-sm text-gray-500">Возврат в штатный режим</div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white border-y border-gray-100 mb-4">
          <div className="px-4 py-2 text-[14px] font-medium flex items-center gap-2" style={{ color: themeColor }}>
            <Users size={16} />
            Пользователи ({users.length})
          </div>
          
          {loading ? (
            <div className="p-4 text-center text-gray-500">Загрузка...</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map(user => (
                <div key={user.id} className="flex items-center px-4 py-3 gap-3 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium shrink-0">
                    {user.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex flex-col flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[16px] text-black font-medium truncate">{user.name}</span>
                      {user.role === 'admin' && <Shield size={14} className="text-blue-500 shrink-0" />}
                    </div>
                    <span className="text-[13px] text-gray-500 truncate">{user.email}</span>
                  </div>
                  
                  {user.role !== 'admin' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAsAdmin(user.id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        <Shield size={16} /> Админ
                      </button>
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
