'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bookmark, Settings, HelpCircle, User, Shield, LogOut,
  BadgeCheck, Info, PlusCircle, Zap, Wallet, Gamepad2,
  Bot, Newspaper, ChevronRight, Smartphone, Monitor, Crown
} from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function SideMenu() {
  const { isSideMenuOpen, setSideMenuOpen, setView, themeColor, userProfile, setActiveChatId, isAdmin, logout } = useChat();
  const [isDesktopMode, setIsDesktopMode] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktopMode(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggleDesktop = () => {
    window.dispatchEvent(new CustomEvent('toggleDesktopMode'));
    setIsDesktopMode(p => !p);
    setSideMenuOpen(false);
  };

  const go = (view: string) => { setView(view as any); setSideMenuOpen(false); };

  return (
    <AnimatePresence>
      {isSideMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSideMenuOpen(false)}
            className="absolute inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="absolute top-0 left-0 h-full z-50 flex flex-col shadow-2xl overflow-hidden"
            style={{
              width: 'min(85vw, 320px)',
              backgroundColor: '#ffffff',
            }}
          >
            {/* ── Profile Header ── */}
            <div
              className="relative flex flex-col justify-end px-5 pb-5 pt-12 text-white overflow-hidden shrink-0"
              style={{
                background: `linear-gradient(155deg, ${themeColor} 0%, ${themeColor}cc 60%, ${themeColor}99 100%)`,
                minHeight: 170,
              }}
            >
              {/* Декоративные пузыри */}
              <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute top-10 -left-4 w-20 h-20 rounded-full bg-white/8 blur-xl" />

              <div className="relative z-10 flex items-end gap-4">
                {/* Avatar */}
                <div
                  className="w-16 h-16 rounded-full overflow-hidden shrink-0 ring-2 ring-white/40 shadow-xl"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  {userProfile.avatarUrl ? (
                    <Image
                      src={userProfile.avatarUrl}
                      alt="Avatar"
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={30} className="text-white/90" />
                    </div>
                  )}
                </div>

                {/* Name + status */}
                <div className="flex-grow min-w-0 pb-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-[17px] leading-snug drop-shadow">
                    <span className="truncate">{userProfile.name || 'Пользователь'}</span>
                    {userProfile.isOfficial && (
                      <BadgeCheck size={17} className="shrink-0 text-white/90" fill="rgba(255,255,255,0.3)" />
                    )}
                  </div>
                  {userProfile.username && (
                    <div className="text-[13px] text-white/75 font-medium truncate">
                      {userProfile.username.startsWith('@') ? userProfile.username : `@${userProfile.username}`}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-300 shadow-sm shadow-green-300" />
                    <span className="text-[12px] text-white/70 font-medium">онлайн</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Scrollable menu ── */}
            <ul className="flex-grow overflow-y-auto py-2 px-2" style={{ backgroundColor: '#ffffff' }}>

              {/* — Основное — */}
              <SectionLabel label="Основное" />
              <MenuItem
                icon={<PlusCircle size={20} />}
                text="Создать канал"
                color={themeColor}
                onClick={() => go('create-channel')}
              />
              <MenuItem
                icon={<Bookmark size={20} />}
                text="Избранное"
                color="#6366f1"
                onClick={() => { setActiveChatId('saved_messages'); setView('chat' as any); setSideMenuOpen(false); }}
              />

              <Divider />

              {/* — Возможности — */}
              <SectionLabel label="Возможности" />
              <MenuItem
                icon={<Zap size={20} />}
                text="Молнии"
                color="#f59e0b"
                onClick={() => go('stars')}
              />
              <MenuItem
                icon={<Crown size={20} />}
                text="HouseGram Premium"
                color="#a855f7"
                onClick={() => go('premium')}
              />
              <MenuItem
                icon={<Wallet size={20} />}
                text="Кошелёк"
                color="#10b981"
                onClick={() => go('wallet')}
              />
              <MenuItem
                icon={<Gamepad2 size={20} />}
                text="Мини-игры"
                color="#3b82f6"
                onClick={() => go('mini-games')}
              />
              <MenuItem
                icon={<Bot size={20} />}
                text="BotMaster"
                color="#8b5cf6"
                onClick={() => go('botfather')}
              />
              <MenuItem
                icon={<Newspaper size={20} />}
                text="Новости"
                color="#ef4444"
                onClick={() => go('news')}
              />

              <Divider />

              {/* — Настройки — */}
              <SectionLabel label="Настройки" />
              <MenuItem
                icon={<Settings size={20} />}
                text="Настройки"
                color="#64748b"
                onClick={() => go('settings')}
              />
              <MenuItem
                icon={<HelpCircle size={20} />}
                text="Возможности HouseGram"
                color="#0ea5e9"
                onClick={() => go('features')}
              />
              <MenuItem
                icon={<Info size={20} />}
                text="О приложении"
                color="#94a3b8"
                onClick={() => go('info')}
              />
              <MenuItem
                icon={isDesktopMode ? <Smartphone size={20} /> : <Monitor size={20} />}
                text={isDesktopMode ? 'Мобильный режим' : 'Desktop режим'}
                color="#475569"
                onClick={toggleDesktop}
              />

              {/* — Админ — */}
              {isAdmin && (
                <>
                  <Divider />
                  <MenuItem
                    icon={<Shield size={20} />}
                    text="Панель администратора"
                    color="#ef4444"
                    onClick={() => go('admin')}
                    danger
                  />
                </>
              )}

              <Divider />
              <MenuItem
                icon={<LogOut size={20} />}
                text="Выйти из аккаунта"
                color="#ef4444"
                onClick={() => { logout(); setSideMenuOpen(false); }}
                danger
              />
            </ul>

            {/* ── Footer ── */}
            <div
              className="px-5 py-3 flex items-center justify-between shrink-0"
              style={{ borderTop: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}
            >
              <div>
                <div className="text-[13px] font-semibold text-gray-600">HouseGram Web</div>
                <div className="text-[11px] text-gray-400 mt-0.5">v2.2 beta · Быстро. Безопасно.</div>
              </div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: themeColor + '18' }}
              >
                <Zap size={15} style={{ color: themeColor }} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <li className="px-4 pt-3 pb-1">
      <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
    </li>
  );
}

function Divider() {
  return <li className="my-1 mx-3" style={{ height: 1, backgroundColor: '#f1f5f9' }} />;
}

function MenuItem({
  icon, text, color, onClick, danger,
}: {
  icon: React.ReactNode;
  text: string;
  color: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <li
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 cursor-pointer transition-all duration-150 group active:scale-[0.98]"
      style={{ '--hover-bg': danger ? '#fef2f2' : '#f8fafc' } as React.CSSProperties}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = danger ? '#fef2f2' : '#f8fafc'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
    >
      {/* Icon bubble */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
        style={{ backgroundColor: (danger ? '#ef4444' : color) + '18', color: danger ? '#ef4444' : color }}
      >
        {icon}
      </div>
      <span
        className="text-[15px] font-medium flex-grow"
        style={{ color: danger ? '#ef4444' : '#1e293b' }}
      >
        {text}
      </span>
      <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
    </li>
  );
}
