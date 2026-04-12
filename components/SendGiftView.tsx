'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Zap, Gift, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
    totalLimit: 15,
    gifUrl: 'https://media1.tenor.com/m/easter-bunny-gif-15755652607176951873/tenor.gif'
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
  const { setView, themeColor, contacts, currentUser } = useChat();
  const [step, setStep] = useState<'select-user' | 'select-gift' | 'confirm'>('select-user');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedGift, setSelectedGift] = useState<typeof GIFTS[0] | null>(null);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userStars, setUserStars] = useState(100);
  const [sendToSelf, setSendToSelf] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [previewGift, setPreviewGift] = useState<typeof GIFTS[0] | null>(null);
  const [easterBunnyRemaining, setEasterBunnyRemaining] = useState(15);
  const [cosmonautRemaining, setCosmonautRemaining] = useState(20);

  // Обновляем время каждую минуту для проверки доступности пасхального подарка
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Каждую минуту
    return () => clearInterval(timer);
  }, []);

  // Функция проверки доступности подарка
  const isGiftAvailable = (gift: typeof GIFTS[0]) => {
    if (!gift.unlockDate) return true;
    
    // Проверяем лимит для ограниченных подарков
    if (gift.limited) {
      if (gift.id === 'easter_bunny' && easterBunnyRemaining <= 0) return false;
      if (gift.id === 'cosmonaut' && cosmonautRemaining <= 0) return false;
    }
    
    // Получаем текущее время пользователя
    const now = new Date();
    
    // Проверяем, наступило ли время разблокировки
    return now >= gift.unlockDate;
  };

  // Функция для получения времени до разблокировки
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

  // Проверяем, нужно ли отправить подарок себе (из localStorage)
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

  // Получаем выбранный контакт или создаем временный для себя
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

  // Загружаем баланс пользователя
  useEffect(() => {
    const loadBalance = async () => {
      if (!currentUser?.id) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('stars')
          .eq('id', currentUser.id)
          .single();
        
        if (data && !error) {
          setUserStars(data.stars || 100);
        }
      } catch (e) {
        console.error('Failed to load balance:', e);
      }
    };
    loadBalance();
  }, [currentUser]);

  // Загружаем количество оставшихся пасхальных подарков
  useEffect(() => {
    const loadEasterBunnyCount = async () => {
      try {
        // Получаем количество отправленных пасхальных зайцев из Firebase
        const { data, error } = await supabase
          .from('received_gifts')
          .select('id', { count: 'exact' })
          .eq('gift_id', 'easter_bunny');
        
        if (!error && data) {
          const sent = data.length || 0;
          setEasterBunnyRemaining(Math.max(0, 15 - sent));
        }
      } catch (e) {
        console.error('Failed to load easter bunny count:', e);
      }
    };
    loadEasterBunnyCount();
  }, []);

  // Загружаем количество оставшихся космонавтов
  useEffect(() => {
    const loadCosmonautCount = async () => {
      try {
        const { data, error } = await supabase
          .from('received_gifts')
          .select('id', { count: 'exact' })
          .eq('gift_id', 'cosmonaut');
        
        if (!error && data) {
          const sent = data.length || 0;
          setCosmonautRemaining(Math.max(0, 20 - sent));
        }
      } catch (e) {
        console.error('Failed to load cosmonaut count:', e);
      }
    };
    loadCosmonautCount();
  }, []);

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setStep('select-gift');
  };

  const handleSelectGift = (gift: typeof GIFTS[0]) => {
    // Проверяем достаточно ли молний
    if (userStars < gift.cost) {
      alert(`Недостаточно молний! У вас ${userStars}, а нужно ${gift.cost}`);
      return;
    }
    setSelectedGift(gift);
    setStep('confirm');
  };

  const handleSendGift = async () => {
    if (!selectedUserId || !selectedGift || !currentUser?.id) return;

    // Еще раз проверяем баланс перед отправкой
    if (userStars < selectedGift.cost) {
      alert(`Недостаточно молний! У вас ${userStars}, а нужно ${selectedGift.cost}`);
      return;
    }

    setSending(true);
    try {
      // Сначала создаем/обновляем пользователя в Supabase если его нет
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!existingUser) {
        // Создаем пользователя в Supabase
        await supabase
          .from('users')
          .insert({
            id: currentUser.id,
            email: currentUser.email || 'user@example.com',
            name: 'User',
            username: '@user',
            stars: 100,
            gifts_sent: 0,
            gifts_received: 0
          });
      }

      // Проверяем получателя
      const { data: existingReceiver } = await supabase
        .from('users')
        .select('id')
        .eq('id', selectedUserId)
        .maybeSingle();

      if (!existingReceiver) {
        // Создаем получателя в Supabase
        const contact = contacts[selectedUserId];
        await supabase
          .from('users')
          .insert({
            id: selectedUserId,
            email: `${selectedUserId}@temp.com`,
            name: contact?.name || 'User',
            username: `@${selectedUserId.substring(0, 10)}`,
            stars: 100,
            gifts_sent: 0,
            gifts_received: 0
          });
      }

      const chatId = [currentUser.id, selectedUserId].sort().join('_');
      
      // Проверяем существует ли чат, если нет - создаем
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('id', chatId)
        .maybeSingle();

      if (!existingChat) {
        const { error: chatError } = await supabase
          .from('chats')
          .insert({
            id: chatId,
            participants: [currentUser.id, selectedUserId],
            updated_at: new Date().toISOString()
          });
        
        if (chatError) {
          console.error('Chat creation error:', chatError);
          throw chatError;
        }
      }
      
      // Отправляем подарок как специальное сообщение
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: currentUser.id,
          text: '',
          type: 'gift',
          status: 'sent',
          gift_id: selectedGift.id,
          gift_name: selectedGift.name,
          gift_emoji: selectedGift.emoji,
          gift_cost: selectedGift.cost,
          gift_from: currentUser.id
        });

      if (messageError) {
        console.error('Message error:', messageError);
        throw messageError;
      }

      // Получаем текущие значения отправителя
      const { data: senderData } = await supabase
        .from('users')
        .select('gifts_sent')
        .eq('id', currentUser.id)
        .single();

      // Обновляем баланс отправителя
      const { error: senderError } = await supabase
        .from('users')
        .update({
          stars: userStars - selectedGift.cost,
          gifts_sent: (senderData?.gifts_sent || 0) + 1
        })
        .eq('id', currentUser.id);

      if (senderError) {
        console.error('Sender update error:', senderError);
        throw senderError;
      }

      // Получаем текущие значения получателя
      const { data: receiverData } = await supabase
        .from('users')
        .select('gifts_received')
        .eq('id', selectedUserId)
        .single();

      // Обновляем статистику получателя
      const { error: receiverError } = await supabase
        .from('users')
        .update({
          gifts_received: (receiverData?.gifts_received || 0) + 1
        })
        .eq('id', selectedUserId);

      if (receiverError) {
        console.error('Receiver update error:', receiverError);
        throw receiverError;
      }

      // Добавляем подарок в коллекцию receivedGifts получателя
      // Получаем имя отправителя из userProfile
      const { data: senderProfile } = await supabase
        .from('users')
        .select('name')
        .eq('id', currentUser.id)
        .single();

      const senderName = senderProfile?.name || currentUser.email?.split('@')[0] || 'Пользователь';

      const { data: insertedGift, error: giftError } = await supabase
        .from('received_gifts')
        .insert({
          user_id: selectedUserId,
          gift_id: selectedGift.id,
          name: selectedGift.name,
          emoji: selectedGift.emoji,
          cost: selectedGift.cost,
          from_user_id: currentUser.id,
          from_name: senderName,
          can_convert: true,
          received_at: new Date().toISOString()
        })
        .select();

      if (giftError) {
        console.error('Gift storage error:', giftError);
        alert(`Ошибка при сохранении подарка: ${giftError.message}`);
      }

      // Также отправляем подарок в Firebase для отображения в чате
      try {
        const firebaseChatId = [currentUser.id, selectedUserId].sort().join('_');
        
        // Создаем/обновляем чат в Firebase
        const chatRef = doc(db, 'chats', firebaseChatId);
        const chatDoc = await getDoc(chatRef);
        
        if (!chatDoc.exists()) {
          await setDoc(chatRef, {
            participants: [currentUser.id, selectedUserId],
            updatedAt: serverTimestamp(),
            lastMessage: `Подарок: ${selectedGift.name}`,
            lastMessageSenderId: currentUser.id
          });
        } else {
          await updateDoc(chatRef, {
            updatedAt: serverTimestamp(),
            lastMessage: `Подарок: ${selectedGift.name}`,
            lastMessageSenderId: currentUser.id
          });
        }
        
        // Отправляем сообщение с подарком в Firebase
        await addDoc(collection(db, 'chats', firebaseChatId, 'messages'), {
          chatId: firebaseChatId,
          senderId: currentUser.id,
          text: '',
          createdAt: serverTimestamp(),
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

        // Обновляем баланс в Firebase
        if (auth.currentUser) {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            await updateDoc(userRef, {
              stars: (userData.stars || 100) - selectedGift.cost,
              giftsSent: (userData.giftsSent || 0) + 1
            });
          }
        }

        // Обновляем получателя в Firebase
        const receiverRef = doc(db, 'users', selectedUserId);
        const receiverDoc = await getDoc(receiverRef);
        
        if (receiverDoc.exists()) {
          const receiverData = receiverDoc.data();
          await updateDoc(receiverRef, {
            giftsReceived: (receiverData.giftsReceived || 0) + 1
          });
        }
      } catch (firebaseError) {
        console.error('Firebase gift error:', firebaseError);
        // Не показываем ошибку пользователю, так как подарок уже отправлен в Supabase
      }

      // Обновляем счетчик для ограниченных подарков
      if (selectedGift.limited) {
        if (selectedGift.id === 'easter_bunny') {
          setEasterBunnyRemaining(prev => Math.max(0, prev - 1));
        } else if (selectedGift.id === 'cosmonaut') {
          setCosmonautRemaining(prev => Math.max(0, prev - 1));
        }
      }

      setShowSuccess(true);
      setTimeout(() => {
        setView('menu');
      }, 2000);
    } catch (e) {
      console.error('Failed to send gift:', e);
      
      // Детальная обработка ошибок
      let errorMessage = 'Unknown error';
      
      if (e instanceof Error) {
        errorMessage = e.message;
      } else if (typeof e === 'object' && e !== null) {
        errorMessage = JSON.stringify(e);
      } else if (typeof e === 'string') {
        errorMessage = e;
      }
      
      // Проверяем специфичные ошибки Supabase
      if (errorMessage.includes('violates foreign key constraint')) {
        errorMessage = 'Ошибка связи данных. Попробуйте еще раз.';
      } else if (errorMessage.includes('duplicate key')) {
        errorMessage = 'Подарок уже был отправлен.';
      } else if (errorMessage.includes('permission denied')) {
        errorMessage = 'Недостаточно прав для отправки подарка.';
      } else if (errorMessage.includes('network')) {
        errorMessage = 'Проблема с сетью. Проверьте подключение.';
      }
      
      alert(`Ошибка при отправке подарка: ${errorMessage}`);
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
                      if (isLocked || isSoldOut) {
                        setPreviewGift(gift);
                      } else if (canAfford) {
                        handleSelectGift(gift);
                      }
                    }}
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
                    {/* Космический фон */}
                    {gift.spaceTheme && (
                      <div className="absolute inset-0">
                        {/* Звезды */}
                        {[...Array(15)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute text-white"
                            style={{
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                              fontSize: `${8 + Math.random() * 8}px`
                            }}
                            animate={{
                              opacity: [0.3, 1, 0.3],
                              scale: [0.8, 1.2, 0.8]
                            }}
                            transition={{
                              duration: 2 + Math.random() * 2,
                              repeat: Infinity,
                              delay: i * 0.1
                            }}
                          >
                            ⭐
                          </motion.div>
                        ))}
                        {/* Планеты */}
                        <motion.div 
                          className="absolute top-1 right-1 text-[20px]"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                          🪐
                        </motion.div>
                        <motion.div 
                          className="absolute bottom-1 left-1 text-[18px]"
                          animate={{ y: [-5, 5, -5] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          🌍
                        </motion.div>
                      </div>
                    )}
                    
                    {/* Пасхальный фон */}
                    {gift.special && !gift.spaceTheme && (
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-0 text-[30px]">🌸</div>
                        <div className="absolute top-0 right-0 text-[25px]">🌷</div>
                        <div className="absolute bottom-0 left-0 text-[25px]">🌼</div>
                        <div className="absolute bottom-0 right-0 text-[30px]">🌺</div>
                      </div>
                    )}
                    
                    <div className="relative z-10">
                      {gift.spaceTheme ? (
                        <motion.div
                          animate={{
                            y: [0, -20, 0],
                            rotate: [0, 10, -10, 0]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="text-[60px] mb-2 text-center"
                        >
                          {gift.emoji}
                        </motion.div>
                      ) : (
                        <div 
                          className={`text-[60px] mb-2 text-center ${
                            gift.animation === 'easter' && available ? 'animate-bounce' : ''
                          }`}
                        >
                          {gift.emoji}
                        </div>
                      )}
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
                          <div className="text-[10px] text-gray-500 mt-1">
                            0 из {gift.totalLimit}
                          </div>
                        </div>
                      ) : isLocked ? (
                        <div className="text-center">
                          <div className="text-[20px] mb-1">🔒</div>
                          <div className="text-[11px] text-purple-600 font-medium">
                            {timeUntilUnlock}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">
                            12 апреля, 9:00
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
                      
                      {gift.special && available && !isSoldOut && (
                        <div className="mt-2 text-[10px] text-purple-600 font-medium text-center">
                          ✨ Эксклюзив ✨
                        </div>
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
              <p className="text-white/90 text-[15px]">
                {sendToSelf ? 'Подарок для себя' : `Подарок для ${selectedContact.name}`}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[15px] text-gray-700">Стоимость</span>
                <span className="text-[17px] font-semibold text-gray-900 flex items-center gap-1">
                  {selectedGift.cost} <Zap size={16} className="text-yellow-500" fill="currentColor" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-gray-700">Получатель</span>
                <span className="text-[17px] font-semibold text-gray-900">
                  {sendToSelf ? 'Вы' : selectedContact.name}
                </span>
              </div>
            </div>

            <button
              onClick={handleSendGift}
              disabled={sending}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Gift size={20} />
                  Отправить подарок за <Zap size={16} fill="white" className="mx-1" /> {selectedGift.cost}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewGift && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 rounded-3xl p-6 max-w-sm w-full relative overflow-hidden"
            >
              {/* Пасхальный фон */}
              <div className="absolute inset-0 opacity-20">
                <motion.div 
                  className="absolute top-4 left-4 text-[40px]"
                  animate={{ rotate: [0, 10, -10, 0], y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🌸
                </motion.div>
                <motion.div 
                  className="absolute top-4 right-4 text-[40px]"
                  animate={{ rotate: [0, -10, 10, 0], y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  🌷
                </motion.div>
                <motion.div 
                  className="absolute bottom-4 left-4 text-[40px]"
                  animate={{ rotate: [0, 10, -10, 0], y: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  🌼
                </motion.div>
                <motion.div 
                  className="absolute bottom-4 right-4 text-[40px]"
                  animate={{ rotate: [0, -10, 10, 0], y: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                >
                  🌺
                </motion.div>
              </div>

              <div className="relative z-10">
                {/* Анимированный заяц - всегда показываем эмодзи с красивой анимацией */}
                <div className="mb-4 flex justify-center relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, -5, 5, -3, 3, 0],
                      y: [0, -15, 0, -8, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-[120px] text-center"
                  >
                    🐰
                  </motion.div>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                      x: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.3
                    }}
                    className="text-[60px] absolute bottom-0 right-1/4"
                  >
                    🥚
                  </motion.div>
                </div>

                <h3 className="text-[24px] font-bold text-gray-900 mb-2 text-center">
                  {previewGift.name}
                </h3>
                
                <p className="text-[14px] text-gray-600 mb-4 text-center">
                  {previewGift.description}
                </p>

                {/* Информация */}
                <div className="bg-white/80 rounded-2xl p-4 mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] text-gray-700">Стоимость</span>
                    <span className="text-[17px] font-semibold text-gray-900 flex items-center gap-1">
                      {previewGift.cost} <Zap size={16} className="text-yellow-500" fill="currentColor" />
                    </span>
                  </div>
                  
                  {previewGift.limited && (
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] text-gray-700">Доступно</span>
                      <span className="text-[17px] font-semibold text-purple-600">
                        {previewGift.id === 'easter_bunny' ? easterBunnyRemaining : cosmonautRemaining} из {previewGift.totalLimit}
                      </span>
                    </div>
                  )}
                  
                  {previewGift.unlockDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] text-gray-700">Открытие</span>
                      <span className="text-[15px] font-semibold text-gray-900">
                        12 апреля, 9:00
                      </span>
                    </div>
                  )}
                  
                  {getTimeUntilUnlock(previewGift) && (
                    <div className="text-center pt-2 border-t border-gray-200">
                      <span className="text-[13px] text-purple-600 font-medium">
                        🔒 {getTimeUntilUnlock(previewGift)}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setPreviewGift(null)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  Назад
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="bg-white rounded-3xl p-8 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={40} className="text-green-500" />
                </div>
              </motion.div>
              <h3 className="text-[20px] font-bold text-gray-900 mb-2">Подарок отправлен!</h3>
              <p className="text-[15px] text-gray-600">
                {sendToSelf ? 'Вы получили подарок!' : `${selectedContact?.name} получит ваш подарок`}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
