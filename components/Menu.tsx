'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { Settings, User, Search, MessageSquare, Bookmark, Users, Megaphone } from 'lucide-react';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function Menu() {
  const { setView, contacts, themeColor } = useChat();

  const handleSignOut = async () => {
    await signOut(auth);
    setView('auth');
  };

  return (
    <motion.div 
      initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-white z-40 flex flex-col"
    >
      <div className="h-40 p-4 flex flex-col justify-end text-white" style={{ backgroundColor: themeColor }}>
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3">
          <User size={32} />
        </div>
        <div className="font-medium text-[18px]">{auth.currentUser?.displayName || 'Пользователь'}</div>
        <div className="text-[14px] opacity-80">{auth.currentUser?.email}</div>
      </div>

      <div className="flex-grow py-2">
        <MenuItem icon={Users} label="Создать группу" onClick={() => {}} />
        <MenuItem icon={Megaphone} label="Создать канал" onClick={() => {}} />
        <MenuItem icon={Bookmark} label="Избранное" onClick={() => setView('chat')} />
        <div className="h-px bg-gray-100 my-2" />
        <MenuItem icon={Settings} label="Настройки" onClick={() => setView('settings')} />
      </div>

      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={handleSignOut}
          className="w-full py-3 text-center text-red-500 font-medium hover:bg-red-50 rounded-lg transition-colors"
        >
          Выйти
        </button>
      </div>
    </motion.div>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-6 px-5 py-3.5 hover:bg-gray-50 transition-colors text-[16px] text-gray-800"
    >
      <Icon size={24} className="text-gray-400" />
      {label}
    </button>
  );
}
