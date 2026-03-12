'use client';

import { useChat } from '@/context/ChatContext';
import { Menu, Search, Edit2, Bookmark, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function ChatList() {
  const { contacts, setView, setActiveChatId, setSideMenuOpen, markAsRead, themeColor, isGlassEnabled, addContact } = useChat();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const searchUsers = async () => {
        const q = query(collection(db, 'users'), where('username', '>=', searchQuery), where('username', '<=', searchQuery + '\uf8ff'));
        const snapshot = await getDocs(q);
        const results = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.id !== auth.currentUser?.uid);
        setSearchResults(results);
      };
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

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
      avatarColor: '#517da2', // Default color
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
    });
    setActiveChatId(user.id);
    setView('chat');
    setIsSearching(false);
    setSearchQuery('');
  };

  const sortedContacts = Object.values(contacts)
    .filter(c => c.id === 'saved_messages' || c.messages.length > 0)
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
      if (!lastA) return 1;
      if (!lastB) return -1;
      return 0; 
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
      transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
      className="absolute inset-0 bg-tg-bg-light flex flex-col"
    >
      <div 
        className={`text-tg-header-text px-3 h-12 flex items-center gap-4 shrink-0 absolute top-0 left-0 w-full z-20 transition-colors ${isGlassEnabled ? 'backdrop-blur-md border-b border-black/10' : ''}`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'CC' : themeColor }}
      >
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div 
              key="search"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center w-full gap-2"
            >
              <button 
                onClick={() => { setIsSearching(false); setSearchQuery(''); }} 
                className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <input 
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск (например, @username)"
                className="flex-grow bg-transparent border-none outline-none text-white placeholder-white/70 text-[16px]"
              />
            </motion.div>
          ) : (
            <motion.div 
              key="header"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center w-full gap-4"
            >
              <button onClick={() => setSideMenuOpen(true)} className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors">
                <Menu size={24} />
              </button>
              <div className="flex-grow text-[17px] font-medium">HouseGram</div>
              <button 
                onClick={() => setIsSearching(true)}
                className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
              >
                <Search size={24} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-grow overflow-y-auto pt-12 no-scrollbar">
        {isSearching && searchQuery.trim().length > 2 && (
          <div className="px-4 py-2 text-[14px] font-medium text-gray-500">Результаты поиска</div>
        )}
        {isSearching && searchQuery.trim().length > 2 && searchResults.map(user => (
          <div 
            key={user.id} 
            onClick={() => handleSearchResultClick(user)}
            className="flex items-center px-4 py-2 cursor-pointer border-b border-tg-divider hover:bg-gray-50 active:bg-gray-100 transition-colors gap-3"
          >
            <div className="w-[50px] h-[50px] rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium shrink-0">
              {user.name?.charAt(0) || '?'}
            </div>
            <div className="flex-grow overflow-hidden flex flex-col justify-center">
              <div className="font-medium text-[16px] text-tg-text-primary mb-0.5 truncate">{user.name}</div>
              <div className="text-[14px] text-tg-secondary-text truncate leading-snug">{user.username ? (user.username.startsWith('@') ? user.username : `@${user.username}`) : ''}</div>
            </div>
          </div>
        ))}
        {(!isSearching || searchQuery.trim().length <= 2) && sortedContacts.map(contact => {
          const lastMsg = contact.messages[contact.messages.length - 1];
          const previewText = lastMsg ? (lastMsg.type === 'sent' ? `Вы: ${lastMsg.text}` : lastMsg.text) : '';
          
          return (
            <div 
              key={contact.id} 
              onClick={() => handleChatClick(contact.id)}
              className="flex items-center px-4 py-3 cursor-pointer border-b border-tg-divider hover:bg-gray-50 active:bg-gray-100 transition-colors gap-3"
            >
              {contact.id === 'saved_messages' ? (
                <div 
                  className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: contact.avatarColor }}
                >
                  <Bookmark size={24} fill="currentColor" />
                </div>
              ) : contact.avatarUrl ? (
                <Image 
                  src={contact.avatarUrl} 
                  alt={contact.name} 
                  width={50} 
                  height={50} 
                  className="rounded-full object-cover shrink-0" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div 
                  className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white font-medium text-lg shrink-0"
                  style={{ backgroundColor: contact.avatarColor }}
                >
                  {contact.initial}
                </div>
              )}
              <div className="flex-grow overflow-hidden flex flex-col justify-center">
                <div className="font-medium text-[16px] text-tg-text-primary mb-0.5 truncate flex items-center gap-1">
                  {contact.name}
                  {contact.isChannel && <CheckCircle size={14} className="text-blue-500 fill-blue-500 text-white" />}
                </div>
                <div className="text-[14px] text-tg-secondary-text truncate leading-snug">{previewText}</div>
              </div>
              <div className="flex flex-col items-end text-[12px] text-tg-secondary-text ml-2 shrink-0 gap-1">
                <div>{lastMsg?.time}</div>
                {contact.unread > 0 && (
                  <div 
                    className="text-white text-[11px] font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-tight"
                    style={{ backgroundColor: themeColor }}
                  >
                    {contact.unread}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isSearching && searchQuery.trim().length > 2 && searchResults.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="text-[16px] font-medium text-gray-600">Ничего не найдено</p>
            <p className="text-[14px] mt-1">Попробуйте изменить запрос</p>
          </div>
        )}
      </div>

      <button 
        className="absolute bottom-5 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all text-white z-10"
        style={{ backgroundColor: themeColor }}
      >
        <Edit2 size={24} />
      </button>
    </motion.div>
  );
}
