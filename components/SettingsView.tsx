'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Palette, Image as ImageIcon, Lock, Bell, Moon } from 'lucide-react';

export default function SettingsView() {
  const { setView, isGlassEnabled, setIsGlassEnabled, themeColor } = useChat();

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
        <button onClick={() => setView('menu')} className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="text-[17px] font-medium flex-grow">Настройки</div>
      </div>

      <div className="flex-grow overflow-y-auto pt-14 no-scrollbar">
        <div className="px-4 py-2 text-[13px] text-gray-500 uppercase font-medium">Оформление</div>
        <div className="bg-white p-2 mb-4">
          <SettingsItem icon={Palette} label="Настройки чата" onClick={() => setView('chat-settings')} />
          <SettingsItem icon={Moon} label="Ночной режим" />
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-6">
              <ImageIcon size={24} className="text-gray-400" />
              <span className="text-[16px]">Glassmorphism</span>
            </div>
            <input 
              type="checkbox" 
              checked={isGlassEnabled} 
              onChange={(e) => setIsGlassEnabled(e.target.checked)}
              className="w-5 h-5 accent-blue-500"
            />
          </div>
        </div>

        <div className="px-4 py-2 text-[13px] text-gray-500 uppercase font-medium">Безопасность</div>
        <div className="bg-white p-2">
          <SettingsItem icon={Lock} label="Код-пароль" />
          <SettingsItem icon={Bell} label="Уведомления" />
        </div>
      </div>
    </motion.div>
  );
}

function SettingsItem({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-6 px-4 py-3 hover:bg-gray-50 transition-colors text-[16px] text-gray-800"
    >
      <Icon size={24} className="text-gray-400" />
      {label}
    </button>
  );
}
