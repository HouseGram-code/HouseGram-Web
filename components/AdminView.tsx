'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, ShieldAlert, Users, Settings, Activity } from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';
import { useState, useEffect } from 'react';

export default function AdminView() {
  const { setView, themeColor, isAdmin } = useChat();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-tg-bg-light text-tg-text-primary p-6 text-center">
        <ShieldAlert size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Доступ запрещен</h2>
        <p className="text-tg-secondary-text mb-6">У вас нет прав для просмотра этой страницы.</p>
        <button 
          onClick={() => setView('chatList')}
          className="px-6 py-2 rounded-lg text-white font-medium hover:brightness-110 transition-all"
          style={{ backgroundColor: themeColor }}
        >
          Вернуться назад
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-tg-bg-light flex flex-col z-20"
    >
      <div 
        className="text-tg-header-text px-3 h-12 flex items-center gap-4 shrink-0"
        style={{ backgroundColor: themeColor }}
      >
        <button 
          onClick={() => setView('chatList')} 
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow text-[17px] font-medium">Админ панель</div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-white/5 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-tg-divider flex flex-col items-center justify-center text-center">
                <Users size={32} className="text-blue-500 mb-2" />
                <div className="text-2xl font-bold text-tg-text-primary">1,234</div>
                <div className="text-sm text-tg-secondary-text">Пользователей</div>
              </div>
              <div className="bg-white dark:bg-white/5 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-tg-divider flex flex-col items-center justify-center text-center">
                <Activity size={32} className="text-green-500 mb-2" />
                <div className="text-2xl font-bold text-tg-text-primary">8,901</div>
                <div className="text-sm text-tg-secondary-text">Сообщений</div>
              </div>
            </div>

            <div className="bg-white dark:bg-white/5 rounded-xl shadow-sm border border-gray-100 dark:border-tg-divider overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-tg-divider font-medium text-tg-text-primary flex items-center gap-2">
                <Settings size={20} className="text-gray-500" />
                Управление системой
              </div>
              <div className="p-4 space-y-3">
                <button className="w-full py-2.5 px-4 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-left text-tg-text-primary transition-colors">
                  Управление пользователями
                </button>
                <button className="w-full py-2.5 px-4 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-left text-tg-text-primary transition-colors">
                  Настройки безопасности
                </button>
                <button className="w-full py-2.5 px-4 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-left text-tg-text-primary transition-colors">
                  Системные логи
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
