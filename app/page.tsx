'use client';

import { ChatProvider, useChat } from '@/context/ChatContext';
import { AnimatePresence } from 'motion/react';
import ChatList from '@/components/ChatList';
import ChatView from '@/components/ChatView';
import ProfileView from '@/components/ProfileView';
import SideMenu from '@/components/SideMenu';
import SettingsView from '@/components/SettingsView';
import ChatSettingsView from '@/components/ChatSettingsView';
import FeaturesView from '@/components/FeaturesView';
import PrivacyView from '@/components/PrivacyView';
import NotificationsView from '@/components/NotificationsView';
import SecurityView from '@/components/SecurityView';
import PasscodeScreen from '@/components/PasscodeScreen';
import AuthView from '@/components/AuthView';
import AdminView from '@/components/AdminView';

function AppContent() {
  const { view, isLocked, user } = useChat();

  if (view === 'auth' || !user) {
    return (
      <div className="relative w-full max-w-[420px] h-[100dvh] bg-tg-bg-light shadow-2xl overflow-hidden sm:rounded-[24px] sm:h-[800px] sm:max-h-[90vh]">
        <AuthView />
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="relative w-full max-w-[420px] h-[100dvh] bg-tg-bg-light shadow-2xl overflow-hidden sm:rounded-[24px] sm:h-[800px] sm:max-h-[90vh]">
        <PasscodeScreen />
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[420px] h-[100dvh] bg-tg-bg-light shadow-2xl overflow-hidden sm:rounded-[24px] sm:h-[800px] sm:max-h-[90vh]">
      <AnimatePresence initial={false} mode="popLayout">
        {view === 'menu' && <ChatList key="menu" />}
        {view === 'chat' && <ChatView key="chat" />}
        {view === 'profile' && <ProfileView key="profile" />}
        {view === 'settings' && <SettingsView key="settings" />}
        {view === 'chat-settings' && <ChatSettingsView key="chat-settings" />}
        {view === 'features' && <FeaturesView key="features" />}
        {view === 'privacy' && <PrivacyView key="privacy" />}
        {view === 'notifications' && <NotificationsView key="notifications" />}
        {view === 'security' && <SecurityView key="security" />}
        {view === 'admin' && <AdminView key="admin" />}
      </AnimatePresence>
      <SideMenu />
    </div>
  );
}

export default function Page() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}
