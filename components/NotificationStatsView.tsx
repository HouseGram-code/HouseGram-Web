'use client';

import { useChat } from '@/context/ChatContext';
import { ArrowLeft, Bell, TrendingUp, Eye, MousePointer, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getNotificationStats, resetNotificationStats } from '@/lib/notifications';

export default function NotificationStatsView() {
  const { setView, themeColor } = useChat();
  const [stats, setStats] = useState({
    delivered: 0,
    clicked: 0,
    dismissed: 0,
    byType: {
      message: 0,
      channel_post: 0
    }
  });

  useEffect(() => {
    // Загружаем статистику
    const loadStats = () => {
      const currentStats = getNotificationStats();
      setStats(currentStats);
    };

    loadStats();
    
    // Обновляем каждые 5 секунд
    const interval = setInterval(loadStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleReset = () => {
    if (confirm('Вы уверены что хотите сбросить статистику?')) {
      resetNotificationStats();
      setStats({
        delivered: 0,
        clicked: 0,
        dismissed: 0,
        byType: {
          message: 0,
          channel_post: 0
        }
      });
    }
  };

  const clickRate = stats.delivered > 0 
    ? ((stats.clicked / stats.delivered) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="absolute inset-0 bg-white z-30 flex flex-col">
      <div 
        className="flex items-center gap-4 p-4 text-white transition-colors"
        style={{ backgroundColor: themeColor }}
      >
        <button onClick={() => setView('notifications')} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-medium">Статистика уведомлений</h1>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        {/* Общая статистика */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white mb-4 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Bell size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{stats.delivered}</h2>
              <p className="text-white/80 text-sm">Всего доставлено</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <MousePointer size={16} />
                <span className="text-sm">Открыто</span>
              </div>
              <p className="text-2xl font-bold">{stats.clicked}</p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} />
                <span className="text-sm">CTR</span>
              </div>
              <p className="text-2xl font-bold">{clickRate}%</p>
            </div>
          </div>
        </div>

        {/* По типам */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Eye size={20} className="text-gray-600" />
            По типам уведомлений
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                  💬
                </div>
                <div>
                  <p className="font-medium text-gray-900">Сообщения</p>
                  <p className="text-sm text-gray-500">Личные чаты</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{stats.byType.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white">
                  📢
                </div>
                <div>
                  <p className="font-medium text-gray-900">Посты каналов</p>
                  <p className="text-sm text-gray-500">Подписки</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">{stats.byType.channel_post}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Детальная информация */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <h3 className="font-medium text-gray-900 mb-3">Детальная информация</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Доставлено успешно</span>
              <span className="font-medium text-gray-900">{stats.delivered}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Открыто пользователем</span>
              <span className="font-medium text-gray-900">{stats.clicked}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Закрыто без действия</span>
              <span className="font-medium text-gray-900">{stats.dismissed}</span>
            </div>
            
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Процент открытий (CTR)</span>
              <span className="font-medium text-green-600">{clickRate}%</span>
            </div>
          </div>
        </div>

        {/* Советы */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 Советы</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Высокий CTR (&gt;30%) - пользователи активно реагируют</li>
            <li>• Низкий CTR (&lt;10%) - возможно слишком много уведомлений</li>
            <li>• Отключайте уведомления для неважных событий</li>
          </ul>
        </div>

        {/* Кнопка сброса */}
        <button
          onClick={handleReset}
          className="w-full py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
        >
          <X size={20} />
          Сбросить статистику
        </button>
      </div>
    </div>
  );
}
