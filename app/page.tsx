'use client';

import { ChatProvider, useChat } from '@/context/ChatContext';
import { AnimatePresence, motion } from 'motion/react';
import dynamic from 'next/dynamic';
import { Suspense, useMemo, useState, useEffect } from 'react';
import { isDemoMode } from '@/lib/firebase';

// Компонент для отображения демо-режима
function DemoBanner() {
  if (!isDemoMode) return null;
  
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="fixed top-0 left-0 right-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-4 py-3 text-center text-sm font-medium z-50 shadow-2xl"
    >
      <div className="flex items-center justify-center gap-2">
        <motion.span
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
        >
          🎭
        </motion.span>
        <span className="font-bold">ДЕМО РЕЖИМ:</span>
        <span>Приложение работает с тестовыми данными</span>
      </div>
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
    </motion.div>
  );
}

// Динамический импорт компонентов для быстрой загрузки
const DesktopLayout = dynamic(() => import('@/components/DesktopLayout'));
const ModeToggleButton = dynamic(() => import('@/components/ModeToggleButton'));
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
const WalletView = dynamic(() => import('@/components/WalletView'), {
  loading: () => <LoadingSpinner />
});
const MiniGamesView = dynamic(() => import('@/components/MiniGamesView'), {
  loading: () => <LoadingSpinner />
});
const MyStoriesView = dynamic(() => import('@/components/MyStoriesView'), {
  loading: () => <LoadingSpinner />
});
const NewsView = dynamic(() => import('@/components/NewsView'), {
  loading: () => <LoadingSpinner />
});
const ProxyView = dynamic(() => import('@/components/ProxyView'), {
  loading: () => <LoadingSpinner />
});
const BotMasterView = dynamic(() => import('@/components/BotMasterView'), {
  loading: () => <LoadingSpinner />
});
const ConnectionLoader = dynamic(() => import('@/components/ConnectionLoader'));
const FrozenAccountScreen = dynamic(() => import('@/components/FrozenAccountScreen'));

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center z-10">
      <div className="text-center">
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mb-6"
        >
          <div className="relative w-24 h-24 mx-auto">
            {/* Outer Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500"
            />
            {/* Inner Ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 rounded-full border-4 border-transparent border-b-pink-500 border-l-cyan-500"
            />
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-4xl"
              >
                💬
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            HouseGram
          </h3>
          <div className="flex items-center justify-center gap-1">
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              className="w-2 h-2 bg-blue-500 rounded-full"
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="w-2 h-2 bg-purple-500 rounded-full"
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              className="w-2 h-2 bg-pink-500 rounded-full"
            />
          </div>
        </motion.div>
      </div>
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
  wallet: WalletView,
  'mini-games': MiniGamesView,
  'my-stories': MyStoriesView,
  news: NewsView,
  proxy: ProxyView,
  botfather: BotMasterView,
};

function AppContent() {
  const { view, isLocked, user, isDarkMode, activeChatId, isFrozen, frozenAt, frozenReason } = useChat();
  const [showConnectionLoader, setShowConnectionLoader] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [forceDesktop, setForceDesktop] = useState(false);

  useEffect(() => {
    // Определяем desktop режим
    const checkDesktop = () => {
      const shouldBeDesktop = window.innerWidth >= 1024 || forceDesktop;
      setIsDesktop(shouldBeDesktop);
      console.log('Desktop mode:', shouldBeDesktop, 'Width:', window.innerWidth, 'Force:', forceDesktop);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    
    return () => {
      window.removeEventListener('resize', checkDesktop);
    };
  }, [forceDesktop]);

  useEffect(() => {
    // Слушаем событие переключения режима
    const handleToggle = () => {
      console.log('Toggle event received, current forceDesktop:', forceDesktop);
      setForceDesktop(prev => {
        const newValue = !prev;
        console.log('Setting forceDesktop to:', newValue);
        return newValue;
      });
    };
    
    window.addEventListener('toggleDesktopMode', handleToggle);
    
    // Показываем лоадер только при первой загрузке
    const hasShownLoader = sessionStorage.getItem('housegram_loader_shown');
    if (hasShownLoader) {
      setShowConnectionLoader(false);
      setIsAppReady(true);
    }
    
    return () => {
      window.removeEventListener('toggleDesktopMode', handleToggle);
    };
  }, []);

  const handleConnectionComplete = () => {
    sessionStorage.setItem('housegram_loader_shown', 'true');
    setShowConnectionLoader(false);
    setIsAppReady(true);
  };

  // Префетч самых вероятных следующих экранов в idle-таймаут после того,
  // как первый кадр отрисован. Сами по себе dynamic-импорты ленивы, но мы
  // можем заранее начать качать их чанки, пока пользователь смотрит на
  // главное меню — переход в чат / настройки тогда будет мгновенным.
  useEffect(() => {
    if (!user || !isAppReady) return;
    const prefetch = () => {
      void import('@/components/ChatView');
      void import('@/components/SettingsView');
      void import('@/components/ProfileView');
    };
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    if (typeof ric === 'function') {
      ric(prefetch, { timeout: 2000 });
    } else {
      const t = setTimeout(prefetch, 1500);
      return () => clearTimeout(t);
    }
  }, [user, isAppReady]);

  // Контейнер-обёртка для мобильной версии
  const MobileShell = ({ children }: { children: React.ReactNode }) => (
    <div className={`relative w-full h-[100dvh] overflow-hidden sm:max-w-[420px] sm:shadow-2xl sm:rounded-[24px] sm:h-[800px] sm:max-h-[90vh] ${isDarkMode ? 'bg-[#0f0f0f] dark' : 'bg-tg-bg-light'}`}>
      {children}
    </div>
  );

  if (view === 'auth' || !user) {
    if (isDesktop) {
      return (
        <DesktopLayout>
          <Suspense fallback={<LoadingSpinner />}>
            <AuthView />
          </Suspense>
        </DesktopLayout>
      );
    }
    
    return (
      <MobileShell>
        <Suspense fallback={<LoadingSpinner />}>
          <AuthView />
        </Suspense>
      </MobileShell>
    );
  }

  // Проверка заморозки аккаунта
  if (isFrozen && frozenAt) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <FrozenAccountScreen frozenAt={frozenAt} reason={frozenReason || undefined} />
      </Suspense>
    );
  }

  if (isLocked) {
    if (isDesktop) {
      return (
        <DesktopLayout>
          <Suspense fallback={<LoadingSpinner />}>
            <PasscodeScreen />
          </Suspense>
        </DesktopLayout>
      );
    }
    
    return (
      <MobileShell>
        <Suspense fallback={<LoadingSpinner />}>
          <PasscodeScreen />
        </Suspense>
      </MobileShell>
    );
  }

  // Рендерим активный view через маппинг
  const ActiveView = viewComponents[view];

  // Desktop Layout
  if (isDesktop) {
    return (
      <DesktopLayout>
        {/* Connection Loader */}
        <ConnectionLoader 
          isVisible={showConnectionLoader} 
          onComplete={handleConnectionComplete} 
        />

        {/* Main App Content */}
        {isAppReady && (
          <AnimatePresence initial={false} mode="popLayout">
            {ActiveView && <ActiveView key={`${view}-${activeChatId || 'none'}`} />}
          </AnimatePresence>
        )}
      </DesktopLayout>
    );
  }

  // Mobile Layout
  return (
    <MobileShell>
      {/* Connection Loader */}
      <ConnectionLoader 
        isVisible={showConnectionLoader} 
        onComplete={handleConnectionComplete} 
      />

      {/* Main App Content */}
      {isAppReady && (
        <AnimatePresence initial={false} mode="popLayout">
          {ActiveView && <ActiveView key={`${view}-${activeChatId || 'none'}`} />}
        </AnimatePresence>
      )}
      <SideMenu />
    </MobileShell>
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
