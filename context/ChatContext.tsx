'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Contact, ViewState, Message, UserProfile } from '@/types';
import { initialContacts } from '@/lib/mockData';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, serverTimestamp, addDoc, collection, query, orderBy, where, deleteDoc, writeBatch, getDocs, deleteField, FirestoreError } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { initializeFirebaseSettings } from '@/lib/init-firebase-settings';
import { WELCOME_BONUS_STARS } from '@/lib/gifts';

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

// Email администратора и основателя (вынесен в константу для удобства)
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
const FOUNDER_EMAIL = 'goh@gmail.com';

const isAdminEmail = (email: string | null | undefined): boolean => {
  return email === ADMIN_EMAIL;
};

const isFounderEmail = (email: string | null | undefined): boolean => {
  return email === FOUNDER_EMAIL;
};

let aiInstance: GoogleGenAI | null = null;
const getAi = () => {
  if (!aiInstance && process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
  }
  return aiInstance;
};

// Длительность бесплатного пробного периода для AI исправления
export const AI_TRIAL_DURATION_MS = 24 * 60 * 60 * 1000;
const AI_TRIAL_STORAGE_KEY = 'housegram_ai_trial_start';

/**
 * Логгер для ошибок Firestore-листенеров. permission-denied возникает
 * транзитивно: при логауте, пока не задеплоены новые firestore.rules или
 * пока Firebase Auth ещё не прокинул токен в первый snapshot. Чтобы не
 * спамить красными ошибками в консоль пользователя, такие случаи выводим
 * как предупреждение с подсказкой, что нужно задеплоить правила.
 */
const logListenerError = (label: string, error: unknown) => {
  const code = (error as FirestoreError | undefined)?.code;
  if (code === 'permission-denied') {
    console.warn(
      `[${label}] permission-denied (возможно, нужно задеплоить firestore.rules: \`firebase deploy --only firestore:rules\`)`,
    );
    return;
  }
  console.error(`${label}:`, error);
};

interface ChatContextType {
  view: ViewState;
  setView: (view: ViewState) => void;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  contacts: Record<string, Contact>;
  isSideMenuOpen: boolean;
  setSideMenuOpen: (open: boolean) => void;
  sendMessage: (text: string, options?: { audioUrl?: string; fileUrl?: string; fileName?: string; replyTo?: { messageId: string; senderName: string; text: string }; stickerUrl?: string; stickerWidth?: number; stickerHeight?: number; gifUrl?: string; gifWidth?: number; gifHeight?: number }) => void;
  editMessage: (messageId: string, newText: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  forwardMessage: (message: Message, targetChatId: string) => Promise<void>;
  saveSticker: (stickerUrl: string) => void;
  removeSavedSticker: (stickerUrl: string) => void;
  savedStickers: string[];
  markAsRead: (contactId: string) => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  wallpaper: string;
  setWallpaper: (url: string) => void;
  isGlassEnabled: boolean;
  setIsGlassEnabled: (enabled: boolean) => void;
  clearHistory: (contactId: string) => void;
  deleteChat: (contactId: string) => void;
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  blockContact: (contactId: string) => void;
  unblockContact: (contactId: string) => void;
  setCopyProtection: (contactId: string, enabled: boolean) => Promise<void>;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (enabled: boolean) => void;
  passcode: string | null;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  updatePasscode: (code: string | null) => void;
  user: User | null;
  currentUser: { id: string; email: string | null } | null;
  isAdmin: boolean;
  isMaintenance: boolean;
  // Глобальный праздничный режим "День Победы 9 мая". Включается админом
  // через AdminView и транслируется всем клиентам через settings/global.
  isVictoryDayTheme: boolean;
  isFrozen: boolean;
  frozenAt: string | null;
  frozenReason: string | null;
  logout: () => void;
  addContact: (contact: Contact) => void;
  setTypingStatus: (chatId: string, isTyping: boolean) => void;
  isPremium: boolean;
  premiumExpiry: Date | null;
  aiRequestsToday: number;
  maxAiRequests: number;
  // AI исправление сообщений: 1 день бесплатно
  aiTrialStart: number | null;
  startAiTrial: () => number;
  isAiTrialActive: () => boolean;
  aiTrialMsLeft: () => number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [view, setView] = useState<ViewState>('menu');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const [contacts, setContacts] = useState<Record<string, Contact>>(initialContacts);
  const [isSideMenuOpen, setSideMenuOpen] = useState(false);
  const [themeColor, setThemeColor] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('housegram_theme') || '#517da2';
    return '#517da2';
  });
  const [wallpaper, setWallpaper] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('housegram_wallpaper') || '';
    return '';
  });
  const [isGlassEnabled, setIsGlassEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('housegram_glass');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Ваше Имя',
    username: '@usernamegoeshere',
    bio: 'Add a few words about yourself',
    phone: '+7 9XX XXX XX XX',
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('housegram_dark_mode');
      return saved === 'true';
    }
    return false;
  });

  // Эффект применения темной темы
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    }
  }, [isDarkMode]);
  const [passcode, setPasscode] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [savedStickers, setSavedStickers] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('housegram_stickers');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isVictoryDayTheme, setIsVictoryDayTheme] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [frozenAt, setFrozenAt] = useState<string | null>(null);
  const [frozenReason, setFrozenReason] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiry, setPremiumExpiry] = useState<Date | null>(null);
  const [aiRequestsToday, setAiRequestsToday] = useState(0);
  const [maxAiRequests, setMaxAiRequests] = useState(1);
  const [aiTrialStart, setAiTrialStart] = useState<number | null>(null);

  const settingsRef = useRef({ soundEnabled, notificationsEnabled });

  useEffect(() => {
    settingsRef.current = { soundEnabled, notificationsEnabled };
  }, [soundEnabled, notificationsEnabled]);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPasscode = localStorage.getItem('housegram_passcode');
      if (savedPasscode) { setPasscode(savedPasscode); setIsLocked(true); }
      const savedNotif = localStorage.getItem('housegram_notif');
      const savedSound = localStorage.getItem('housegram_sound');
      if (savedNotif !== null) setNotificationsEnabled(savedNotif === 'true');
      if (savedSound !== null) setSoundEnabled(savedSound === 'true');
      const savedAiTrial = localStorage.getItem(AI_TRIAL_STORAGE_KEY);
      if (savedAiTrial) {
        const ts = Number(savedAiTrial);
        if (!Number.isNaN(ts)) setAiTrialStart(ts);
      }
    }

    // Инициализируем settings/global если его нет
    try {
      initializeFirebaseSettings();
    } catch (error) {
      console.warn('Failed to initialize Firebase settings:', error);
      // Продолжаем работу без Firebase настроек
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              if (data.isBanned === true) { setView('auth'); setAuthReady(true); return; }
              
              // Проверяем заморозку аккаунта
              if (data.isFrozen === true) {
                setIsFrozen(true);
                setFrozenAt(data.frozenAt || new Date().toISOString());
                setFrozenReason(data.frozenReason || 'Нарушение правил использования');
                setAuthReady(true);
                return;
              }
              
              setIsAdmin(isAdminEmail(currentUser.email) || data.role === 'admin');
              
              // Проверяем премиум статус
              const premium = data.premium || false;
              const expiry = data.premiumExpiry;
              let validPremium = premium;
              
              if (premium && expiry) {
                const expiryDate = expiry.toDate ? expiry.toDate() : new Date(expiry);
                if (expiryDate < new Date()) {
                  // Премиум истек, убираем его
                  validPremium = false;
                  try {
                    await updateDoc(doc(db, 'users', currentUser.uid), {
                      premium: false,
                      premiumExpiry: null
                    });
                  } catch (e) {
                    console.warn('Could not update expired premium:', e);
                  }
                } else {
                  setPremiumExpiry(expiryDate);
                }
              }
              
              setIsPremium(validPremium);
              setMaxAiRequests(validPremium ? 5 : 1);
              
              // Загружаем количество AI запросов за сегодня
              const today = new Date().toDateString();
              const aiRequests = data.aiRequestsToday || {};
              setAiRequestsToday(aiRequests[today] || 0);
              setUserProfile({
                name: data.name || 'Ваше Имя', username: data.username || '', bio: data.bio || '',
                phone: data.phone || '+7 9XX XXX XX XX', avatarUrl: data.avatarUrl || '',
                status: 'online', lastSeen: data.lastSeen,
                isOfficial: data.isOfficial === true || isAdminEmail(currentUser.email) || data.role === 'admin',
                isFounder: isFounderEmail(currentUser.email) || data.isFounder === true
              });
              
              // Обновляем статус пользователя на "в сети"
              try { 
                await updateDoc(doc(db, 'users', currentUser.uid), { 
                  status: 'online', 
                  lastSeen: serverTimestamp() 
                }); 
              } catch (e) {
                console.warn('Could not update user status:', e);
              }
              
              // Инициализация push-уведомлений (временно отключено)
              // TODO: Получить правильный VAPID ключ из Firebase Console
              // Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
              /*
              if (typeof window !== 'undefined' && 'Notification' in window) {
                setTimeout(async () => {
                  try {
                    const { initializeNotifications, onForegroundMessage } = await import('@/lib/notifications');
                    const token = await initializeNotifications(currentUser.uid);
                    
                    if (token) {
                      console.log('Push notifications initialized successfully');
                      onForegroundMessage((payload) => {
                        console.log('Received foreground message:', payload);
                      });
                    }
                  } catch (error) {
                    console.error('Failed to initialize notifications:', error);
                  }
                }, 2000);
              }
              */
            } else {
              const rawUsername = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
              const finalUsername = rawUsername.startsWith('@') ? rawUsername : '@' + rawUsername.replace(/@/g, '');
              try {
                await setDoc(doc(db, 'users', currentUser.uid), {
                  uid: currentUser.uid, email: currentUser.email,
                  name: (currentUser.displayName || currentUser.email?.split('@')[0] || 'User').substring(0, 45),
                  username: finalUsername.substring(0, 15), bio: '',
                  role: isAdminEmail(currentUser.email) ? 'admin' : 'user',
                  isBanned: false, createdAt: serverTimestamp(), status: 'online', lastSeen: serverTimestamp(),
                  // Приветственный бонус: новый пользователь без профиля в Firestore
                  // (например, после первого входа через Google) получает 250 молний.
                  stars: WELCOME_BONUS_STARS, giftsSent: 0, giftsReceived: 0
                });
                setIsAdmin(isAdminEmail(currentUser.email));
                setUserProfile({
                  name: (currentUser.displayName || currentUser.email?.split('@')[0] || 'User').substring(0, 45),
                  username: finalUsername.substring(0, 15), bio: '', phone: '+7 9XX XXX XX XX',
                  avatarUrl: '', status: 'online', lastSeen: new Date(),
                  isOfficial: isAdminEmail(currentUser.email),
                  isFounder: isFounderEmail(currentUser.email)
                });
              } catch (e) { console.error('Failed to create user document', e); }
            }
            setView('menu');
          } catch (e) { 
            console.error('Auth state error:', e); 
            // Если Firebase недоступен, переходим к авторизации
            setView('auth'); 
          }
        } else { 
          setIsAdmin(false); 
          setView('auth'); 
        }
      } catch (error) {
        console.error('Firebase auth error:', error);
        // Если Firebase auth недоступен, все равно показываем интерфейс
        setView('auth');
      }
      setAuthReady(true);
    });

    const handleVisibilityChange = async () => {
      if (auth.currentUser) {
        try {
          const st = document.visibilityState === 'visible' ? 'online' : 'offline';
          await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
            status: st, 
            lastSeen: serverTimestamp() 
          });
          
          // Если стал видимым, устанавливаем таймер для проверки активности
          if (st === 'online') {
            // Обновляем статус каждые 30 секунд пока вкладка активна
            const intervalId = setInterval(() => {
              if (document.visibilityState === 'visible' && auth.currentUser) {
                updateDoc(doc(db, 'users', auth.currentUser.uid), { 
                  status: 'online', 
                  lastSeen: serverTimestamp() 
                }).catch(() => {});
              } else {
                clearInterval(intervalId);
              }
            }, 30000);
          }
        } catch (e) {
          console.warn('Could not update visibility status:', e);
        }
      }
    };
    
    const handleBeforeUnload = () => {
      if (auth.currentUser) {
        // Используем sendBeacon для надежной отправки при закрытии
        const data = JSON.stringify({
          userId: auth.currentUser.uid,
          status: 'offline',
          lastSeen: new Date().toISOString()
        });
        
        // Пытаемся отправить через API
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/update-status', data);
        }
        
        // Также пытаемся обновить напрямую (может не успеть)
        try {
          updateDoc(doc(db, 'users', auth.currentUser.uid), { 
            status: 'offline', 
            lastSeen: serverTimestamp() 
          });
        } catch (e) {
          console.warn('Could not update offline status:', e);
        }
      }
    };
    
    const handlePageHide = () => {
      if (auth.currentUser) {
        // Синхронная попытка обновления
        try {
          updateDoc(doc(db, 'users', auth.currentUser.uid), { 
            status: 'offline', 
            lastSeen: serverTimestamp() 
          });
        } catch (e) {
          console.warn('Could not update offline status on pagehide:', e);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsMaintenance(data.maintenanceMode || false);
        setIsVictoryDayTheme(data.victoryDayTheme || false);
      }
    }, (error) => { logListenerError('Settings listener error', error); });

    return () => {
      // При размонтировании компонента также устанавливаем offline
      if (auth.currentUser) {
        updateDoc(doc(db, 'users', auth.currentUser.uid), { 
          status: 'offline', 
          lastSeen: serverTimestamp() 
        }).catch(() => {});
      }
      unsubscribeAuth(); unsubscribeSettings();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  // Подписка на статусы пользователей в реальном времени
  // Используем useMemo для стабильного списка ID контактов
  const contactIds = useMemo(() => {
    return Object.keys(contacts).filter(id => 
      id !== 'saved_messages' && id !== 'test_bot'
    );
  }, [Object.keys(contacts).sort().join(',')]);

  useEffect(() => {
    if (!user || contactIds.length === 0) return;
    
    const unsubscribes: (() => void)[] = [];
    
    contactIds.forEach(contactId => {
      const userRef = doc(db, 'users', contactId);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          
          let statusOnline = 'был(а) недавно';
          let statusOffline = 'был(а) недавно';
          
          // Проверяем статус и время последней активности
          const isOnline = userData.status === 'online';
          let isRecentlyActive = false;
          
          if (userData.lastSeen) {
            try {
              const lastSeenDate = userData.lastSeen.toDate ? userData.lastSeen.toDate() : new Date(userData.lastSeen);
              const now = new Date();
              const diffSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);
              const diffMinutes = Math.floor(diffSeconds / 60);
              
              // Считаем пользователя онлайн только если он был активен менее 45 секунд назад
              // Это учитывает задержки сети и обновления статуса
              isRecentlyActive = diffSeconds < 45;
              
              if (diffMinutes < 1) {
                statusOffline = 'был(а) только что';
              } else if (diffMinutes < 60) {
                statusOffline = `был(а) ${diffMinutes} мин. назад`;
              } else if (diffMinutes < 1440) {
                const hours = Math.floor(diffMinutes / 60);
                statusOffline = `был(а) ${hours} ч. назад`;
              } else {
                const days = Math.floor(diffMinutes / 1440);
                statusOffline = `был(а) ${days} дн. назад`;
              }
            } catch (e) {
              statusOffline = 'был(а) недавно';
            }
          }
          
          // Показываем "в сети" только если статус online И пользователь был активен недавно
          if (isOnline && isRecentlyActive) {
            statusOnline = 'в сети';
            statusOffline = 'в сети';
          } else {
            statusOnline = statusOffline;
          }
          
          setContacts(prev => {
            if (!prev[contactId]) return prev;
            return {
              ...prev,
              [contactId]: {
                ...prev[contactId],
                statusOnline,
                statusOffline
              }
            };
          });
        }
      }, (error) => {
        console.error('User status listener error:', contactId, error);
      });
      
      unsubscribes.push(unsubscribe);
    });
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user, contactIds]);

  // Подписка на статус печати в активном чате
  useEffect(() => {
    if (!user || !activeChatId) return;
    
    // Не слушаем статус для ботов и специальных чатов
    if (activeChatId === 'saved_messages' || activeChatId === 'test_bot') return;
    
    const chatDocId = [user.uid, activeChatId].sort().join('_');
    const chatRef = doc(db, 'chats', chatDocId);
    
    const unsubscribe = onSnapshot(chatRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const typingData = data.typing || {};
        
        // Проверяем печатает ли другой пользователь
        const otherUserId = activeChatId;
        const otherUserTyping = typingData[otherUserId];
        
        let isTyping = false;
        if (otherUserTyping) {
          try {
            const typingTime = otherUserTyping.toDate ? otherUserTyping.toDate() : new Date(otherUserTyping);
            const now = new Date();
            const diffSeconds = Math.floor((now.getTime() - typingTime.getTime()) / 1000);
            
            // Считаем что печатает если прошло менее 3 секунд
            isTyping = diffSeconds < 3;
          } catch (e) {
            isTyping = false;
          }
        }

        // Copy protection: map {userId: true}, выставленный тем, кто включил
        // «Запретить копирование» для своих сообщений в этом чате. Храним
        // карту как есть, ChatView / Message решают, что с ней делать.
        const rawCopyProtected = (data.copyProtectedBy || {}) as Record<string, unknown>;
        const copyProtectedBy: Record<string, boolean> = {};
        for (const [uid, v] of Object.entries(rawCopyProtected)) {
          if (v === true) copyProtectedBy[uid] = true;
        }

        setContacts(prev => {
          if (!prev[activeChatId]) return prev;
          const existing = prev[activeChatId];

          const prevMap = existing.copyProtectedBy || {};
          const mapChanged =
            Object.keys(prevMap).length !== Object.keys(copyProtectedBy).length ||
            Object.keys(copyProtectedBy).some(k => !prevMap[k]);

          // Проверяем изменился ли статус, чтобы избежать лишних ре-рендеров
          if (existing.isTyping === isTyping && !mapChanged) return prev;

          return {
            ...prev,
            [activeChatId]: {
              ...existing,
              isTyping,
              copyProtectedBy,
            }
          };
        });
      }
    }, (error) => {
      console.debug('Typing status listener error:', error);
    });
    
    return () => unsubscribe();
  }, [user, activeChatId]);

  const logout = useCallback(async () => {
    if (auth.currentUser) {
      try { 
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
          status: 'offline', 
          lastSeen: serverTimestamp() 
        }); 
      } catch (e) {
        console.warn('Could not update logout status:', e);
      }
    }
    await signOut(auth);
    setContacts(initialContacts);
    setView('auth');
  }, []);

  const updatePasscode = useCallback((code: string | null) => {
    setPasscode(code);
    if (code) { localStorage.setItem('housegram_passcode', code); }
    else { localStorage.removeItem('housegram_passcode'); setIsLocked(false); }
  }, []);

  const playSound = useCallback((type: 'send' | 'receive') => {
    if (!settingsRef.current.soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      if (type === 'send') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
      } else {
        osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) { console.error('Audio play error', e); }
  }, []);

  const markAsRead = useCallback(async (contactId: string) => {
    if (!user) return;
    
    // Обнуляем счетчик непрочитанных
    setContacts(prev => ({ ...prev, [contactId]: { ...prev[contactId], unread: 0 } }));
    
    // Обновляем статус всех непрочитанных сообщений на 'read'
    const chatId = [user.uid, contactId].sort().join('_');
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      
      // Получаем все сообщения без фильтрации (чтобы избежать необходимости в индексе)
      const snapshot = await getDocs(messagesRef);
      const batch = writeBatch(db);
      let hasUpdates = false;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Обновляем только сообщения от собеседника, которые еще не прочитаны
        if (data.senderId === contactId && data.status !== 'read') {
          batch.update(doc.ref, { status: 'read' });
          hasUpdates = true;
        }
      });
      
      if (hasUpdates) {
        await batch.commit();
      }
    } catch (error) {
      // Тихо игнорируем ошибки прав доступа для непрочитанных сообщений
      // Это может происходить при первом запуске или изменении правил безопасности
      console.log('Mark messages as read:', error instanceof Error ? error.message : 'permission update pending');
    }
  }, [user]);

  const clearHistory = useCallback(async (contactId: string) => {
    if (!user) return;
    const chatId = [user.uid, contactId].sort().join('_');
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const snapshot = await getDocs(query(messagesRef));
      const batch = writeBatch(db);
      snapshot.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      await updateDoc(doc(db, 'chats', chatId), { lastMessage: '', lastMessageSenderId: '', updatedAt: serverTimestamp() });
    } catch (e) { console.error('Failed to clear history', e); alert('Ошибка при очистке истории'); }
    setContacts(prev => ({ ...prev, [contactId]: { ...prev[contactId], messages: [] } }));
  }, [user]);

  const deleteChat = useCallback(async (contactId: string) => {
    if (!user) return;
    const chatId = [user.uid, contactId].sort().join('_');
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const snapshot = await getDocs(query(messagesRef));
      const batch = writeBatch(db);
      snapshot.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      await deleteDoc(doc(db, 'chats', chatId));
    } catch (e) { console.error('Failed to delete chat', e); alert('Ошибка при удалении чата'); }
    setContacts(prev => { const n = { ...prev }; delete n[contactId]; return n; });
    setActiveChatId(null); setView('menu');
  }, [user]);

  const blockContact = useCallback(async (contactId: string) => {
    if (!user) return;
    const chatId = [user.uid, contactId].sort().join('_');
    try { 
      const updateData: Record<string, boolean> = {};
      updateData[`blockedBy.${user.uid}`] = true;
      await updateDoc(doc(db, 'chats', chatId), updateData); 
    } catch (e) {}
    setContacts(prev => ({ ...prev, [contactId]: { ...prev[contactId], isBlocked: true } }));
  }, [user]);

  const unblockContact = useCallback(async (contactId: string) => {
    if (!user) return;
    const chatId = [user.uid, contactId].sort().join('_');
    try { 
      const updateData: Record<string, any> = {};
      updateData[`blockedBy.${user.uid}`] = null;
      await updateDoc(doc(db, 'chats', chatId), updateData); 
    } catch (e) {}
    setContacts(prev => ({ ...prev, [contactId]: { ...prev[contactId], isBlocked: false } }));
  }, [user]);

  const setCopyProtection = useCallback(async (contactId: string, enabled: boolean) => {
    if (!user) return;
    const chatId = [user.uid, contactId].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);
    try {
      // Основной путь — тот же, что у blockContact/unblockContact: `updateDoc`
      // с dot-notation, чтобы атомарно тронуть только свой ключ в nested map
      // `copyProtectedBy` и не затереть запись второго участника.
      try {
        await updateDoc(chatRef, {
          [`copyProtectedBy.${user.uid}`]: enabled ? true : deleteField(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        // Если документа чата ещё нет (ни одного сообщения не отправлено),
        // updateDoc упадёт с `not-found` — тогда создаём документ c минимально
        // необходимыми для `isValidChat` полями.
        const code = (err as FirestoreError | undefined)?.code;
        if (code === 'not-found') {
          await setDoc(chatRef, {
            copyProtectedBy: enabled ? { [user.uid]: true } : {},
            participants: [user.uid, contactId].sort(),
            updatedAt: serverTimestamp(),
          });
        } else {
          throw err;
        }
      }
      setContacts(prev => {
        const existing = prev[contactId];
        if (!existing) return prev;
        const nextMap = { ...(existing.copyProtectedBy || {}) };
        if (enabled) nextMap[user.uid] = true;
        else delete nextMap[user.uid];
        return { ...prev, [contactId]: { ...existing, copyProtectedBy: nextMap } };
      });
    } catch (e) {
      console.error('Failed to update copy protection', e);
      alert('Не удалось обновить защиту от копирования. Попробуйте ещё раз.');
      throw e;
    }
  }, [user]);

  const lastMessageTimeRef = useRef<number>(0);

  const saveSticker = useCallback((stickerUrl: string) => {
    setSavedStickers(prev => {
      if (prev.includes(stickerUrl)) return prev;
      const updated = [...prev, stickerUrl];
      localStorage.setItem('housegram_stickers', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeSavedSticker = useCallback((stickerUrl: string) => {
    setSavedStickers(prev => {
      const updated = prev.filter(s => s !== stickerUrl);
      localStorage.setItem('housegram_stickers', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const sendMessage = useCallback(async (text: string, options?: { audioUrl?: string; fileUrl?: string; fileName?: string; replyTo?: { messageId: string; senderName: string; text: string }; stickerUrl?: string; stickerWidth?: number; stickerHeight?: number; gifUrl?: string; gifWidth?: number; gifHeight?: number }) => {
    const currentChatId = activeChatIdRef.current;
    if (!currentChatId || !auth.currentUser) return;
    const now = Date.now();
    if (now - lastMessageTimeRef.current < 500) return;
    lastMessageTimeRef.current = now;
    const contact = contacts[currentChatId];
    if (contact?.isBlocked) return;

    const serverNow = serverTimestamp();
    const timeString = `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;

    // Для каналов отправляем пост
    if (contact?.isChannel) {
      const newPost = {
        type: 'received', text, time: timeString, status: 'sent',
        senderId: auth.currentUser.uid, createdAt: serverNow,
        views: 0, viewedBy: [], ...options,
      };

      try {
        await addDoc(collection(db, 'channels', currentChatId, 'posts'), newPost);
        playSound('send');
        
        // Отправляем уведомления подписчикам канала
        try {
          const { sendChannelPostNotification } = await import('@/lib/notifications');
          await sendChannelPostNotification(
            currentChatId,
            contact.name,
            text,
            contact.avatarUrl
          );
        } catch (notifError) {
          console.error('Failed to send channel notifications:', notifError);
        }
      } catch (e) {
        console.error('Failed to send post', e);
        alert(`Ошибка при отправке поста: ${e instanceof Error ? e.message : String(e)}`);
      }
      return;
    }

    // Для обычных чатов
    const chatId = [auth.currentUser.uid, currentChatId].sort().join('_');

    const newMessage: Omit<Message, 'id'> = {
      type: 'sent', text, time: timeString, status: 'sent', senderId: auth.currentUser.uid,
      chatId, createdAt: serverNow, ...options,
    };

    try {
      // Создаем/обновляем чат с полной информацией за один раз
      await setDoc(doc(db, 'chats', chatId), { 
        updatedAt: serverNow, 
        participants: [auth.currentUser.uid, currentChatId].sort(),
        lastMessage: text || 'Медиа',
        lastMessageSenderId: auth.currentUser.uid
      }, { merge: true });
      
      // Добавляем сообщение
      await addDoc(collection(db, 'chats', chatId, 'messages'), newMessage);
      
      playSound('send');

      // Отправляем push-уведомление получателю
      if (currentChatId !== 'saved_messages' && currentChatId !== 'test_bot') {
        try {
          const { sendMessageNotification } = await import('@/lib/notifications');
          const senderName = userProfile.name || 'Пользователь';
          await sendMessageNotification(
            currentChatId,
            senderName,
            text,
            currentChatId,
            userProfile.avatarUrl
          );
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
        }
      }

      const ai = getAi();
      if (currentChatId === 'test_bot' && ai) {
        // Проверяем лимит AI запросов
        if (aiRequestsToday >= maxAiRequests) {
          alert(`Достигнут дневной лимит AI запросов (${maxAiRequests}). ${isPremium ? 'Попробуйте завтра.' : 'Купите Premium для увеличения лимита до 5 запросов в день!'}`);
          return;
        }

        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash', contents: text,
            config: { systemInstruction: 'You are HouseGram AI, a helpful and friendly AI assistant integrated into the HouseGram Web messenger. You speak Russian by default unless asked otherwise. Keep your responses concise and conversational.' }
          });
          const aiText = response.text;
          if (aiText && aiText.trim()) {
            // Увеличиваем счетчик AI запросов
            const today = new Date().toDateString();
            const newCount = aiRequestsToday + 1;
            setAiRequestsToday(newCount);
            
            // Обновляем в Firebase
            try {
              await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                [`aiRequestsToday.${today}`]: newCount
              });
            } catch (e) {
              console.warn('Could not update AI requests count:', e);
            }

            const aiNow = serverTimestamp();
            const aiTime = `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;
            await addDoc(collection(db, 'chats', chatId, 'messages'), {
              type: 'received', text: aiText.trim(), time: aiTime, status: 'sent',
              senderId: 'test_bot', chatId, createdAt: aiNow,
            });
            await updateDoc(doc(db, 'chats', chatId), { lastMessage: aiText.trim(), lastMessageSenderId: 'test_bot', updatedAt: serverNow });
            playSound('receive');
          }
        } catch (aiError) { console.error('Gemini AI Error:', aiError); }
      }
    } catch (e) {
      console.error('Failed to send message', e);
      alert(`Ошибка при отправке сообщения: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [playSound, contacts, userProfile, aiRequestsToday, maxAiRequests, isPremium]);

  const editMessage = useCallback(async (messageId: string, newText: string) => {
    if (!user || !activeChatId) return;
    const chatId = [user.uid, activeChatId].sort().join('_');
    try {
      await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
        text: newText,
        editedAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: newText,
        updatedAt: serverTimestamp()
      });
    } catch (e) { console.error('Failed to edit message', e); alert('Ошибка при редактировании'); }
  }, [user, activeChatId]);

  // ---------- AI исправление: бесплатный пробный период ----------
  const startAiTrial = useCallback(() => {
    const now = Date.now();
    setAiTrialStart(now);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AI_TRIAL_STORAGE_KEY, String(now));
    }
    return now;
  }, []);

  const aiTrialMsLeft = useCallback(() => {
    if (!aiTrialStart) return AI_TRIAL_DURATION_MS;
    return Math.max(0, AI_TRIAL_DURATION_MS - (Date.now() - aiTrialStart));
  }, [aiTrialStart]);

  const isAiTrialActive = useCallback(() => {
    // Триал ещё не запущен — считаем активным, чтобы первый запуск был бесплатным.
    if (!aiTrialStart) return true;
    return Date.now() - aiTrialStart < AI_TRIAL_DURATION_MS;
  }, [aiTrialStart]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user || !activeChatId) return;
    const chatId = [user.uid, activeChatId].sort().join('_');
    try {
      await deleteDoc(doc(db, 'chats', chatId, 'messages', messageId));
      setContacts(prev => {
        const contact = prev[activeChatId];
        if (!contact) return prev;
        const updatedMessages = contact.messages.filter(m => m.id !== messageId);
        const lastMsg = updatedMessages[updatedMessages.length - 1];
        return {
          ...prev,
          [activeChatId]: {
            ...contact,
            messages: updatedMessages,
          }
        };
      });
    } catch (e) { console.error('Failed to delete message', e); alert('Ошибка при удалении'); }
  }, [user, activeChatId]);

  const forwardMessage = useCallback(async (message: Message, targetChatId: string) => {
    if (!user) return;
    const targetChatId2 = [user.uid, targetChatId].sort().join('_');
    const sourceContact = contacts[activeChatId || ''];
    const timeString = `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;
    const newMessage: Omit<Message, 'id'> = {
      type: 'sent',
      text: message.text,
      time: timeString,
      status: 'sent',
      senderId: user.uid,
      chatId: targetChatId2,
      createdAt: serverTimestamp(),
      forwardedFrom: {
        chatName: sourceContact?.name || 'Чат',
        senderName: message.type === 'sent' ? 'Вы' : sourceContact?.name || 'Пользователь'
      },
      audioUrl: message.audioUrl,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
    };
    try {
      // Создаем/обновляем чат с полной информацией за один раз
      await setDoc(doc(db, 'chats', targetChatId2), { 
        updatedAt: serverTimestamp(), 
        participants: [user.uid, targetChatId].sort(),
        lastMessage: message.text,
        lastMessageSenderId: user.uid
      }, { merge: true });
      
      // Добавляем сообщение
      await addDoc(collection(db, 'chats', targetChatId2, 'messages'), newMessage);
      
      playSound('send');
    } catch (e) { console.error('Failed to forward message', e); alert('Ошибка при пересылке'); }
  }, [user, contacts, activeChatId, playSound]);

  const addContact = useCallback((contact: Contact) => {
    setContacts(prev => { if (prev[contact.id]) return prev; return { ...prev, [contact.id]: contact }; });
  }, []);

  const setTypingStatus = useCallback(async (chatId: string, isTyping: boolean) => {
    // Локальный typing status - не обновляем Firestore
    // Это предотвращает ре-рендеры всего приложения
    setContacts(prev => {
      const contact = prev[chatId];
      if (!contact) return prev;
      
      return {
        ...prev,
        [chatId]: {
          ...contact,
          isTyping
        }
      };
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', user.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const newContacts: Record<string, Contact> = {};
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const otherUserId = data.participants.find((id: string) => id !== user.uid);
        if (!otherUserId) continue;
        try {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Определяем статус пользователя
            let statusOnline = 'был(а) недавно';
            let statusOffline = 'был(а) недавно';
            
            // Проверяем статус и время последней активности
            const isOnline = userData.status === 'online';
            let isRecentlyActive = false;
            
            if (userData.lastSeen) {
              try {
                const lastSeenDate = userData.lastSeen.toDate ? userData.lastSeen.toDate() : new Date(userData.lastSeen);
                const now = new Date();
                const diffSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);
                const diffMinutes = Math.floor(diffSeconds / 60);
                
                // Считаем пользователя онлайн только если он был активен менее 45 секунд назад
                isRecentlyActive = diffSeconds < 45;
                
                if (diffMinutes < 1) {
                  statusOffline = 'был(а) только что';
                } else if (diffMinutes < 60) {
                  statusOffline = `был(а) ${diffMinutes} мин. назад`;
                } else if (diffMinutes < 1440) {
                  const hours = Math.floor(diffMinutes / 60);
                  statusOffline = `был(а) ${hours} ч. назад`;
                } else {
                  const days = Math.floor(diffMinutes / 1440);
                  statusOffline = `был(а) ${days} дн. назад`;
                }
              } catch (e) {
                statusOffline = 'был(а) недавно';
              }
            }
            
            // Показываем "в сети" только если статус online И пользователь был активен недавно
            if (isOnline && isRecentlyActive) {
              statusOnline = 'в сети';
              statusOffline = 'в сети';
            } else {
              statusOnline = statusOffline;
            }
            
            let timeString = '';
            if (data.updatedAt) {
              try { const date = data.updatedAt.toDate(); timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`; } catch (e) {}
            }
            const dummyMessages: Message[] = [];
            if (data.lastMessage) {
              dummyMessages.push({ id: 'dummy', type: data.lastMessageSenderId === user.uid ? 'sent' : 'received', text: data.lastMessage, time: timeString });
            }
            // copyProtectedBy читаем сразу из документа чата, чтобы ребилд
            // contacts-листом не затирал защиту (эта же карта параллельно
            // обновляется active-chat listener'ом).
            const rawCp = (data.copyProtectedBy || {}) as Record<string, unknown>;
            const copyProtectedBy: Record<string, boolean> = {};
            for (const [uid, v] of Object.entries(rawCp)) {
              if (v === true) copyProtectedBy[uid] = true;
            }

            newContacts[otherUserId] = {
              id: otherUserId, name: userData.name || 'User', initial: (userData.name || 'U').charAt(0).toUpperCase(),
              avatarColor: getAvatarColor(otherUserId), avatarUrl: userData.avatarUrl || '', statusOnline, statusOffline,
              phone: userData.phone || '', bio: userData.bio || '', username: userData.username || '',
              messages: dummyMessages, isTyping: false, unread: 0, isChannel: false,
              isOfficial: userData.isOfficial === true || userData.role === 'admin' || isAdminEmail(userData.email),
              premium: userData.premium === true,
              copyProtectedBy,
            };
          }
        } catch (e) { console.error('Error fetching user doc for chat:', otherUserId, e); }
      }

      setContacts(prev => {
        // Начинаем с initialContacts чтобы бот и избранное всегда были
        const updated = { ...initialContacts };
        
        // Добавляем предыдущие контакты (кроме initialContacts), СОХРАНЯЯ их messages
        for (const [id, contact] of Object.entries(prev)) {
          if (!initialContacts[id]) {
            updated[id] = contact;
          }
        }
        
        // Обновляем/добавляем новые контакты из Firebase, НО сохраняем messages если они есть
        for (const [id, contact] of Object.entries(newContacts)) {
          // Если контакт уже существует, сохраняем его messages
          if (updated[id] && updated[id].messages && updated[id].messages.length > 0) {
            updated[id] = { ...contact, messages: updated[id].messages };
          } else {
            updated[id] = contact;
          }
        }
        
        return updated;
      });
    }, (error) => { logListenerError('Chats listener error', error); });

    return () => unsubscribe();
  }, [user]);

  // Загрузка каналов пользователя
  useEffect(() => {
    if (!user) return;
    
    const channelsRef = collection(db, 'channels');
    const q = query(channelsRef, where('subscribers', 'array-contains', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const channelContacts: Record<string, Contact> = {};
      
      snapshot.docs.forEach(docSnapshot => {
        const data = docSnapshot.data();
        const channelId = data.id || docSnapshot.id;
        
        channelContacts[channelId] = {
          id: channelId,
          name: data.name || 'Канал',
          initial: (data.name || 'К').charAt(0).toUpperCase(),
          avatarColor: '#517da2',
          avatarUrl: data.avatarUrl || '',
          statusOnline: `${data.subscribersCount || 0} подписчиков`,
          statusOffline: `${data.subscribersCount || 0} подписчиков`,
          phone: '',
          bio: data.description || '',
          username: '',
          messages: [],
          isTyping: false,
          unread: 0,
          isChannel: true,
          isOfficial: false
        };
      });

      setContacts(prev => {
        const updated = { ...prev };
        
        // Удаляем старые каналы, которых больше нет
        for (const [id, contact] of Object.entries(prev)) {
          if (contact.isChannel && !channelContacts[id] && !initialContacts[id]) {
            delete updated[id];
          }
        }
        
        // Добавляем/обновляем каналы
        for (const [id, channel] of Object.entries(channelContacts)) {
          if (!updated[id]) {
            updated[id] = channel;
          } else {
            updated[id] = { ...updated[id], ...channel, messages: updated[id].messages };
          }
        }
        
        return updated;
      });
    }, (error) => { logListenerError('Channels listener error', error); });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!activeChatId || !user) return;
    
    // Для initialContacts (бот, избранное) не слушаем Firebase
    if (initialContacts[activeChatId]) {
      return;
    }
    
    const contact = contacts[activeChatId];
    
    // Для каналов загружаем сообщения из коллекции channels
    if (contact?.isChannel) {
      const messagesRef = collection(db, 'channels', activeChatId, 'posts');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));

      const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, async (snapshot) => {
        const messages: Message[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id, ...data,
            type: 'received',
            status: 'sent',
            views: data.views || 0
          } as Message;
        });

        // Увеличиваем просмотры для новых сообщений
        for (const doc of snapshot.docs) {
          const data = doc.data();
          if (!data.viewedBy || !data.viewedBy.includes(user.uid)) {
            try {
              await updateDoc(doc.ref, {
                views: (data.views || 0) + 1,
                viewedBy: [...(data.viewedBy || []), user.uid]
              });
            } catch (e) {
              console.error('Failed to update views:', e);
            }
          }
        }

        setContacts(prev => {
          const contact = prev[activeChatId];
          if (!contact) return prev;
          return { ...prev, [activeChatId]: { ...contact, messages } };
        });
      }, (error) => { console.error('Channel posts listener error:', error); });

      return () => unsubscribe();
    }
    
    // Для обычных чатов
    const chatId = [user.uid, activeChatId].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const messages: Message[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id, ...data,
          type: data.senderId === user.uid ? 'sent' : 'received',
          status: doc.metadata.hasPendingWrites ? 'sending' : (data.status === 'sending' ? 'sent' : data.status),
        } as Message;
      });

      setContacts(prev => {
        const contact = prev[activeChatId];
        if (!contact) return prev;
        return { ...prev, [activeChatId]: { ...contact, messages } };
      });
    }, (error) => { console.error('Messages listener error:', error); });

    return () => unsubscribe();
  }, [activeChatId, user]);

  const updateUserProfile = useCallback(async (profile: UserProfile) => {
    setUserProfile(profile);
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          name: profile.name || 'User', username: profile.username || '', bio: profile.bio || '',
          phone: profile.phone || '', avatarUrl: profile.avatarUrl || ''
        }, { merge: true });
      } catch (e: any) { console.error('Failed to update profile in Firestore', e); alert('Ошибка при сохранении профиля: ' + e.message); }
    }
  }, []);

  return (
    <ChatContext.Provider value={{
      view, setView, activeChatId, setActiveChatId, contacts, isSideMenuOpen, setSideMenuOpen,
      sendMessage, editMessage, deleteMessage, forwardMessage, saveSticker, removeSavedSticker, savedStickers, markAsRead,
      themeColor, setThemeColor: (c: string) => { setThemeColor(c); localStorage.setItem('housegram_theme', c); },
      wallpaper, setWallpaper: (u: string) => { setWallpaper(u); localStorage.setItem('housegram_wallpaper', u); },
      isGlassEnabled, setIsGlassEnabled: (v: boolean) => { setIsGlassEnabled(v); localStorage.setItem('housegram_glass', String(v)); },
      clearHistory, deleteChat, userProfile, setUserProfile: updateUserProfile, blockContact, unblockContact, setCopyProtection, addContact,
      notificationsEnabled, setNotificationsEnabled: (val: boolean) => { setNotificationsEnabled(val); localStorage.setItem('housegram_notif', String(val)); },
      soundEnabled, setSoundEnabled: (val: boolean) => { setSoundEnabled(val); localStorage.setItem('housegram_sound', String(val)); },
      isDarkMode, setIsDarkMode: (val: boolean) => { setIsDarkMode(val); localStorage.setItem('housegram_dark_mode', String(val)); },
      passcode, isLocked, setIsLocked, updatePasscode, user, 
      currentUser: user ? { id: user.uid, email: user.email } : null,
      isAdmin, isMaintenance, isVictoryDayTheme, isFrozen, frozenAt, frozenReason, logout, setTypingStatus,
      isPremium, premiumExpiry, aiRequestsToday, maxAiRequests,
      aiTrialStart, startAiTrial, isAiTrialActive, aiTrialMsLeft
    }}>
      {!authReady ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : isMaintenance && !isAdmin ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-50 p-6 text-center">
          <div className="text-6xl mb-4">🛠️</div>
          <h2 className="text-2xl font-bold mb-2">Технические работы</h2>
          <p className="text-gray-600">Мы обновляем приложение. Пожалуйста, зайдите позже.</p>
        </div>
      ) : children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
