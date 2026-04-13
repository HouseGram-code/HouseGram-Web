'use client';

import { ChatProvider, useChat } from '@/context/ChatContext';
import { AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Динамический импорт компонентов для быстрой загрузки
const ChatList = dynamic(() => import('@/components/ChatList'), {
  loading: () => <LoadingSpinner />
});
const ChatView = dynamic(() => import('@/components/ChatView'), {
  loading: () => <LoadingSpinner />
});
const ProfileView = dynamic(() => import('@/components/ProfileView'), {
  loading: () => <LoadingSpinner />
});
const SideMenu = dynamic(() => import('@/components/SideMenu'));
const SettingsView = dynamic(() => import('@/components/SettingsView'), {
  loading: () => <LoadingSpinner />
});
const ChatSettingsView = dynamic(() => import('@/components/ChatSettingsView'), {
  loading: () => <LoadingSpinner />
});
const FeaturesView = dynamic(() => import('@/components/FeaturesView'), {
  loading: () => <LoadingSpinner />
});
const PrivacyView = dynamic(() => import('@/components/PrivacyView'), {
  loading: () => <LoadingSpinner />
});
const PrivacySettingsView = dynamic(() => import('@/components/PrivacySettingsView'), {
  loading: () => <LoadingSpinner />
});
const NotificationsView = dynamic(() => import('@/components/NotificationsView'), {
  loading: () => <LoadingSpinner />
});
const SecurityView = dynamic(() => import('@/components/SecurityView'), {
  loading: () => <LoadingSpinner />
});
const PasscodeScreen = dynamic(() => import('@/components/PasscodeScreen'));
const AuthView = dynamic(() => import('@/components/AuthView'));
const AdminView = dynamic(() => import('@/components/AdminView'), {
  loading: () => <LoadingSpinner />
});
const InfoView = dynamic(() => import('@/components/InfoView'), {
  loading: () => <LoadingSpinner />
});
const FaqView = dynamic(() => import('@/components/FaqView'), {
  loading: () => <LoadingSpinner />
});
const StarBackground = dynamic(() => import('@/components/StarBackground'), {
  ssr: false
});
const TermsView = dynamic(() => import('@/components/TermsView'), {
  loading: () => <LoadingSpinner />
});
const CreateChannelView = dynamic(() => import('@/components/CreateChannelView'), {
  loading: () => <LoadingSpinner />
});
const ChannelInfoView = dynamic(() => import('@/components/ChannelInfoView'), {
  loading: () => <LoadingSpinner />
});
const NotificationStatsView = dynamic(() => import('@/components/NotificationStatsView'), {
  loading: () => <LoadingSpinner />
});
const ServerStatusView = dynamic(() => import('@/components/ServerStatusView'), {
  loading: () => <LoadingSpinner />
});
const StarsView = dynamic(() => import('@/components/StarsView'), {
  loading: () => <LoadingSpinner />
});
const SendGiftView = dynamic(() => import('@/components/SendGiftView'), {
  loading: () => <LoadingSpinner />
});
const MyGiftsView = dynamic(() => import('@/components/MyGiftsView'), {
  loading: () => <LoadingSpinner />
});
const UserGiftsView = dynamic(() => import('@/components/UserGiftsView'), {
  loading: () => <LoadingSpinner />
});
const PremiumView = dynamic(() => import('@/components/PremiumView'), {
  loading: () => <LoadingSpinner />
});
const BuyStarsView = dynamic(() => import('@/components/BuyStarsView'), {
  loading: () => <LoadingSpinner />
});

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 bg-tg-bg-light flex items-center justify-center z-10">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

function AppContent() {
  const { view, isLocked, user } = useChat();

  if (view === 'auth' || !user) {
    return (
      <div className="relative w-full h-[100dvh] bg-tg-bg-light overflow-hidden sm:max-w-[420px] sm:shadow-2xl sm:rounded-[24px] sm:h-[800px] sm:max-h-[90vh]">
        <Suspense fallback={<LoadingSpinner />}>
          <AuthView />
        </Suspense>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="relative w-full h-[100dvh] bg-tg-bg-light overflow-hidden sm:max-w-[420px] sm:shadow-2xl sm:rounded-[24px] sm:h-[800px] sm:max-h-[90vh]">
        <Suspense fallback={<LoadingSpinner />}>
          <PasscodeScreen />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh] bg-tg-bg-light overflow-hidden sm:max-w-[420px] sm:shadow-2xl sm:rounded-[24px] sm:h-[800px] sm:max-h-[90vh]">
      {/* Анимированный фон со звездами */}
      <StarBackground />
      
      <AnimatePresence initial={false} mode="popLayout">
        {view === 'menu' && <ChatList key="menu" />}
        {view === 'chat' && <ChatView key="chat" />}
        {view === 'profile' && <ProfileView key="profile" />}
        {view === 'settings' && <SettingsView key="settings" />}
        {view === 'chat-settings' && <ChatSettingsView key="chat-settings" />}
        {view === 'features' && <FeaturesView key="features" />}
        {view === 'privacy' && <PrivacyView key="privacy" />}
        {view === 'privacy-settings' && <PrivacySettingsView key="privacy-settings" />}
        {view === 'notifications' && <NotificationsView key="notifications" />}
        {view === 'security' && <SecurityView key="security" />}
        {view === 'admin' && <AdminView key="admin" />}
        {view === 'info' && <InfoView key="info" />}
        {view === 'faq' && <FaqView key="faq" />}
        {view === 'terms' && <TermsView key="terms" />}
        {view === 'create-channel' && <CreateChannelView key="create-channel" />}
        {view === 'channel-info' && <ChannelInfoView key="channel-info" />}
        {view === 'notification-stats' && <NotificationStatsView key="notification-stats" />}
        {view === 'server-status' && <ServerStatusView key="server-status" />}
        {view === 'stars' && <StarsView key="stars" />}
        {view === 'premium' && <PremiumView key="premium" />}
        {view === 'send-gift' && <SendGiftView key="send-gift" />}
        {view === 'my-gifts' && <MyGiftsView key="my-gifts" />}
        {view === 'user-gifts' && <UserGiftsView key="user-gifts" />}
        {view === 'buy-stars' && <BuyStarsView key="buy-stars" />}
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
