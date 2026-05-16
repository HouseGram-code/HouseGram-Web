'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Settings, User } from 'lucide-react';
import Image from 'next/image';
import { useMemo } from 'react';

const SETTINGS_VIEWS = new Set([
  'settings', 'chat-settings', 'notifications', 'security',
  'privacy', 'privacy-settings', 'features', 'proxy',
  'notification-stats', 'server-status', 'info', 'faq', 'terms',
]);

const PROFILE_VIEWS = new Set([
  'profile', 'my-gifts', 'user-gifts', 'my-stories', 'premium',
  'stars', 'wallet', 'buy-stars', 'mini-games', 'news',
  'send-gift', 'botfather',
]);

const SHOW_TAB_VIEWS = new Set([
  'menu', ...SETTINGS_VIEWS, ...PROFILE_VIEWS,
]);

function getActiveTab(view: string): 'menu' | 'settings' | 'profile' | null {
  if (view === 'menu') return 'menu';
  if (SETTINGS_VIEWS.has(view)) return 'settings';
  if (PROFILE_VIEWS.has(view)) return 'profile';
  return null;
}

export default function BottomTabBar() {
  const { view, setView, isDarkMode, themeColor, contacts, userProfile } = useChat();

  const unread = useMemo(
    () => Object.values(contacts).reduce((sum, c) => sum + (c.unread || 0), 0),
    [contacts],
  );

  const activeTab = getActiveTab(view);
  const visible = SHOW_TAB_VIEWS.has(view);

  const TABS = [
    { id: 'menu' as const, icon: MessageSquare, label: 'Чаты', badge: unread },
    { id: 'settings' as const, icon: Settings, label: 'Настройки' },
    { id: 'profile' as const, icon: User, label: 'Профиль' },
  ];

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="bottom-tab-bar"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="shrink-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div
          className={`flex items-center justify-around px-2 border-t ${
            isDarkMode
              ? 'bg-[#1c1c1e]/96 border-[#38383a]'
              : 'bg-white/95 border-gray-200/80'
          }`}
          style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <motion.button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative"
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                {/* Icon wrapper */}
                <div className="relative">
                  {tab.id === 'profile' && userProfile?.avatarUrl ? (
                    <div
                      className="w-7 h-7 rounded-full overflow-hidden"
                      style={{
                        outline: isActive ? `2px solid ${themeColor}` : '2px solid transparent',
                        outlineOffset: '1px',
                      }}
                    >
                      <Image
                        src={userProfile.avatarUrl}
                        alt="avatar"
                        width={28}
                        height={28}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <motion.div
                      animate={isActive ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon
                        size={26}
                        strokeWidth={isActive ? 2.2 : 1.6}
                        fill={isActive && tab.id === 'menu' ? themeColor : 'none'}
                        style={{
                          color: isActive ? themeColor : isDarkMode ? '#8e8e93' : '#8e8e93',
                          transition: 'color 0.2s',
                        }}
                      />
                    </motion.div>
                  )}

                  {/* Unread badge */}
                  <AnimatePresence>
                    {tab.badge && tab.badge > 0 && (
                      <motion.span
                        key="badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] rounded-full bg-[#ff3b30] text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-sm"
                      >
                        {tab.badge > 99 ? '99+' : tab.badge}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Label */}
                <span
                  className="text-[10px] font-medium leading-none"
                  style={{
                    color: isActive ? themeColor : isDarkMode ? '#8e8e93' : '#8e8e93',
                    transition: 'color 0.2s',
                  }}
                >
                  {tab.label}
                </span>

                {/* Active dot */}
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      layoutId="tab-dot"
                      initial={{ opacity: 0, scaleX: 0.5 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0.5 }}
                      className="absolute top-0.5 left-1/2 -translate-x-1/2 w-5 h-1 rounded-full"
                      style={{ backgroundColor: themeColor }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
