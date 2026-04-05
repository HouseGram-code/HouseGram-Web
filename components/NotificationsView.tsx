'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Bell, Volume2 } from 'lucide-react';

export default function NotificationsView() {
  const { setView, themeColor, isGlassEnabled, notificationsEnabled, setNotificationsEnabled, soundEnabled, setSoundEnabled } = useChat();

  const handleNotifToggle = async () => {
    if (!notificationsEnabled) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setNotificationsEnabled(true);
        } else {
          alert('Разрешите уведомления в настройках браузера');
        }
      } else {
        alert('Ваш браузер не поддерживает уведомления');
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-white flex flex-col z-20"
    >
      <div 
        className={`text-white px-2.5 h-14 flex items-center gap-4 shrink-0 relative z-30 transition-colors ${isGlassEnabled ? 'backdrop-blur-md border-b border-black/10' : ''}`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'CC' : themeColor }}
      >
        <button onClick={() => setView('settings')} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow text-[18px] font-medium">Уведомления и звуки</div>
      </div>

      <div className="flex-grow overflow-y-auto pt-4 pb-10 no-scrollbar bg-gray-50">
        <div className="bg-white border-y border-gray-100 mb-4">
          <div className="px-4 py-2 text-[14px] font-medium" style={{ color: themeColor }}>Уведомления для чатов</div>
          
          <div 
            className="flex items-center px-4 py-3 gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={handleNotifToggle}
          >
            <div className="text-gray-500"><Bell size={24} /></div>
            <div className="flex flex-col flex-grow">
              <span className="text-[16px] text-black">Показывать уведомления</span>
              <span className="text-[13px] text-gray-500">Уведомления о новых сообщениях</span>
            </div>
            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${notificationsEnabled ? 'bg-blue-500' : 'bg-gray-300'}`} style={notificationsEnabled ? { backgroundColor: themeColor } : {}}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>

          <div className="h-[1px] bg-gray-100 ml-14" />

          <div 
            className="flex items-center px-4 py-3 gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            <div className="text-gray-500"><Volume2 size={24} /></div>
            <div className="flex flex-col flex-grow">
              <span className="text-[16px] text-black">Звук</span>
              <span className="text-[13px] text-gray-500">Звук при отправке и получении</span>
            </div>
            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${soundEnabled ? 'bg-blue-500' : 'bg-gray-300'}`} style={soundEnabled ? { backgroundColor: themeColor } : {}}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>
        
        <div className="px-4 text-[13px] text-gray-500 text-center">
          Браузерные уведомления работают, когда вкладка свернута или неактивна.
        </div>
      </div>
    </motion.div>
  );
}
