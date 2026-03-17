'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, User, Image as ImageIcon, Palette, Moon, Sun } from 'lucide-react';
import Image from 'next/image';

export default function SettingsView() {
  const { setView, userProfile, themeColor, setThemeColor, isDarkMode, setIsDarkMode } = useChat();

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
        <div className="flex-grow text-[17px] font-medium">Настройки</div>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        <div className="flex flex-col items-center mb-8 relative">
          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 mb-4 overflow-hidden relative">
            {userProfile?.avatarUrl ? (
              <Image src={userProfile.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
              <User size={48} />
            )}
          </div>
          <h2 className="text-xl font-bold text-tg-text-primary">{userProfile?.name || 'Пользователь'}</h2>
          <p className="text-tg-secondary-text mb-4">{userProfile?.email}</p>
          <button 
            onClick={() => setView('profile')}
            className="px-6 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
          >
            Редактировать профиль
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-white/5 rounded-xl shadow-sm border border-gray-100 dark:border-tg-divider overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-tg-divider flex items-center justify-between">
              <div className="flex items-center gap-3 text-tg-text-primary">
                <Moon size={20} className="text-gray-500" />
                <span className="font-medium">Темная тема</span>
              </div>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-12 h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-tg-text-primary">
                <Palette size={20} className="text-gray-500" />
                <span className="font-medium">Цвет темы</span>
              </div>
              <div className="flex gap-2">
                {['#517da2', '#F44336', '#4CAF50', '#FF9800', '#9C27B0'].map(color => (
                  <button 
                    key={color}
                    onClick={() => setThemeColor(color)}
                    className={`w-6 h-6 rounded-full border-2 ${themeColor === color ? 'border-gray-800 dark:border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
