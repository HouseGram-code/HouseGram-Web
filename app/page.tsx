'use client';

import { useChat } from '@/context/ChatContext';
import ChatList from '@/components/ChatList';
import ChatView from '@/components/ChatView';
import SideMenu from '@/components/SideMenu';
import SettingsView from '@/components/SettingsView';
import AdminView from '@/components/AdminView';
import ProfileView from '@/components/ProfileView';
import AuthView from '@/components/AuthView';
import PasscodeScreen from '@/components/PasscodeScreen';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const { view, isLocked, isAppReady } = useChat();

  if (!isAppReady) {
    return (
      <div className="w-full max-w-[480px] h-[100dvh] bg-tg-bg-light relative overflow-hidden shadow-2xl sm:rounded-3xl sm:h-[90dvh] sm:max-h-[850px] border border-tg-divider flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[480px] h-[100dvh] bg-tg-bg-light relative overflow-hidden shadow-2xl sm:rounded-3xl sm:h-[90dvh] sm:max-h-[850px] border border-tg-divider">
      <AnimatePresence mode="wait">
        {isLocked && <PasscodeScreen key="passcode" />}
        {!isLocked && view === 'auth' && <AuthView key="auth" />}
        {!isLocked && view === 'chatList' && <ChatList key="chatList" />}
        {!isLocked && view === 'chat' && <ChatView key="chat" />}
        {!isLocked && view === 'settings' && <SettingsView key="settings" />}
        {!isLocked && view === 'admin' && <AdminView key="admin" />}
        {!isLocked && view === 'profile' && <ProfileView key="profile" />}
      </AnimatePresence>
      {!isLocked && <SideMenu />}
    </div>
  );
}
