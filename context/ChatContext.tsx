'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Contact, ViewState, UserProfile } from '@/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { initialContacts, generateBotResponse } from '@/lib/mockData';

interface ChatContextType {
  contacts: Record<string, Contact>;
  activeChatId: string | null;
  view: ViewState;
  themeColor: string;
  isSideMenuOpen: boolean;
  isAdmin: boolean;
  userProfile: UserProfile | null;
  authReady: boolean;
  wallpaper: string | null;
  isGlassEnabled: boolean;
  searchQuery: string;
  isDarkMode: boolean;
  setSearchQuery: (query: string) => void;
  setView: (view: ViewState) => void;
  setActiveChatId: (id: string | null) => void;
  setThemeColor: (color: string) => void;
  setSideMenuOpen: (isOpen: boolean) => void;
  sendMessage: (text: string, options?: any) => void;
  editMessage: (id: string, text: string) => void;
  deleteMessage: (id: string) => void;
  forwardMessage: (msg: any, toId: string) => void;
  clearHistory: (id: string) => void;
  deleteChat: (id: string) => void;
  markAsRead: (id: string) => void;
  addContact: (contact: Contact) => void;
  togglePin: (id: string) => void;
  setWallpaper: (url: string | null) => void;
  setIsGlassEnabled: (enabled: boolean) => void;
  setIsDarkMode: (enabled: boolean) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  addReaction: (messageId: string, emoji: string) => void;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  passcode: string | null;
  updatePasscode: (passcode: string | null) => void;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
  isAppReady: boolean;
  systemStatus: any;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<Record<string, Contact>>(initialContacts);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>('auth');
  const [themeColor, setThemeColor] = useState('#517da2');
  const [isSideMenuOpen, setSideMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [isGlassEnabled, setIsGlassEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [passcode, setPasscode] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [systemStatus, setSystemStatus] = useState({ status: 'green' });

  useEffect(() => {
    const savedContacts = localStorage.getItem('contacts');
    if (savedContacts) {
      try {
        const parsed = JSON.parse(savedContacts);
        // Merge initialContacts to ensure default bots/channels are always present
        setContacts({ ...initialContacts, ...parsed });
      } catch (e) {
        console.error('Failed to parse saved contacts', e);
      }
    }
    const savedTheme = localStorage.getItem('themeColor');
    if (savedTheme) setThemeColor(savedTheme);
    const savedWallpaper = localStorage.getItem('wallpaper');
    if (savedWallpaper) setWallpaper(savedWallpaper);
    const savedGlass = localStorage.getItem('isGlassEnabled');
    if (savedGlass) setIsGlassEnabled(savedGlass === 'true');
    const savedDark = localStorage.getItem('isDarkMode');
    if (savedDark === 'true') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    const savedNotif = localStorage.getItem('notificationsEnabled');
    if (savedNotif) setNotificationsEnabled(savedNotif === 'true');
    const savedSound = localStorage.getItem('soundEnabled');
    if (savedSound) setSoundEnabled(savedSound === 'true');
    const savedPasscode = localStorage.getItem('passcode');
    if (savedPasscode) {
      setPasscode(savedPasscode);
      setIsLocked(true);
    }
    setIsAppReady(true);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile(data as UserProfile);
            setIsAdmin(data.role === 'admin' || user.email === 'goh@gmail.com');
          } else {
            setUserProfile({ uid: user.uid, name: user.displayName || 'Пользователь', email: user.email || '', phone: '', bio: '', username: '', avatarUrl: user.photoURL || '' });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile({ uid: user.uid, name: user.displayName || 'Пользователь', email: user.email || '', phone: '', bio: '', username: '', avatarUrl: user.photoURL || '' });
        }
        setView('chatList');
        setContacts(prev => ({
          ...prev,
          'echo_bot': prev['echo_bot'] || {
            id: 'echo_bot',
            name: 'Эхо Бот',
            initial: 'Б',
            avatarColor: '#10b981',
            statusOnline: 'в сети',
            statusOffline: 'бот',
            phone: '',
            bio: 'Я эхо-бот. Я повторяю то, что вы пишете.',
            username: '@echobot',
            messages: [],
            isTyping: false,
            unread: 0,
            isChannel: false,
            isOfficial: true,
          }
        }));
      } else {
        setView('auth');
        setUserProfile(null);
        setIsAdmin(false);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (Object.keys(contacts).length > 0 && contacts !== initialContacts) {
      localStorage.setItem('contacts', JSON.stringify(contacts));
    }
  }, [contacts]);

  const sendMessage = (text: string, options?: any) => {
    if (!activeChatId) return;
    setContacts(prev => {
      const chat = prev[activeChatId];
      if (!chat) return prev;
      const newMessage = {
        id: Date.now().toString(),
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'sent' as const,
        status: 'sent' as const,
        ...options
      };
      return {
        ...prev,
        [activeChatId]: {
          ...chat,
          messages: [...chat.messages, newMessage]
        }
      };
    });

    if (activeChatId === 'echo_bot' || activeChatId === 'test_bot') {
      setTimeout(() => {
        setContacts(prev => {
          const chat = prev[activeChatId];
          if (!chat) return prev;
          return { ...prev, [activeChatId]: { ...chat, isTyping: true } };
        });
        setTimeout(() => {
          setContacts(prev => {
            const chat = prev[activeChatId];
            if (!chat) return prev;
            const botMsg = {
              id: Date.now().toString(),
              text: activeChatId === 'echo_bot' ? `Эхо: ${text}` : generateBotResponse(activeChatId, text),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'received' as const,
            };
            return {
              ...prev,
              [activeChatId]: {
                ...chat,
                isTyping: false,
                messages: [...chat.messages, botMsg],
                unread: chat.unread + 1
              }
            };
          });
        }, 1500);
      }, 500);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    setUserProfile(prev => prev ? { ...prev, ...data } : null);
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), data, { merge: true });
      } catch (error) {
        console.error("Error updating profile in Firestore:", error);
      }
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!activeChatId) return;
    setContacts(prev => {
      const chat = prev[activeChatId];
      if (!chat) return prev;
      return {
        ...prev,
        [activeChatId]: {
          ...chat,
          messages: chat.messages.map(m => {
            if (m.id === messageId) {
              const reactions = { ...(m.reactions || {}) };
              reactions[emoji] = (reactions[emoji] || 0) + 1;
              return { ...m, reactions };
            }
            return m;
          })
        }
      };
    });
  };

  const editMessage = (id: string, text: string) => {
    if (!activeChatId) return;
    setContacts(prev => {
      const chat = prev[activeChatId];
      if (!chat) return prev;
      return {
        ...prev,
        [activeChatId]: {
          ...chat,
          messages: chat.messages.map(m => m.id === id ? { ...m, text, isEdited: true } : m)
        }
      };
    });
  };

  const deleteMessage = (id: string) => {
    if (!activeChatId) return;
    setContacts(prev => {
      const chat = prev[activeChatId];
      if (!chat) return prev;
      return {
        ...prev,
        [activeChatId]: {
          ...chat,
          messages: chat.messages.filter(m => m.id !== id)
        }
      };
    });
  };

  const forwardMessage = (msg: any, toId: string) => {
    setContacts(prev => {
      const chat = prev[toId];
      if (!chat) return prev;
      const newMessage = {
        ...msg,
        id: Date.now().toString(),
        type: 'sent' as const,
        status: 'sent' as const,
        forwardedFrom: userProfile?.name || 'Пользователь'
      };
      return {
        ...prev,
        [toId]: {
          ...chat,
          messages: [...chat.messages, newMessage]
        }
      };
    });
  };

  const clearHistory = (id: string) => {
    setContacts(prev => {
      const chat = prev[id];
      if (!chat) return prev;
      return {
        ...prev,
        [id]: {
          ...chat,
          messages: []
        }
      };
    });
  };

  const deleteChat = (id: string) => {
    setContacts(prev => {
      const newContacts = { ...prev };
      delete newContacts[id];
      return newContacts;
    });
    if (activeChatId === id) {
      setActiveChatId(null);
      setView('chatList');
    }
  };

  const markAsRead = (id: string) => {
    setContacts(prev => {
      const chat = prev[id];
      if (!chat) return prev;
      return {
        ...prev,
        [id]: {
          ...chat,
          unread: 0
        }
      };
    });
  };

  const addContact = (contact: Contact) => {
    setContacts(prev => ({
      ...prev,
      [contact.id]: prev[contact.id] || contact
    }));
  };

  const togglePin = (id: string) => {
    setContacts(prev => {
      const chat = prev[id];
      if (!chat) return prev;
      return {
        ...prev,
        [id]: {
          ...chat,
          isPinned: !chat.isPinned
        }
      };
    });
  };

  const handleSetThemeColor = (color: string) => {
    setThemeColor(color);
    localStorage.setItem('themeColor', color);
  };

  const handleSetWallpaper = (url: string | null) => {
    setWallpaper(url);
    if (url) localStorage.setItem('wallpaper', url);
    else localStorage.removeItem('wallpaper');
  };

  const handleSetIsGlassEnabled = (enabled: boolean) => {
    setIsGlassEnabled(enabled);
    localStorage.setItem('isGlassEnabled', enabled.toString());
  };

  const handleSetIsDarkMode = (enabled: boolean) => {
    setIsDarkMode(enabled);
    localStorage.setItem('isDarkMode', enabled.toString());
    if (enabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSetNotificationsEnabled = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem('notificationsEnabled', enabled.toString());
  };

  const handleSetSoundEnabled = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('soundEnabled', enabled.toString());
  };

  const updatePasscode = (code: string | null) => {
    setPasscode(code);
    if (code) {
      localStorage.setItem('passcode', code);
    } else {
      localStorage.removeItem('passcode');
      setIsLocked(false);
    }
  };

  return (
    <ChatContext.Provider value={{
      contacts, activeChatId, view, themeColor, isSideMenuOpen, isAdmin, userProfile, authReady, wallpaper, isGlassEnabled, searchQuery, isDarkMode, notificationsEnabled, soundEnabled, passcode, isLocked, isAppReady, systemStatus,
      setSearchQuery, setView, setActiveChatId, setThemeColor: handleSetThemeColor, setSideMenuOpen, sendMessage, editMessage, deleteMessage, forwardMessage, clearHistory, deleteChat, markAsRead, addContact, togglePin, setWallpaper: handleSetWallpaper, setIsGlassEnabled: handleSetIsGlassEnabled, setIsDarkMode: handleSetIsDarkMode, updateProfile, addReaction, setNotificationsEnabled: handleSetNotificationsEnabled, setSoundEnabled: handleSetSoundEnabled, updatePasscode, setIsLocked
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
