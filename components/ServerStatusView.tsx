'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Server, Activity, Users, Database, Wifi, WifiOff, AlertCircle, CheckCircle, Clock, TrendingUp, HardDrive, Cpu, MemoryStick } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

interface ServerStats {
  totalUsers: number;
  onlineUsers: number;
  totalMessages: number;
  totalChats: number;
  totalChannels: number;
  uptime: string;
  lastUpdate: Date;
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
}

export default function ServerStatusView() {
  const { setView, themeColor } = useChat();
  const [stats, setStats] = useState<ServerStats>({
    totalUsers: 0,
    onlineUsers: 0,
    totalMessages: 0,
    totalChats: 0,
    totalChannels: 0,
    uptime: '99.9%',
    lastUpdate: new Date(),
    status: 'operational',
    responseTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadServerStats();
    const interval = setInterval(loadServerStats, 30000); // Обновляем каждые 30 секунд
    return () => clearInterval(interval);
  }, []);

  const loadServerStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const startTime = Date.now();

      // Получаем статистику пользователей
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;
      
      // Считаем онлайн пользователей (активны менее 45 секунд назад)
      const now = new Date();
      const fortyFiveSecondsAgo = new Date(now.getTime() - 45000);
      
      let onlineUsers = 0;
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.status === 'online' && userData.lastSeen) {
          try {
            const lastSeenDate = userData.lastSeen.toDate ? userData.lastSeen.toDate() : new Date(userData.lastSeen);
            if (lastSeenDate >= fortyFiveSecondsAgo) {
              onlineUsers++;
            }
          } catch (e) {
            // Игнорируем ошибки парсинга даты
          }
        }
      });

      // Получаем статистику чатов
      const chatsSnapshot = await getDocs(collection(db, 'chats'));
      const totalChats = chatsSnapshot.size;

      // Считаем общее количество сообщений
      let totalMessages = 0;
      for (const chatDoc of chatsSnapshot.docs) {
        const messagesSnapshot = await getDocs(collection(db, 'chats', chatDoc.id, 'messages'));
        totalMessages += messagesSnapshot.size;
      }

      // Получаем статистику каналов
      const channelsSnapshot = await getDocs(collection(db, 'channels'));
      const totalChannels = channelsSnapshot.size;

      const responseTime = Date.now() - startTime;

      // Определяем статус сервера на основе времени ответа
      let status: 'operational' | 'degraded' | 'down' = 'operational';
      if (responseTime > 3000) {
        status = 'degraded';
      } else if (responseTime > 10000) {
        status = 'down';
      }

      setStats({
        totalUsers,
        onlineUsers,
        totalMessages,
        totalChats,
        totalChannels,
        uptime: '99.9%',
        lastUpdate: new Date(),
        status,
        responseTime
      });
    } catch (err) {
      console.error('Failed to load server stats:', err);
      setError('Не удалось загрузить статистику сервера');
      setStats(prev => ({ ...prev, status: 'down' }));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (stats.status) {
      case 'operational': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'down': return 'text-red-500';
    }
  };

  const getStatusIcon = () => {
    switch (stats.status) {
      case 'operational': return <CheckCircle size={20} className="text-green-500" />;
      case 'degraded': return <AlertCircle size={20} className="text-yellow-500" />;
      case 'down': return <WifiOff size={20} className="text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (stats.status) {
      case 'operational': return 'Все системы работают';
      case 'degraded': return 'Пониженная производительность';
      case 'down': return 'Проблемы с подключением';
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-tg-bg-light flex flex-col z-10"
    >
      {/* Header */}
      <div
        className="text-tg-header-text px-2.5 h-12 flex items-center gap-2.5 shrink-0"
        style={{ backgroundColor: themeColor }}
      >
        <button
          onClick={() => setView('settings')}
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[18px] font-medium">Статус сервера</h1>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4">
        {/* Статус сервера */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Server size={24} className="text-blue-500" />
            </div>
            <div className="flex-grow">
              <h2 className="text-[17px] font-medium text-gray-900">Статус системы</h2>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon()}
                <span className={`text-[15px] font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-[14px] text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-gray-500" />
                <span className="text-[13px] text-gray-500">Время ответа</span>
              </div>
              <p className="text-[18px] font-semibold text-gray-900">
                {loading ? '...' : `${stats.responseTime}ms`}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-gray-500" />
                <span className="text-[13px] text-gray-500">Uptime</span>
              </div>
              <p className="text-[18px] font-semibold text-gray-900">{stats.uptime}</p>
            </div>
          </div>

          <div className="mt-3 text-[13px] text-gray-500 text-center">
            Последнее обновление: {stats.lastUpdate.toLocaleTimeString('ru-RU')}
          </div>
        </div>

        {/* Статистика пользователей */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Users size={20} className="text-green-500" />
            </div>
            <h2 className="text-[17px] font-medium text-gray-900">Пользователи</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi size={16} className="text-green-500" />
                <span className="text-[15px] text-gray-700">В сети</span>
              </div>
              <span className="text-[17px] font-semibold text-gray-900">
                {loading ? '...' : stats.onlineUsers}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-500" />
                <span className="text-[15px] text-gray-700">Всего пользователей</span>
              </div>
              <span className="text-[17px] font-semibold text-gray-900">
                {loading ? '...' : stats.totalUsers}
              </span>
            </div>
          </div>
        </div>

        {/* Статистика данных */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Database size={20} className="text-purple-500" />
            </div>
            <h2 className="text-[17px] font-medium text-gray-900">База данных</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[15px] text-gray-700">Всего сообщений</span>
              <span className="text-[17px] font-semibold text-gray-900">
                {loading ? '...' : stats.totalMessages.toLocaleString('ru-RU')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[15px] text-gray-700">Активных чатов</span>
              <span className="text-[17px] font-semibold text-gray-900">
                {loading ? '...' : stats.totalChats}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[15px] text-gray-700">Каналов</span>
              <span className="text-[17px] font-semibold text-gray-900">
                {loading ? '...' : stats.totalChannels}
              </span>
            </div>
          </div>
        </div>

        {/* Информация о системе */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Activity size={20} className="text-orange-500" />
            </div>
            <h2 className="text-[17px] font-medium text-gray-900">Система</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-gray-500" />
                <span className="text-[15px] text-gray-700">Платформа</span>
              </div>
              <span className="text-[15px] font-medium text-gray-900">Firebase + Supabase</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-gray-500" />
                <span className="text-[15px] text-gray-700">Версия</span>
              </div>
              <span className="text-[15px] font-medium text-gray-900">1.0.0-beta</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MemoryStick size={16} className="text-gray-500" />
                <span className="text-[15px] text-gray-700">Регион</span>
              </div>
              <span className="text-[15px] font-medium text-gray-900">Europe West</span>
            </div>
          </div>
        </div>

        {/* Кнопка обновления */}
        <button
          onClick={loadServerStats}
          disabled={loading}
          className="w-full mt-4 bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 active:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Обновление...' : 'Обновить статистику'}
        </button>
      </div>
    </motion.div>
  );
}
