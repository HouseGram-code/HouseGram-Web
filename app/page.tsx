'use client';

import { useChat } from '@/context/ChatContext';
import ChatList from '@/components/ChatList';
import ChatView from '@/components/ChatView';
import SideMenu from '@/components/SideMenu';
import SettingsView from '@/components/SettingsView';
import AdminView from '@/components/AdminView';
import ProfileView from '@/components/ProfileView';
import AuthView from '@/components/AuthView';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const { view } = useChat();

  return (
    <div className="w-full max-w-[480px] h-[100dvh] bg-tg-bg-light relative overflow-hidden shadow-2xl sm:rounded-3xl sm:h-[90dvh] sm:max-h-[850px] border border-tg-divider">
      <AnimatePresence mode="wait">
        {view === 'auth' && <AuthView key="auth" />}
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
