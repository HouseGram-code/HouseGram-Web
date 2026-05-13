'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Zap, Check, Sparkles, Star, Search, Users, X } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { 
  sendGift, 
  getUserStars, 
  subscribeToUserStars,
} from '@/lib/firebase-gifts';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import { GIFTS, getGiftAnimatedUrl } from '@/lib/gifts';
import Toast, { type ToastState, nextToastId } from './Toast';

const MAX_GREETING_LENGTH = 140;

// Реэкспорт getGiftAnimatedUrl сохранён для обратной совместимости со старыми
// импортерами; новые потребители должны импортировать его напрямую из
// '@/lib/gifts', чтобы не тянуть весь экран SendGiftView в свой бандл.
export { getGiftAnimatedUrl };

export default function SendGiftView() {
  const { setView, themeColor, contacts, currentUser, setActiveChatId } = useChat();
  const [step, setStep] = useState<'select-user' | 'select-gift' | 'confirm'>('select-user');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedGift, setSelectedGift] = useState<typeof GIFTS[0] | null>(null);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userStars, setUserStars] = useState(100);
  const [sendToSelf, setSendToSelf] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  // Новые состояния: поиск получателя, поздравительное сообщение, уведомление.
  const [userSearch, setUserSearch] = useState('');
  const [greeting, setGreeting] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (
    type: ToastState['type'],
    title: string,
    description?: string,
    extras?: Partial<Pick<ToastState, 'actionLabel' | 'onAction'>>,
  ) => {
    setToast({ id: nextToastId(), type, title, description, ...extras });
  };

  // Обновляем время каждую минуту
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Проверка доступности подарка
  const isGiftAvailable = (gift: typeof GIFTS[0]) => {
    if (!gift.unlockDate) return true;
    const now = new Date();
    return now >= gift.unlockDate;
  };

  // Время до разблокировки
  const getTimeUntilUnlock = (gift: typeof GIFTS[0]) => {
    if (!gift.unlockDate) return '';
    
    const now = new Date();
    const unlock = new Date(gift.unlockDate);
    const diff = unlock.getTime() - now.getTime();
    
    if (diff <= 0) return '';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `Откроется через ${days}д ${hours}ч`;
    if (hours > 0) return `Откроется через ${hours}ч ${minutes}м`;
    return `Откроется через ${minutes}м`;
  };

  // Проверяем отправку себе
  useEffect(() => {
    const shouldSendToSelf = localStorage.getItem('sendGiftToSelf');
    if (shouldSendToSelf === 'true' && currentUser?.id) {
      setSendToSelf(true);
      setSelectedUserId(currentUser.id);
      setStep('select-gift');
      localStorage.removeItem('sendGiftToSelf');
    }
  }, [currentUser]);

  const availableContacts = useMemo(
    () => Object.values(contacts).filter(
      c => c.id !== 'saved_messages' && c.id !== 'test_bot' && !c.isChannel
    ),
    [contacts],
  );

  // Список получателей после применения строки поиска (по имени или username).
  const filteredContacts = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return availableContacts;
    return availableContacts.filter(c => {
      const name = (c.name || '').toLowerCase();
      const username = (c.username || '').toLowerCase();
      return name.includes(q) || username.includes(q);
    });
  }, [availableContacts, userSearch]);

  const selectedContact = selectedUserId 
    ? (selectedUserId === currentUser?.id && sendToSelf
        ? {
            id: currentUser.id,
            name: 'Вы',
            initial: currentUser.email?.charAt(0).toUpperCase() || 'Я',
            avatarColor: '#6B7280',
            avatarUrl: '',
            statusOnline: 'в сети',
            statusOffline: 'в сети',
            phone: '',
            bio: '',
            username: '',
            messages: [],
            isTyping: false,
            unread: 0,
            isChannel: false,
            isOfficial: false
          }
        : contacts[selectedUserId])
    : null;

  // Загружаем баланс и подписываемся на изменения
  useEffect(() => {
    if (!currentUser?.id) return;
    
    // Загружаем начальный баланс
    getUserStars(currentUser.id).then(setUserStars);
    
    // Подписываемся на изменения
    const unsubscribe = subscribeToUserStars(currentUser.id, setUserStars);
    
    return unsubscribe;
  }, [currentUser]);

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setStep('select-gift');
  };

  const handleSelectGift = (gift: typeof GIFTS[0]) => {
    if (userStars < gift.cost) {
      showToast(
        'error',
        'Недостаточно молний',
        `Баланс ${userStars} ⚡ • нужно ${gift.cost} ⚡`,
        { actionLabel: 'Пополнить', onAction: () => setView('buy-stars') },
      );
      return;
    }
    setSelectedGift(gift);
    setStep('confirm');
  };

  const handleSendGift = async () => {
    if (!selectedUserId || !selectedGift || !currentUser?.id) return;
    
    // Защита от двойного клика
    if (sending) return;

    if (userStars < selectedGift.cost) {
      showToast(
        'error',
        'Недостаточно молний',
        `Баланс ${userStars} ⚡ • нужно ${selectedGift.cost} ⚡`,
        { actionLabel: 'Пополнить', onAction: () => setView('buy-stars') },
      );
      return;
    }

    setSending(true);
    try {
      // Отправляем подарок через Firebase
      const result = await sendGift(
        currentUser.id,
        selectedUserId,
        selectedGift.id,
        selectedGift.name,
        selectedGift.emoji,
        selectedGift.cost
      );

      if (!result.success) {
        showToast('error', 'Не удалось отправить подарок', result.error);
        return;
      }

      // Отправляем сообщение с подарком в чат
      const chatId = [currentUser.id, selectedUserId].sort().join('_');
      const timestamp = new Date();
      const trimmedGreeting = greeting.trim().slice(0, MAX_GREETING_LENGTH);
      const baseLastMessage = `Подарок: ${selectedGift.name}`;
      const lastMessagePreview = trimmedGreeting
        ? `${baseLastMessage} — ${trimmedGreeting}`
        : baseLastMessage;
      
      // Создаем/обновляем чат
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        await setDoc(chatRef, {
          participants: [currentUser.id, selectedUserId],
          updatedAt: timestamp,
          lastMessage: lastMessagePreview,
          lastMessageSenderId: currentUser.id
        });
      } else {
        await updateDoc(chatRef, {
          updatedAt: timestamp,
          lastMessage: lastMessagePreview,
          lastMessageSenderId: currentUser.id
        });
      }
      
      // Добавляем сообщение с подарком
      const timeString = `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;
      const messageId = `gift_${currentUser.id}_${selectedUserId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await setDoc(doc(db, 'chats', chatId, 'messages', messageId), {
        chatId,
        senderId: currentUser.id,
        text: trimmedGreeting
          ? `Подарок: ${selectedGift.emoji} ${selectedGift.name} — ${trimmedGreeting}`
          : `Подарок: ${selectedGift.emoji} ${selectedGift.name}`,
        time: timeString,
        createdAt: serverTimestamp(),
        status: 'sent',
        type: 'sent',
        gift: {
          id: selectedGift.id,
          name: selectedGift.name,
          emoji: selectedGift.emoji,
          cost: selectedGift.cost,
          from: currentUser.id,
          ...(trimmedGreeting ? { greeting: trimmedGreeting } : {}),
        }
      });

      setShowSuccess(true);
      setTimeout(() => {
        // Открываем чат с получателем
        setActiveChatId(selectedUserId);
        setView('chat');
      }, 1500);
    } catch (e) {
      console.error('Failed to send gift:', e);
      showToast(
        'error',
        'Ошибка при отправке подарка',
        e instanceof Error ? e.message : 'Неизвестная ошибка',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-tg-bg-light flex flex-col z-30"
    >
      {/* Header */}
      <div
        className="text-tg-header-text px-2.5 h-12 flex items-center gap-2.5 shrink-0"
        style={{ backgroundColor: themeColor }}
      >
        <button
          onClick={() => {
            if (step === 'select-user') {
              setView('stars');
            } else if (step === 'select-gift' && sendToSelf) {
              setView('stars');
            } else if (step === 'select-gift') {
              setStep('select-user');
            } else {
              setStep('select-gift');
            }
          }}
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[18px] font-medium flex-grow">
          {step === 'select-user' && 'Выберите получателя'}
          {step === 'select-gift' && (sendToSelf ? 'Подарок себе' : 'Выберите подарок')}
          {step === 'confirm' && (sendToSelf ? 'Отправить себе' : 'Отправить подарок')}
        </h1>
        {/* Баланс в хедере — всегда под рукой */}
        <div
          className="hidden sm:flex items-center gap-1 text-[13px] font-semibold bg-white/15 hover:bg-white/20 transition-colors rounded-full px-3 py-1 cursor-pointer"
          onClick={() => setView('buy-stars')}
          title="Пополнить баланс"
        >
          <Zap size={14} fill="currentColor" className="text-yellow-300" />
          {userStars}
        </div>
      </div>

      {/* Step Indicator — прогресс визуально подсказывает 3 шага */}
      <div className="px-4 pt-3 shrink-0">
        <div className="flex items-center gap-1.5">
          {(['select-user', 'select-gift', 'confirm'] as const).map((s, idx) => {
            const current =
              step === 'select-user' ? 0 : step === 'select-gift' ? 1 : 2;
            const isActive = idx <= current;
            return (
              <motion.div
                key={s}
                className="h-1 flex-grow rounded-full"
                initial={false}
                animate={{
                  backgroundColor: isActive ? themeColor : '#e5e7eb',
                  opacity: isActive ? 1 : 0.6,
                }}
                transition={{ duration: 0.25 }}
              />
            );
          })}
        </div>
        <div className="text-[11px] text-gray-400 mt-1 flex items-center justify-between">
          <span>
            Шаг {step === 'select-user' ? 1 : step === 'select-gift' ? 2 : 3} из 3
          </span>
          <span className="flex items-center gap-1 sm:hidden">
            <Zap size={11} fill="currentColor" className="text-yellow-500" />
            <span className="font-semibold text-gray-600">{userStars}</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4">
        {/* Select User */}
        {step === 'select-user' && (
          <div>
            {/* Поиск по контактам — показываем только при наличии 4+ получателей */}
            {availableContacts.length >= 4 && (
              <div className="sticky top-0 z-10 mb-3 -mx-1 px-1 pb-2 bg-tg-bg-light">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Поиск по имени или @username"
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-gray-300 focus:bg-white transition-colors"
                  />
                  {userSearch && (
                    <button
                      onClick={() => setUserSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                      aria-label="Очистить"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {availableContacts.length === 0 ? (
              // Пусто: нет контактов вообще — подсказка найти кого-то через главный экран
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <Users size={36} className="text-blue-400" />
                </div>
                <div className="text-[17px] font-semibold text-gray-800 mb-1">
                  Пока нет контактов
                </div>
                <p className="text-[14px] text-gray-500 max-w-[260px] mb-4">
                  Чтобы отправить подарок, сначала начните чат с пользователем на главной.
                </p>
                <button
                  onClick={() => setView('menu')}
                  className="px-5 py-2.5 rounded-full text-white text-[14px] font-medium shadow-sm hover:shadow-md transition-all"
                  style={{ backgroundColor: themeColor }}
                >
                  Найти собеседника
                </button>
              </motion.div>
            ) : filteredContacts.length === 0 ? (
              // Пусто: по строке поиска никто не нашёлся
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Search size={28} className="text-gray-400" />
                </div>
                <div className="text-[15px] font-medium text-gray-700 mb-1">
                  Никого не нашли
                </div>
                <p className="text-[13px] text-gray-500">
                  Попробуйте другой запрос
                </p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map((contact, index) => (
                  <motion.button
                    key={contact.id}
                    onClick={() => handleSelectUser(contact.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.2) }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full bg-white rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
                  >
                    {contact.avatarUrl ? (
                      <Image
                        src={contact.avatarUrl}
                        alt={contact.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                        referrerPolicy="no-referrer"
                        unoptimized
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-[18px]"
                        style={{ backgroundColor: contact.avatarColor }}
                      >
                        {contact.initial}
                      </div>
                    )}
                    <div className="flex-grow text-left min-w-0">
                      <div className="text-[16px] font-medium text-gray-900 truncate">{contact.name}</div>
                      <div className="text-[13px] text-gray-500 truncate">
                        {contact.username || contact.statusOffline}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Select Gift with Enhanced Animations */}
        {step === 'select-gift' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="mb-4 text-center"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <h3 className="text-[17px] font-medium text-gray-900 mb-1">Выберите подарок</h3>
              <p className="text-[14px] text-gray-500">
                {sendToSelf ? 'Для себя' : `Для ${selectedContact?.name}`}
              </p>
            </motion.div>
            
            <div className="grid grid-cols-2 gap-3">
              {GIFTS.map((gift, index) => {
                const available = isGiftAvailable(gift);
                const timeUntilUnlock = getTimeUntilUnlock(gift);
                const isLocked = !available;
                const canAfford = userStars >= gift.cost;
                // may_1 был единственным лимитированным подарком — снят с продажи.
                const isSoldOut = false;
                const remaining = 0;
                
                return (
                  <motion.button
                    key={gift.id}
                    onClick={() => {
                      if (!isLocked && !isSoldOut && canAfford) {
                        handleSelectGift(gift);
                      }
                    }}
                    disabled={isLocked || isSoldOut || !canAfford}
                    className={`relative rounded-2xl p-4 transition-all overflow-hidden ${
                      gift.spaceTheme
                        ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-black'
                        : gift.mayTheme
                        ? 'bg-gradient-to-br from-red-500 via-rose-500 to-orange-400'
                        : gift.special
                        ? 'bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100'
                        : 'bg-white shadow-sm'
                    }`}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={!isLocked && !isSoldOut && canAfford ? { 
                      scale: 1.05,
                      rotate: [0, -2, 2, -2, 0],
                      transition: { duration: 0.3 }
                    } : {}}
                    whileTap={!isLocked && !isSoldOut && canAfford ? { scale: 0.95 } : {}}
                  >
                    {/* Background Animation for Special Gifts */}
                    {gift.special && !isLocked && (
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute"
                            style={{
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                              scale: [0, 1, 0],
                              opacity: [0, 0.6, 0],
                              rotate: [0, 360],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: i * 0.3,
                            }}
                          >
                            <Sparkles
                              size={12}
                              className={
                                gift.spaceTheme
                                  ? 'text-cyan-300'
                                  : gift.mayTheme
                                  ? 'text-yellow-200'
                                  : 'text-purple-400'
                              }
                            />
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Space Theme Stars */}
                    {gift.spaceTheme && !isLocked && (
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(10)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute"
                            style={{
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                              scale: [0, 1, 0],
                              opacity: [0, 1, 0],
                            }}
                            transition={{
                              duration: 2 + Math.random(),
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          >
                            <Star size={8} className="text-cyan-300" fill="currentColor" />
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* May Theme: лёгкий светящийся радиальный блик + падающие искры */}
                    {gift.mayTheme && !isLocked && (
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                          className="absolute inset-0"
                          style={{
                            background:
                              'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.45) 0%, transparent 60%)',
                          }}
                          animate={{ opacity: [0.4, 0.9, 0.4] }}
                          transition={{ duration: 2.4, repeat: Infinity }}
                        />
                        {[...Array(10)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-1 h-1 rounded-full bg-yellow-100"
                            style={{
                              left: `${(i * 13) % 100}%`,
                              top: `${(i * 27) % 100}%`,
                            }}
                            animate={{
                              y: [0, 14, 0],
                              opacity: [0, 1, 0],
                            }}
                            transition={{
                              duration: 2 + (i % 3) * 0.4,
                              repeat: Infinity,
                              delay: i * 0.18,
                            }}
                          />
                        ))}
                      </div>
                    )}

                    <div className="relative z-10">
                      <motion.div 
                        className="mb-2 text-center flex items-center justify-center"
                        animate={!isLocked && !isSoldOut && canAfford ? {
                          scale: [1, 1.1, 1],
                          rotate: [0, -5, 5, -5, 0],
                        } : {}}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1,
                        }}
                      >
                        {gift.animated && gift.animatedUrl ? (
                          <Image
                            src={gift.animatedUrl}
                            alt={gift.name}
                            width={60}
                            height={60}
                            className="object-contain"
                            unoptimized
                          />
                        ) : (
                          <span className="text-[60px]">{gift.emoji}</span>
                        )}
                      </motion.div>
                      
                      <div
                        className={`text-[15px] font-medium mb-1 text-center truncate ${
                          gift.spaceTheme || gift.mayTheme ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {gift.name}
                      </div>
                      
                      {isSoldOut ? (
                        <motion.div 
                          className="text-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <div className="text-[20px] mb-1">🔒</div>
                          <div className="text-[11px] text-red-600 font-medium">
                            Распродано
                          </div>
                        </motion.div>
                      ) : isLocked ? (
                        <motion.div 
                          className="text-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <motion.div 
                            className="text-[20px] mb-1"
                            animate={{ rotate: [0, -10, 10, -10, 0] }}
                            transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                          >
                            🔒
                          </motion.div>
                          <div
                            className={`text-[11px] font-medium ${
                              gift.mayTheme ? 'text-yellow-100' : 'text-purple-600'
                            }`}
                          >
                            {timeUntilUnlock}
                          </div>
                          {gift.limited && (
                            <div
                              className={`text-[10px] mt-1 ${
                                gift.spaceTheme
                                  ? 'text-cyan-300'
                                  : gift.mayTheme
                                  ? 'text-white/90'
                                  : 'text-purple-600'
                              }`}
                            >
                              {remaining} из {gift.totalLimit}
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        <>
                          <motion.div
                            className={`flex items-center justify-center gap-1 font-semibold text-[14px] ${
                              gift.mayTheme ? 'text-white' : 'text-yellow-600'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            animate={
                              gift.mayTheme
                                ? { scale: [1, 1.08, 1] }
                                : undefined
                            }
                            transition={
                              gift.mayTheme
                                ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
                                : undefined
                            }
                          >
                            <motion.div
                              animate={
                                gift.mayTheme
                                  ? { rotate: [0, -15, 15, -15, 0], scale: [1, 1.2, 1] }
                                  : { rotate: [0, -15, 15, -15, 0] }
                              }
                              transition={{
                                duration: gift.mayTheme ? 1.4 : 1.5,
                                repeat: Infinity,
                                repeatDelay: gift.mayTheme ? 0 : 1,
                                ease: 'easeInOut',
                              }}
                            >
                              <Zap
                                size={14}
                                fill="currentColor"
                                className={gift.mayTheme ? 'text-yellow-200' : ''}
                              />
                            </motion.div>
                            {gift.cost}
                          </motion.div>
                          {!canAfford && (
                            <motion.div
                              className={`text-[11px] mt-1 text-center ${
                                gift.mayTheme ? 'text-yellow-100' : 'text-red-500'
                              }`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              Недостаточно
                            </motion.div>
                          )}
                          {gift.limited && (
                            <motion.div
                              className={`text-[10px] mt-1 text-center ${
                                gift.spaceTheme
                                  ? 'text-cyan-300'
                                  : gift.mayTheme
                                  ? 'text-white/90'
                                  : 'text-purple-600'
                              }`}
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              {remaining} из {gift.totalLimit}
                            </motion.div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
            
            <motion.div 
              className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-[13px] text-gray-600">
                Ваш баланс: <span className="font-semibold text-gray-900">{userStars}</span>{' '}
                <Zap size={12} className="inline text-yellow-500" fill="currentColor" />
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Confirm with Enhanced Animation */}
        {step === 'confirm' && selectedContact && selectedGift && (
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div 
              className="relative bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 text-white text-center overflow-hidden"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {/* Animated Background Stars */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 0.6, 0],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 2 + Math.random(),
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  >
                    <Star size={12} className="text-white/40" fill="white" />
                  </motion.div>
                ))}
              </div>

              <motion.div 
                className="mb-4 relative z-10 flex items-center justify-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200,
                  delay: 0.2 
                }}
                whileHover={{
                  scale: 1.1,
                  rotate: [0, -10, 10, -10, 0],
                  transition: { duration: 0.5 }
                }}
              >
                {selectedGift.animated && selectedGift.animatedUrl ? (
                  <Image
                    src={selectedGift.animatedUrl}
                    alt={selectedGift.name}
                    width={100}
                    height={100}
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="text-[100px]">{selectedGift.emoji}</span>
                )}
              </motion.div>
              
              <motion.h3 
                className="text-[20px] font-bold mb-2 relative z-10"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {selectedGift.name}
              </motion.h3>
              
              <motion.p 
                className="text-white/90 text-[14px] mb-4 relative z-10"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Для: {selectedContact.name}
              </motion.p>
              
              <motion.div 
                className="flex items-center justify-center gap-2 text-[18px] font-bold relative z-10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <motion.div
                  animate={{ 
                    rotate: [0, -15, 15, -15, 0],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity
                  }}
                >
                  <Zap size={20} fill="currentColor" />
                </motion.div>
                {selectedGift.cost}
              </motion.div>
            </motion.div>

            {/* Поздравительное сообщение к подарку (опционально) */}
            {!sendToSelf && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <label className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-medium text-gray-800">
                    Поздравление{' '}
                    <span className="text-gray-400 font-normal">
                      (необязательно)
                    </span>
                  </span>
                  <span
                    className={`text-[11px] tabular-nums ${
                      greeting.length > MAX_GREETING_LENGTH - 20
                        ? 'text-orange-500'
                        : 'text-gray-400'
                    }`}
                  >
                    {greeting.length}/{MAX_GREETING_LENGTH}
                  </span>
                </label>
                <textarea
                  value={greeting}
                  onChange={(e) =>
                    setGreeting(e.target.value.slice(0, MAX_GREETING_LENGTH))
                  }
                  placeholder={`Напишите ${selectedContact.name} пару тёплых слов…`}
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-gray-300 focus:bg-white transition-colors resize-none"
                />
                {/* Быстрые шаблоны поздравлений для ленивых пальцев */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['С праздником! 🎉', 'От души ❤️', 'Ты лучший(ая) ✨'].map(
                    (t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setGreeting(t)}
                        className="text-[12px] text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full px-2.5 py-1 transition-colors"
                      >
                        {t}
                      </button>
                    ),
                  )}
                </div>
              </motion.div>
            )}

            <motion.button
              onClick={handleSendGift}
              disabled={sending}
              className="w-full bg-blue-500 text-white rounded-xl p-4 font-medium text-[16px] relative overflow-hidden disabled:opacity-50"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={!sending ? { scale: 1.02 } : {}}
              whileTap={!sending ? { scale: 0.98 } : {}}
            >
              {sending ? (
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  Отправка...
                </motion.span>
              ) : (
                'Отправить подарок'
              )}
              
              {/* Shimmer Effect */}
              {!sending && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                />
              )}
            </motion.button>

            <motion.div 
              className="bg-gray-50 rounded-xl p-4 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <p className="text-[13px] text-gray-600">
                После отправки с вашего баланса будет списано {selectedGift.cost} ⚡
              </p>
              <p className="text-[13px] text-gray-600 mt-1">
                Текущий баланс: {userStars} ⚡
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Enhanced Success Animation - Telegram Style */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-40"
          >
            {/* Confetti Effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-2xl"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    scale: 0,
                    opacity: 1 
                  }}
                  animate={{
                    x: (Math.random() - 0.5) * 400,
                    y: (Math.random() - 0.5) * 400,
                    scale: [0, 1, 0.8],
                    opacity: [1, 1, 0],
                    rotate: Math.random() * 720,
                  }}
                  transition={{
                    duration: 1.5,
                    ease: "easeOut",
                    delay: i * 0.02,
                  }}
                >
                  {['🎉', '✨', '⭐', '💫', '🎊'][Math.floor(Math.random() * 5)]}
                </motion.div>
              ))}
            </div>

            <motion.div 
              className="bg-white rounded-3xl p-8 text-center relative z-10 shadow-2xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200,
                damping: 15
              }}
            >
              {/* Success Icon with Pulse */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  delay: 0.3, 
                  type: 'spring',
                  stiffness: 200 
                }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: 2,
                    delay: 0.5
                  }}
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={48} className="text-green-500" strokeWidth={3} />
                  </div>
                </motion.div>
              </motion.div>

              <motion.h3 
                className="text-[24px] font-bold text-gray-900 mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Подарок отправлен!
              </motion.h3>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
              >
                <p className="text-[16px] text-gray-600 mb-2">
                  {selectedGift?.emoji} {selectedGift?.name}
                </p>
                <p className="text-[14px] text-gray-500">
                  для {selectedContact?.name}
                </p>
              </motion.div>

              {/* Sparkles around */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-2xl"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    x: Math.cos((i / 8) * Math.PI * 2) * 100,
                    y: Math.sin((i / 8) * Math.PI * 2) * 100,
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    rotate: 360,
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.4 + i * 0.05,
                  }}
                >
                  ✨
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Глобальный toast для ошибок/успехов отправки подарков */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </motion.div>
  );
}
