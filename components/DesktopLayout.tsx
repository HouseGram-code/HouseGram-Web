'use client';

import { useChat } from '@/context/ChatContext';
import {
  User,
  MessageSquare,
  Settings,
  Smartphone,
  Wallet,
  Gift,
  Gamepad2,
  Star,
  Newspaper,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

// ChatList подгружаем динамически, чтобы не утяжелять первый рендер
// лейаута: если пользователь не на десктопе, чанк ChatList всё равно
// не потребуется.
const ChatList = dynamic(() => import('./ChatList'));
const SideMenu = dynamic(() => import('./SideMenu'));

interface DesktopLayoutProps {
  children: React.ReactNode;
}

type NavView =
  | 'menu'
  | 'profile'
  | 'my-gifts'
  | 'wallet'
  | 'mini-games'
  | 'stars'
  | 'news'
  | 'settings';

const NAV_ITEMS: Array<{ icon: typeof User; label: string; view: NavView }> = [
  { icon: MessageSquare, label: 'Чаты', view: 'menu' },
  { icon: User, label: 'Профиль', view: 'profile' },
  { icon: Gift, label: 'Мои подарки', view: 'my-gifts' },
  { icon: Star, label: 'Молнии', view: 'stars' },
  { icon: Wallet, label: 'Кошелёк', view: 'wallet' },
  { icon: Gamepad2, label: 'Игры', view: 'mini-games' },
  { icon: Newspaper, label: 'Новости', view: 'news' },
  { icon: Settings, label: 'Настройки', view: 'settings' },
];

/**
 * Десктопный лейаут в стиле Telegram/WhatsApp Desktop: три колонки.
 *   [72px навигация]  [360px список чатов]  [flex-1 активный view]
 *
 * Список чатов виден всегда, при клике по чату открывается правая
 * панель, при навигации в настройки/профиль — заменяется только
 * правая панель, не теряя контекст переписки слева.
 */
export default function DesktopLayout({ children }: DesktopLayoutProps) {
  const { isDarkMode, view, setView, userProfile, themeColor } = useChat();

  const switchToMobile = () => {
    window.dispatchEvent(new CustomEvent('toggleDesktopMode'));
  };

  return (
    <div
      className={`fixed inset-0 w-full h-[100dvh] flex ${
        isDarkMode ? 'bg-[#0f0f0f] text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      {/* Левая тонкая навигационная панель */}
      <nav
        className={`w-[72px] shrink-0 flex flex-col items-center gap-1 py-3 pl-safe border-r ${
          isDarkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <button
          onClick={() => setView('profile')}
          className="relative w-12 h-12 rounded-full mb-2 overflow-hidden ring-2 ring-transparent hover:ring-white/30 transition-all"
          title={userProfile.name || 'Профиль'}
          style={{
            boxShadow: `0 0 0 2px ${view === 'profile' ? themeColor : 'transparent'}`,
          }}
        >
          {userProfile.avatarUrl ? (
            <Image
              src={userProfile.avatarUrl}
              alt={userProfile.name || 'Avatar'}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
              style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}
            >
              {(userProfile.name || 'U')[0]?.toUpperCase()}
            </div>
          )}
        </button>

        <div className="flex flex-col items-center gap-1 flex-1 w-full">
          {NAV_ITEMS.map((item) => {
            const isActive = view === item.view;
            const Icon = item.icon;
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                title={item.label}
                className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? isDarkMode
                      ? 'bg-gray-800'
                      : 'bg-gray-100'
                    : isDarkMode
                    ? 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                style={isActive ? { color: themeColor } : undefined}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
                    style={{ backgroundColor: themeColor }}
                  />
                )}
                <Icon size={22} />
              </button>
            );
          })}
        </div>

        <button
          onClick={switchToMobile}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            isDarkMode
              ? 'text-gray-500 hover:bg-gray-800/60 hover:text-gray-300'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
          title="Мобильный режим"
        >
          <Smartphone size={20} />
        </button>
      </nav>

      {/* Список чатов — всегда виден. Внутри собственные анимации/состояние. */}
      <aside
        className={`relative w-[360px] shrink-0 border-r overflow-hidden ${
          isDarkMode ? 'border-gray-800 bg-[#0f0f0f]' : 'border-gray-200 bg-white'
        }`}
      >
        <ChatList />
        <SideMenu />
      </aside>

      {/* Активный экран (чат/настройки/профиль/...) */}
      <main
        className={`flex-1 flex flex-col overflow-hidden relative pr-safe ${
          isDarkMode ? 'bg-[#0f0f0f]' : 'bg-gray-50'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
