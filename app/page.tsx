'use client';

import { ChatProvider, useChat } from '@/context/ChatContext';
import { AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { Suspense, useMemo } from 'react';
import { isDemoMode } from '@/lib/firebase';
import { isSupabaseDemoMode } from '@/lib/supabase';

// Компонент для отображения демо-режима
function DemoBanner() {
  if (!isDemoMode && !isSupabaseDemoMode) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 text-center text-sm font-medium z-50 shadow-lg">
      🎭 ДЕМО РЕЖИМ: Приложение работает с тестовыми данными. Для полной функциональности настройте Firebase и Supabase.
    </div>
  );
}

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
const MyStoriesView = dynamic(() => import('@/components/MyStoriesView'), {
  loading: () => <LoadingSpinner />
});
const NewsView = dynamic(() => import('@/components/NewsView'), {
  loading: () => <LoadingSpinner />
});

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 bg-tg-bg-light flex items-center justify-center z-10">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

// Маппинг view к компонентам
const viewComponents: Record<string, React.ComponentType> = {
  menu: ChatList,
  chat: ChatView,
  profile: ProfileView,
  settings: SettingsView,
  'chat-settings': ChatSettingsView,
  features: FeaturesView,
  privacy: PrivacyView,
  'privacy-settings': PrivacySettingsView,
  notifications: NotificationsView,
  security: SecurityView,
  admin: AdminView,
  info: InfoView,
  faq: FaqView,
  terms: TermsView,
  'create-channel': CreateChannelView,
  'channel-info': ChannelInfoView,
  'notification-stats': NotificationStatsView,
  'server-status': ServerStatusView,
  stars: StarsView,
  premium: PremiumView,
  'send-gift': SendGiftView,
  'my-gifts': MyGiftsView,
  'user-gifts': UserGiftsView,
  'buy-stars': BuyStarsView,
  'my-stories': MyStoriesView,
  news: NewsView,
};

function AppContent() {
  const { view, isLocked, user, isDarkMode, activeChatId } = useChat();

  // Контейнер-обёртка
  const AppShell = ({ children }: { children: React.ReactNode }) => (
    <div className={`relative w-full h-[100dvh] overflow-hidden sm:max-w-[420px] sm:shadow-2xl sm:rounded-[24px] sm:h-[800px] sm:max-h-[90vh] ${isDarkMode ? 'bg-[#0f0f0f] dark' : 'bg-tg-bg-light'}`}>
      {children}
    </div>
  );

  if (view === 'auth' || !user) {
    return (
      <AppShell>
        <Suspense fallback={<LoadingSpinner />}>
          <AuthView />
        </Suspense>
      </AppShell>
    );
  }

  if (isLocked) {
    return (
      <AppShell>
        <Suspense fallback={<LoadingSpinner />}>
          <PasscodeScreen />
        </Suspense>
      </AppShell>
    );
  }

  // Рендерим активный view через маппинг
  const ActiveView = viewComponents[view];

  return (
    <AppShell>

      <AnimatePresence initial={false} mode="popLayout">
        {ActiveView && <ActiveView key={`${view}-${activeChatId || 'none'}`} />}
      </AnimatePresence>
      <SideMenu />
    </AppShell>
  );
}

export default function Page() {
  return (
    <>
      <DemoBanner />
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </>
  );
}
