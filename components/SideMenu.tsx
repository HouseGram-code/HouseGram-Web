'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, User, Search, MessageSquare, Bookmark, Users, Megaphone, X, ShieldAlert } from 'lucide-react';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function SideMenu() {
  const { setView, themeColor, isSideMenuOpen, setSideMenuOpen, isAdmin, userProfile } = useChat();

  const handleSignOut = async () => {
    await signOut(auth);
    setView('auth');
    setSideMenuOpen(false);
  };

  const handleNavigation = (view: any) => {
    setView(view);
    setSideMenuOpen(false);
  };

  return (
    <AnimatePresence>
      {isSideMenuOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSideMenuOpen(false)}
            className="absolute inset-0 bg-black/50 z-40"
          />
          <motion.div 
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-y-0 left-0 w-[80%] max-w-[320px] bg-white z-50 flex flex-col shadow-2xl"
          >
            <div className="h-40 p-4 flex flex-col justify-end text-white relative" style={{ backgroundColor: themeColor }}>
              <button 
                onClick={() => setSideMenuOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={24} />
              </button>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3 overflow-hidden relative">
                {userProfile?.avatarUrl ? (
                  <Image src={userProfile.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
                ) : (
                  <User size={32} />
                )}
              </div>
              <div className="font-medium text-[18px]">{userProfile?.name || auth.currentUser?.displayName || 'Пользователь'}</div>
              <div className="text-[14px] opacity-80">{userProfile?.username ? `@${userProfile.username}` : auth.currentUser?.email}</div>
            </div>

            <div className="flex-grow py-2 overflow-y-auto">
              <MenuItem icon={Users} label="Создать группу" onClick={() => setSideMenuOpen(false)} />
              <MenuItem icon={Megaphone} label="Создать канал" onClick={() => setSideMenuOpen(false)} />
              <MenuItem icon={Bookmark} label="Избранное" onClick={() => setSideMenuOpen(false)} />
              <div className="h-px bg-gray-100 my-2" />
              <MenuItem icon={Settings} label="Настройки" onClick={() => handleNavigation('settings')} />
              {isAdmin && (
                <MenuItem icon={ShieldAlert} label="Админ панель" onClick={() => handleNavigation('admin')} />
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
              <button 
                onClick={handleSignOut}
                className="w-full py-3 text-center text-red-500 font-medium hover:bg-red-50 rounded-lg transition-colors"
              >
                Выйти
              </button>
              <div className="text-center text-gray-400 text-xs mt-2">
                HouseGram Web 1.0 beta
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
