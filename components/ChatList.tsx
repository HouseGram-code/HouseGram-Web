'use client';

import { useChat } from '@/context/ChatContext';
import { Menu, Search, Edit2, Bookmark, ArrowLeft, BadgeCheck, Monitor, Smartphone, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import Stories from './Stories';
import PremiumBadge from './PremiumBadge';
import PremiumModal from './PremiumModal';

// Генерация цвета аватара на основе ID пользователя
const getAvatarColor = (userId: string) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    '#E63946', '#457B9D', '#F77F00', '#06FFA5', '#8338EC'
  ];
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export default function ChatList() {
  const { contacts, setView, setActiveChatId, setSideMenuOpen, markAsRead, themeColor, isGlassEnabled, addContact } = useChat();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedPremiumUser, setSelectedPremiumUser] = useState<string>('');
  const [isDesktopMode, setIsDesktopMode] = useState(false);

  // Check if desktop mode on mount
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktopMode(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const toggleDesktopMode = () => {
    console.log('Toggle button clicked, current isDesktopMode:', isDesktopMode);
    window.dispatchEvent(new CustomEvent('toggleDesktopMode'));
    setIsDesktopMode(!isDesktopMode);
  };

  // Debounce поиска (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;
    if (debouncedQuery.trim().length > 0) {
      const searchUsers = async () => {
        const queryText = debouncedQuery.trim().toLowerCase();
        // Try searching by username (with or without @)
        const usernameQuery = queryText.startsWith('@') ? queryText : `@${queryText}`;

        // Search users
        const usersQuery = query(collection(db, 'users'), where('username', '>=', usernameQuery), where('username', '<=', usernameQuery + '\uf8ff'));
        const usersSnapshot = await getDocs(usersQuery);
        
        // Search bots
        const botsQuery = query(collection(db, 'bots'), where('username', '>=', queryText), where('username', '<=', queryText + '\uf8ff'));
        const botsSnapshot = await getDocs(botsQuery);
        
        if (!isMounted) return;
        
        const userResults = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.id !== auth.currentUser?.uid);
        
        const botResults = botsSnapshot.docs
          .map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            isBot: true,
            username: '@' + doc.data().username,
            status: 'online'
          }));
        
        setSearchResults([...userResults, ...botResults]);
      };
      searchUsers();
    } else {
      Promise.resolve().then(() => {
        if (isMounted) setSearchResults([]);
      });
    }
    return () => { isMounted = false; };
  }, [debouncedQuery]);

  const handleSearchResultClick = (user: any) => {
    let statusText = 'был(а) недавно';
    if (user.status === 'online') {
      statusText = 'в сети';
    } else if (user.lastSeen) {
      try {
        let date;
        if (user.lastSeen.toDate) {
          date = user.lastSeen.toDate();
        } else if (user.lastSeen instanceof Date) {
          date = user.lastSeen;
        } else {
          date = new Date(user.lastSeen);
        }
        const distance = formatDistanceToNow(date, { addSuffix: true, locale: ru });
        if (distance === 'меньше минуты назад') {
          statusText = 'был(а) только что';
        } else {
          statusText = `был(а) ${distance}`;
        }
      } catch (e) {
        statusText = 'был(а) недавно';
      }
    }

    addContact({
      id: user.id,
      name: user.name,
      initial: user.name.charAt(0).toUpperCase(),
      avatarColor: getAvatarColor(user.id),
      avatarUrl: user.avatarUrl,
      statusOnline: 'в сети',
      statusOffline: statusText,
      phone: user.phone || '',
      bio: user.bio || '',
      username: user.username || '',
      messages: [],
      isTyping: false,
      unread: 0,
      isChannel: false,
      isOfficial: user.role === 'admin' || user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      premium: user.premium === true
    });
    setActiveChatId(user.id);
    setView('chat');
    setIsSearching(false);
    setSearchQuery('');
  };

  const sortedContacts = Object.values(contacts)
    .filter(c => c.id === 'saved_messages' || c.isChannel || c.messages.length > 0)
    .filter(c => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const nameMatch = c.name.toLowerCase().includes(query);
      const usernameMatch = c.username?.toLowerCase().includes(query);
      return nameMatch || usernameMatch;
    })
    .sort((a, b) => {
      const lastA = a.messages[a.messages.length - 1];
      const lastB = b.messages[b.messages.length - 1];
      if (!lastA && !lastB) return 0;
      if (!lastA) return 1;
      if (!lastB) return -1;
      const timeA = lastA.time || '';
      const timeB = lastB.time || '';
      return timeB.localeCompare(timeA);
    });

  const handleChatClick = (id: string) => {
    setActiveChatId(id);
    markAsRead(id);
    setView('chat');
  };

  return (
    <motion.div 
      initial={{ x: '-20%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-20%', opacity: 0 }}
      transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
      className="absolute inset-0 bg-tg-bg-light flex flex-col"
    >
      <div 
        className={`text-tg-header-text px-3 h-14 flex items-center gap-4 shrink-0 absolute top-0 left-0 w-full z-20 transition-all duration-300 ${isGlassEnabled ? 'backdrop-blur-xl border-b border-white/20 shadow-lg' : 'shadow-md'}`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'DD' : themeColor }}
      >
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div 
              key="search"
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -20 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
              className="flex items-center w-full gap-2"
            >
              <button 
                onClick={() => { setIsSearching(false); setSearchQuery(''); }} 
                className="p-2 rounded-full hover:bg-white/15 active:bg-white/25 transition-all duration-200"
              >
                <ArrowLeft size={22} />
              </button>
              <input 
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск пользователей..."
                className="flex-grow bg-white/10 border border-white/20 rounded-full px-4 py-2 outline-none text-white placeholder-white/60 text-[15px] focus:bg-white/15 focus:border-white/30 transition-all"
              />
            </motion.div>
          ) : (
            <motion.div 
              key="header"
              initial={{ opacity: 0, scale: 0.95, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
              className="flex items-center w-full gap-4"
            >
              <button onClick={() => setSideMenuOpen(true)} className="p-2 rounded-full hover:bg-white/15 active:bg-white/25 transition-all duration-200">
                <Menu size={22} />
              </button>
              <div className="flex-grow text-[19px] font-semibold tracking-tight">
                HouseGram
              </div>
              <button 
                onClick={toggleDesktopMode}
                className="p-2 rounded-full hover:bg-white/15 active:bg-white/25 transition-all duration-200"
                title={isDesktopMode ? "Мобильный режим" : "Desktop режим"}
              >
                {isDesktopMode ? <Smartphone size={22} /> : <Monitor size={22} />}
              </button>
              <button 
                onClick={() => setView('botfather')}
                className="p-2 rounded-full hover:bg-white/15 active:bg-white/25 transition-all duration-200"
                title="BotMaster - Создать бота"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2"/>
                  <circle cx="12" cy="5" r="2"/>
                  <path d="M12 7v4"/>
                  <line x1="8" y1="16" x2="8" y2="16"/>
                  <line x1="16" y1="16" x2="16" y2="16"/>
                </svg>
              </button>
              <button 
                onClick={() => setView('news')}
                className="p-2 rounded-full hover:bg-white/15 active:bg-white/25 transition-all duration-200"
                title="Новости"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
                  <path d="M18 14h-8"/>
                  <path d="M15 18h-5"/>
                  <path d="M10 6h8v4h-8z"/>
                </svg>
              </button>
              <button 
                onClick={() => setIsSearching(true)}
                className="p-2 rounded-full hover:bg-white/15 active:bg-white/25 transition-all duration-200"
              >
                <Search size={22} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-grow overflow-y-auto pt-14 no-scrollbar">
        {/* Stories - только когда не в режиме поиска */}
        {!isSearching && <Stories />}
        
        {isSearching && searchQuery.trim().length > 2 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 text-[13px] font-semibold text-gray-500 uppercase tracking-wide"
          >
            Результаты поиска
          </motion.div>
        )}
        {isSearching && searchQuery.trim().length > 2 && searchResults.map((user) => (
          <div
            key={user.id}
            onClick={() => handleSearchResultClick(user)}
            className="flex items-center px-3 py-2.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors duration-150 gap-3"
          >
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name}
                width={52}
                height={52}
                className="rounded-full object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0"
                style={{ backgroundColor: getAvatarColor(user.id) }}
              >
                {user.name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <div className="flex-grow min-w-0">
              <div className="font-semibold text-[15px] text-tg-text-primary truncate flex items-center gap-1.5">
                <span className="truncate">{user.name}</span>
                {(user.role === 'admin' || user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) && (
                  <BadgeCheck size={16} className="text-blue-500 fill-blue-500 shrink-0" />
                )}
              </div>
              <div className="text-[13px] text-tg-secondary-text truncate leading-snug">
                {user.username ? (user.username.startsWith('@') ? user.username : `@${user.username}`) : ''}
              </div>
            </div>
          </div>
        ))}
        {(!isSearching || searchQuery.trim().length <= 2) && sortedContacts.map((contact) => {
          const lastMsg = contact.messages[contact.messages.length - 1];
          const isOwnLast = lastMsg?.type === 'sent';
          let previewText = '';

          if (contact.isChannel) {
            previewText = lastMsg ? lastMsg.text : 'Постов пока нет';
          } else if (lastMsg) {
            previewText = lastMsg.text;
          }

          // Статус отправленного сообщения (Telegram-style галочки в превью).
          let StatusIcon: typeof Check | null = null;
          let statusColor = 'text-tg-secondary-text';
          if (isOwnLast && !contact.isChannel) {
            if (lastMsg?.status === 'read') {
              StatusIcon = CheckCheck;
              statusColor = 'text-blue-500';
            } else if (lastMsg?.status === 'sent') {
              StatusIcon = CheckCheck;
            } else {
              StatusIcon = Check;
            }
          }

          return (
            // Список чатов (Telegram Web A-style):
            //  - первая строка: имя + бейджи слева, время справа;
            //  - вторая строка: галочки статуса (для исходящего), превью
            //    или «печатает…» слева, unread-pill справа.
            //  motion.div убран ранее в перфоманс-PR — оставляем обычный div.
            <div
              key={contact.id}
              onClick={() => handleChatClick(contact.id)}
              className="flex items-center px-3 py-2.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors duration-150 gap-3"
            >
              {contact.id === 'saved_messages' ? (
                <div
                  className="w-[54px] h-[54px] rounded-full flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: contact.avatarColor }}
                >
                  <Bookmark size={26} fill="currentColor" />
                </div>
              ) : contact.avatarUrl ? (
                <Image
                  src={contact.avatarUrl}
                  alt={contact.name}
                  width={54}
                  height={54}
                  className="rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="w-[54px] h-[54px] rounded-full flex items-center justify-center text-white font-semibold text-xl shrink-0"
                  style={{ backgroundColor: contact.avatarColor }}
                >
                  {contact.initial}
                </div>
              )}
              <div className="flex-grow min-w-0 flex flex-col">
                <div className="flex items-center gap-1.5">
                  <div className="font-semibold text-[15px] text-tg-text-primary truncate flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{contact.name}</span>
                    {contact.isOfficial && <BadgeCheck size={16} className="text-blue-500 fill-blue-500 shrink-0" />}
                    {contact.premium && (
                      <PremiumBadge
                        size="sm"
                        onClick={(e) => {
                          e?.stopPropagation();
                          setSelectedPremiumUser(contact.name);
                          setShowPremiumModal(true);
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-grow" />
                  <div className="text-[12px] text-tg-secondary-text shrink-0 tabular-nums">{lastMsg?.time}</div>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {StatusIcon && !contact.isTyping && (
                    <StatusIcon size={16} className={`shrink-0 ${statusColor}`} />
                  )}
                  <div className="text-[14px] text-tg-secondary-text truncate leading-snug flex-grow min-w-0">
                    {contact.isTyping ? (
                      <span className="italic" style={{ color: themeColor }}>печатает…</span>
                    ) : (
                      <>
                        {isOwnLast && !contact.isChannel && previewText && (
                          <span className="text-tg-secondary-text">Вы: </span>
                        )}
                        {previewText}
                      </>
                    )}
                  </div>
                  {contact.unread > 0 && (
                    <span
                      className="text-white text-[12px] font-semibold rounded-full px-1.5 min-w-[20px] h-5 inline-flex items-center justify-center shrink-0"
                      style={{ backgroundColor: themeColor }}
                    >
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {isSearching && searchQuery.trim().length > 2 && searchResults.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Search size={48} className="opacity-30" />
            </div>
            <p className="text-[18px] font-semibold text-gray-700 mb-2">Ничего не найдено</p>
            <p className="text-[14px] text-gray-500">Попробуйте изменить запрос</p>
          </motion.div>
        )}
        {/* Empty state — ни активных чатов, ни поискового запроса */}
        {!isSearching && sortedContacts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center px-8 py-16 text-center"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-full flex items-center justify-center mb-5 shadow-md"
              style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}AA)` }}
            >
              <Edit2 size={38} className="text-white" />
            </motion.div>
            <h3 className="text-[18px] font-semibold text-tg-text-primary mb-1.5">
              Пока нет чатов
            </h3>
            <p className="text-[14px] text-tg-secondary-text max-w-[280px] leading-relaxed mb-5">
              Найдите пользователя по имени или @username и начните первую переписку.
            </p>
            <button
              onClick={() => { setIsSearching(true); setSearchQuery(''); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-[14px] font-medium shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
              style={{ backgroundColor: themeColor }}
            >
              <Search size={16} />
              Найти людей
            </button>
          </motion.div>
        )}
      </div>

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', bounce: 0.35, duration: 0.25 }}
        onClick={() => { setIsSearching(true); setSearchQuery(''); }}
        className="absolute bottom-5 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl active:shadow-md transition-shadow text-white z-10"
        style={{ backgroundColor: themeColor }}
        aria-label="Новый чат"
        title="Новый чат — поиск пользователя"
      >
        <Edit2 size={22} />
      </motion.button>

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        userName={selectedPremiumUser}
        onUpgrade={() => {
          setShowPremiumModal(false);
          setView('premium');
        }}
      />
    </motion.div>
  );
}