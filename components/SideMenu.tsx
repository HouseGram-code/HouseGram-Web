'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Phone, MapPin, Bookmark, Settings, HelpCircle, Lock, User, Shield, LogOut, BadgeCheck } from 'lucide-react';
import Image from 'next/image';

export default function SideMenu() {
  const { isSideMenuOpen, setSideMenuOpen, setView, themeColor, userProfile, setActiveChatId, isAdmin, logout } = useChat();

  return (
    <AnimatePresence>
      {isSideMenuOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSideMenuOpen(false)}
            className="absolute inset-0 bg-overlay-bg z-40"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-0 left-0 w-[80%] max-w-[320px] h-full bg-side-menu-bg z-50 flex flex-col shadow-xl"
          >
            <div 
              className="p-4 pt-10 flex flex-col gap-2 text-side-menu-user-text transition-colors"
              style={{ backgroundColor: themeColor }}
            >
              <div className="w-[60px] h-[60px] rounded-full bg-orange-500 flex items-center justify-center text-2xl font-medium overflow-hidden relative">
                {userProfile.avatarUrl ? (
                  <Image 
                    src={userProfile.avatarUrl} 
                    alt="Avatar" 
                    fill 
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <User size={32} className="text-white" fill="currentColor" />
                )}
              </div>
              <div>
                <div className="font-medium text-[15px] flex items-center gap-1">
                  {userProfile.name}
                  {userProfile.isOfficial && <BadgeCheck size={16} className="text-white fill-blue-500" />}
                </div>
              </div>
            </div>
            <ul className="py-2 flex-grow overflow-y-auto">
              <MenuItem icon={<Users size={24} />} text="Новая группа" locked />
              <MenuItem icon={<Users size={24} />} text="Контакты" locked />
              <MenuItem icon={<Phone size={24} />} text="Звонки" locked />
              <MenuItem icon={<MapPin size={24} />} text="Люди рядом" locked />
              <MenuItem 
                icon={<Bookmark size={24} />} 
                text="Избранное" 
                onClick={() => { setActiveChatId('saved_messages'); setView('chat'); setSideMenuOpen(false); }} 
              />
              <MenuItem 
                icon={<Settings size={24} />} 
                text="Настройки" 
                onClick={() => { setView('settings'); setSideMenuOpen(false); }} 
              />
              <MenuItem 
                icon={<HelpCircle size={24} />} 
                text="Возможности HouseGram" 
                onClick={() => { setView('features'); setSideMenuOpen(false); }} 
              />
              {isAdmin && (
                <MenuItem 
                  icon={<Shield size={24} />} 
                  text="Админ Панель" 
                  onClick={() => { setView('admin'); setSideMenuOpen(false); }} 
                />
              )}
              <MenuItem 
                icon={<LogOut size={24} />} 
                text="Выйти" 
                onClick={() => { logout(); setSideMenuOpen(false); }} 
              />
            </ul>
            <div className="p-4 text-center text-gray-400 text-sm border-t border-gray-100">
              <div className="font-medium">HouseGram Web</div>
              <div className="text-xs mt-0.5">v1.0 beta</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MenuItem({ icon, text, locked, onClick }: { icon: React.ReactNode; text: string; locked?: boolean; onClick?: () => void }) {
  return (
    <li 
      onClick={!locked ? onClick : undefined} 
      className={`flex items-center px-5 py-3 gap-6 ${locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'} text-side-menu-text-color transition-colors relative`}
    >
      <div className="text-side-menu-icon-color">{icon}</div>
      <span className="text-[15px] flex-grow">{text}</span>
      {locked && (
        <div className="flex items-center gap-1 text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md">
          <span>soon!</span>
          <Lock size={12} />
        </div>
      )}
    </li>
  );
}
