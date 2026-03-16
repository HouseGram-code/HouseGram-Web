'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Bell, Volume2, MessageSquare } from 'lucide-react';

export default function NotificationsView() {
  const { setView, themeColor, isGlassEnabled, notificationsEnabled, setNotificationsEnabled, soundEnabled, setSoundEnabled } = useChat();

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-gray-100 z-40 flex flex-col"
    >
      <div 
        className={`text-white px-2.5 h-12 flex items-center gap-4 shrink-0 absolute top-0 left-0 w-full z-10 transition-colors ${isGlassEnabled ? 'backdrop-blur-md border-b border-black/10' : ''}`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'CC' : themeColor }}
      >
        <button onClick={() => setView('settings')} className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="text-[17px] font-medium flex-grow">Уведомления и звуки</div>
      </div>

      <div className="flex-grow overflow-y-auto pt-16 p-4">
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          <div className="px-4 py-2 text-[14px] font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
            Уведомления для чатов
          </div>
          
          <div 
            className="flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={24} className="text-blue-500" />
              <div className="flex flex-col">
                <span className="text-[16px] text-black">Личные чаты</span>
                <span className="text-[13px] text-gray-500">
                  {notificationsEnabled ? 'Включены' : 'Выключены'}
                </span>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${notificationsEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>

          <div 
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            <div className="flex items-center gap-3">
              <Volume2 size={24} className="text-green-500" />
              <div className="flex flex-col">
                <span className="text-[16px] text-black">Звук в приложении</span>
                <span className="text-[13px] text-gray-500">
                  {soundEnabled ? 'Включен' : 'Выключен'}
                </span>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${soundEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>
        
        <div className="text-[13px] text-gray-500 px-2 text-center">
          При включенных уведомлениях вы будете получать push-уведомления о новых сообщениях. Звук воспроизводится при получении сообщения, если приложение открыто.
        </div>
      </div>
    </motion.div>
  );
}
