'use client';

import { useChat } from '@/context/ChatContext';
import { useState } from 'react';
import { X, Minus, Square, Settings, User, MessageSquare, Bell, Shield, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export default function DesktopLayout({ children }: DesktopLayoutProps) {
  const { isDarkMode, setView, user } = useChat();
  const [isMaximized, setIsMaximized] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const handleMinimize = () => {
    // В реальном Electron приложении это минимизирует окно
    console.log('Minimize window');
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    // В реальном Electron приложении это закрывает окно
    if (confirm('Закрыть HouseGram?')) {
      console.log('Close window');
    }
  };

  const menuItems = [
    { icon: MessageSquare, label: 'Чаты', view: 'menu' },
    { icon: User, label: 'Профиль', view: 'profile' },
    { icon: Bell, label: 'Уведомления', view: 'notifications' },
    { icon: Settings, label: 'Настройки', view: 'settings' },
    { icon: Shield, label: 'Безопасность', view: 'security' },
    { icon: Info, label: 'О программе', view: 'info' },
  ];

  return (
    <div className={`w-full h-screen flex flex-col ${isDarkMode ? 'bg-[#0f0f0f] text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Window Title Bar */}
      <div className={`h-12 flex items-center justify-between px-4 select-none ${isDarkMode ? 'bg-[#1a1a1a] border-b border-gray-800' : 'bg-white border-b border-gray-200'}`}
           style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">HG</span>
          </div>
          <span className="font-semibold">HouseGram Desktop Beta</span>
        </div>

        {/* Window Controls */}
        <div className="flex items-center space-x-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button
            onClick={handleMinimize}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            <Minus size={16} />
          </button>
          <button
            onClick={handleMaximize}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            <Square size={14} />
          </button>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <div className={`w-20 flex flex-col items-center py-4 space-y-2 ${isDarkMode ? 'bg-[#1a1a1a] border-r border-gray-800' : 'bg-white border-r border-gray-200'}`}>
          {/* User Avatar */}
          <div className="mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                 onClick={() => setView('profile')}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User size={24} className="text-white" />
              )}
            </div>
          </div>

          {/* Menu Items */}
          {menuItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setView(item.view as any)}
              className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-all hover:scale-105 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              title={item.label}
            >
              <item.icon size={24} />
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>

      {/* Modal Example */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowModal(false)}
            />

            {/* Modal Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] rounded-2xl shadow-2xl z-50 ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}
            >
              {/* Modal Header */}
              <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <h3 className="text-lg font-semibold">Модальное окно</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                  Это пример модального окна в десктопном интерфейсе
                </p>
              </div>

              {/* Modal Footer */}
              <div className={`flex items-center justify-end space-x-3 p-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <button
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  Отмена
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Подтвердить
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
