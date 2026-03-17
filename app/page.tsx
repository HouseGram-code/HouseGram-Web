'use client';

import { useChat } from '@/context/ChatContext';
import ChatList from '@/components/ChatList';
import ChatView from '@/components/ChatView';
import SideMenu from '@/components/SideMenu';
import SettingsView from '@/components/SettingsView';
import AdminView from '@/components/AdminView';
import ProfileView from '@/components/ProfileView';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const { view } = useChat();

  return (
    <div className="w-full max-w-[480px] h-[100dvh] bg-tg-bg-light relative overflow-hidden shadow-2xl sm:rounded-3xl sm:h-[90dvh] sm:max-h-[850px] border border-tg-divider">
      <AnimatePresence mode="wait">
        {view === 'auth' && (
          <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-white dark:bg-tg-bg-light">
            <div className="text-center p-6">
              <h1 className="text-3xl font-bold mb-4 text-tg-text-primary">HouseGram</h1>
              <p className="text-tg-secondary-text mb-8">Войдите, чтобы продолжить</p>
              <button 
                onClick={() => {}} 
                className="w-full py-3 px-4 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
              >
                Войти через Google
              </button>
            </div>
          </motion.div>
        )}
        {view === 'chatList' && <ChatList key="chatList" />}
        {view === 'chat' && <ChatView key="chat" />}
        {view === 'settings' && <SettingsView key="settings" />}
        {view === 'admin' && <AdminView key="admin" />}
        {view === 'profile' && <ProfileView key="profile" />}
      </AnimatePresence>
      <SideMenu />
    </div>
  );
}
