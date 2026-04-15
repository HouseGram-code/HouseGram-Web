'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Zap, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { 
  sendGift, 
  getUserStars, 
  subscribeToUserStars,
  getGiftCount,
  subscribeToGiftCount
} from '@/lib/firebase-gifts';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';

const GIFTS = [
  {
    id: 'teddy_bear',
    name: 'Плюшевый мишка',
    emoji: '🧸',
    cost: 15,
    animation: 'bounce',
    available: true
  },
  {
    id: 'red_heart',
    name: 'Красное сердце',
    emoji: '❤️',
    cost: 10,
    animation: 'pulse',
    available: true
  },
  {
    id: 'rose',
    name: 'Роза',
    emoji: '🌹',
    cost: 12,
    animation: 'bounce',
    available: true
  },
  {
    id: 'cake',
    name: 'Торт',
    emoji: '🎂',
    cost: 18,
    animation: 'bounce',
    available: true
  },
  {
    id: 'star',
    name: 'Звезда',
    emoji: '⭐',
    cost: 20,
    animation: 'spin',
    available: true
  },
  {
    id: 'gift_box',
    name: 'Подарочная коробка',
    emoji: '🎁',
    cost: 25,
    animation: 'bounce',
    available: true
  },
  {
    id: 'diamond',
    name: 'Бриллиант',
    emoji: '💎',
    cost: 50,
    animation: 'sparkle',
    available: true
  },
  {
    id: 'crown',
    name: 'Корона',
    emoji: '👑',
    cost: 100,
    animation: 'bounce',
    available: true
  },
  {
    id: 'easter_bunny',
    name: 'Пасхальный заяц',
    emoji: '🐰🥚',
    cost: 50,
    animation: 'easter',
    available: false,
    unlockDate: new Date('2026-04-12T09:00:00'),
    special: true,
    description: 'Эксклюзивный пасхальный подарок',
    limited: true,
    totalLimit: 15
  },
  {
    id: 'cosmonaut',
    name: 'Космонавт',
    emoji: '👨‍🚀🚀',
    cost: 50,
    animation: 'space',
    available: false,
    unlockDate: new Date('2026-04-12T00:00:00'),
    special: true,
    description: 'День космонавтики! Полетели в космос!',
    limited: true,
    totalLimit: 20,
    spaceTheme: true
  }
];

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
  const [easterBunnyRemaining, setEasterBunnyRemaining] = useState(15);
  const [cosmonautRemaining, setCosmonautRemaining] = useState(20);

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
    
    if (gift.limited) {
      if (gift.id === 'easter_bunny' && easterBunnyRemaining <= 0) return false;
      if (gift.id === 'cosmonaut' && cosmonautRemaining <= 0) return false;
    }
    
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

  const availableContacts = Object.values(contacts).filter(
    c => c.id !== 'saved_messages' && c.id !== 'test_bot' && !c.isChannel
  );

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

  // Загружаем количество оставшихся подарков (один раз при монтировании)
  useEffect(() => {
    // Easter Bunny
    getGiftCount('easter_bunny').then(sent => {
      setEasterBunnyRemaining(Math.max(0, 15 - sent));
    });
    
    // Cosmonaut
    getGiftCount('cosmonaut').then(sent => {
      setCosmonautRemaining(Math.max(0, 20 - sent));
    });
    
    // НЕ подписываемся на изменения в реальном времени, чтобы избежать спама обновлений
    // Пользователь увидит актуальное количество при открытии страницы
  }, []);

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setStep('select-gift');
  };

  const handleSelectGift = (gift: typeof GIFTS[0]) => {
    if (userStars < gift.cost) {
      alert(`Недостаточно молний! У вас ${userStars}, а нужно ${gift.cost}`);
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
      alert(`Недостаточно молний! У вас ${userStars}, а нужно ${selectedGift.cost}`);
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
        alert(`Ошибка: ${result.error}`);
        return;
      }

      // Отправляем сообщение с подарком в чат
      const chatId = [currentUser.id, selectedUserId].sort().join('_');
      const timestamp = new Date();
      
      // Создаем/обновляем чат
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        await setDoc(chatRef, {
          participants: [currentUser.id, selectedUserId],
          updatedAt: timestamp,
          lastMessage: `Подарок: ${selectedGift.name}`,
          lastMessageSenderId: currentUser.id
        });
      } else {
        await updateDoc(chatRef, {
          updatedAt: timestamp,
          lastMessage: `Подарок: ${selectedGift.name}`,
          lastMessageSenderId: currentUser.id
        });
      }
      
      // Добавляем сообщение с подарком
      const timeString = `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;
      const messageId = `gift_${currentUser.id}_${selectedUserId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await setDoc(doc(db, 'chats', chatId, 'messages', messageId), {
        chatId,
        senderId: currentUser.id,
        text: `Подарок: ${selectedGift.emoji} ${selectedGift.name}`,
        time: timeString,
        createdAt: timestamp, // ← Используем клиентский timestamp вместо serverTimestamp()
        status: 'sent',
        type: 'sent',
        gift: {
          id: selectedGift.id,
          name: selectedGift.name,
          emoji: selectedGift.emoji,
          cost: selectedGift.cost,
          from: currentUser.id
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
      alert(`Ошибка при отправке подарка: ${e instanceof Error ? e.message : 'Неизвестная ошибка'}`);
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
      className="absolute inset-0 bg-tg-bg-light flex flex-col z-10"
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
        <h1 className="text-[18px] font-medium">
          {step === 'select-user' && 'Выберите получателя'}
          {step === 'select-gift' && (sendToSelf ? 'Подарок себе' : 'Выберите подарок')}
          {step === 'confirm' && (sendToSelf ? 'Отправить себе' : 'Отправить подарок')}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4">
        {/* Select User */}
        {step === 'select-user' && (
          <div className="space-y-2">
            {availableContacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => handleSelectUser(contact.id)}
                className="w-full bg-white rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
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
                <div className="flex-grow text-left">
                  <div className="text-[16px] font-medium text-gray-900">{contact.name}</div>
                  <div className="text-[14px] text-gray-500">{contact.statusOffline}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Select Gift */}
        {step === 'select-gift' && (
          <div>
            <div className="mb-4 text-center">
              <h3 className="text-[17px] font-medium text-gray-900 mb-1">Выберите подарок</h3>
              <p className="text-[14px] text-gray-500">
                {sendToSelf ? 'Для себя' : `Для ${selectedContact?.name}`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {GIFTS.map(gift => {
                const available = isGiftAvailable(gift);
                const timeUntilUnlock = getTimeUntilUnlock(gift);
                const isLocked = !available;
                const canAfford = userStars >= gift.cost;
                const isSoldOut = gift.limited && (
                  (gift.id === 'easter_bunny' && easterBunnyRemaining <= 0) ||
                  (gift.id === 'cosmonaut' && cosmonautRemaining <= 0)
                );
                
                const remaining = gift.id === 'easter_bunny' ? easterBunnyRemaining : 
                                 gift.id === 'cosmonaut' ? cosmonautRemaining : 0;
                
                return (
                  <button
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
                        : gift.special 
                        ? 'bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100' 
                        : 'bg-white'
                    } ${
                      !isLocked && !isSoldOut && canAfford ? 'hover:bg-gray-50 hover:scale-105' : ''
                    } ${
                      (isLocked || isSoldOut || !canAfford) && !gift.special && !gift.spaceTheme ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="relative z-10">
                      <div className="text-[60px] mb-2 text-center">
                        {gift.emoji}
                      </div>
                      <div className={`text-[15px] font-medium mb-1 text-center truncate ${
                        gift.spaceTheme ? 'text-white' : 'text-gray-900'
                      }`}>
                        {gift.name}
                      </div>
                      
                      {isSoldOut ? (
                        <div className="text-center">
                          <div className="text-[20px] mb-1">🔒</div>
                          <div className="text-[11px] text-red-600 font-medium">
                            Распродано
                          </div>
                        </div>
                      ) : isLocked ? (
                        <div className="text-center">
                          <div className="text-[20px] mb-1">🔒</div>
                          <div className="text-[11px] text-purple-600 font-medium">
                            {timeUntilUnlock}
                          </div>
                          {gift.limited && (
                            <div className={`text-[10px] mt-1 ${gift.spaceTheme ? 'text-cyan-300' : 'text-purple-600'}`}>
                              {remaining} из {gift.totalLimit}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-center gap-1 text-yellow-600 font-semibold text-[14px]">
                            <Zap size={14} fill="currentColor" />
                            {gift.cost}
                          </div>
                          {!canAfford && (
                            <div className="text-[11px] text-red-500 mt-1 text-center">Недостаточно</div>
                          )}
                          {gift.limited && (
                            <div className={`text-[10px] mt-1 text-center ${gift.spaceTheme ? 'text-cyan-300' : 'text-purple-600'}`}>
                              {remaining} из {gift.totalLimit}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
              <p className="text-[13px] text-gray-600">
                Ваш баланс: <span className="font-semibold text-gray-900">{userStars}</span> <Zap size={12} className="inline text-yellow-500" fill="currentColor" />
              </p>
            </div>
          </div>
        )}

        {/* Confirm */}
        {step === 'confirm' && selectedContact && selectedGift && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 text-white text-center">
              <div className="text-[100px] mb-4">{selectedGift.emoji}</div>
              <h3 className="text-[20px] font-bold mb-2">{selectedGift.name}</h3>
              <p className="text-white/90 text-[14px] mb-4">
                Для: {selectedContact.name}
              </p>
              <div className="flex items-center justify-center gap-2 text-[18px] font-bold">
                <Zap size={20} fill="currentColor" />
                {selectedGift.cost}
              </div>
            </div>

            <button
              onClick={handleSendGift}
              disabled={sending}
              className="w-full bg-blue-500 text-white rounded-xl p-4 font-medium text-[16px] hover:bg-blue-600 active:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {sending ? 'Отправка...' : 'Отправить подарок'}
            </button>

            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-[13px] text-gray-600">
                После отправки с вашего баланса будет списано {selectedGift.cost} ⚡
              </p>
              <p className="text-[13px] text-gray-600 mt-1">
                Текущий баланс: {userStars} ⚡
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Success Animation */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"
        >
          <div className="bg-white rounded-3xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <Check size={64} className="text-green-500 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-[20px] font-bold text-gray-900 mb-2">
              Подарок отправлен!
            </h3>
            <p className="text-[14px] text-gray-600">
              {selectedGift?.emoji} {selectedGift?.name}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
