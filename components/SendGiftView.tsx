'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Zap, Gift, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

const GIFTS = [
  {
    id: 'teddy_bear',
    name: 'Плюшевый мишка',
    emoji: '🧸',
    cost: 15,
    animation: 'bounce'
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

  const availableContacts = Object.values(contacts).filter(
    c => c.id !== 'saved_messages' && c.id !== 'test_bot' && !c.isChannel
  );

  const selectedContact = selectedUserId ? contacts[selectedUserId] : null;

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

      console.log('Attempting to insert gift:', {
        user_id: selectedUserId,
        gift_id: selectedGift.id,
        name: selectedGift.name,
        emoji: selectedGift.emoji,
        cost: selectedGift.cost,
        from_user_id: currentUser.id,
        from_name: senderName
      });

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
        // Не прерываем процесс, но показываем ошибку
      } else {
        console.log('Gift inserted successfully:', insertedGift);
      }

      setShowSuccess(true);
      setTimeout(() => {
        setView('menu');
      }, 2000);
    } catch (e) {
      console.error('Failed to send gift:', e);
      alert(`Ошибка при отправке подарка: ${e instanceof Error ? e.message : 'Unknown error'}`);
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
          onClick={() => step === 'select-user' ? setView('stars') : setStep(step === 'select-gift' ? 'select-user' : 'select-gift')}
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[18px] font-medium">
          {step === 'select-user' && 'Выберите получателя'}
          {step === 'select-gift' && 'Выберите подарок'}
          {step === 'confirm' && 'Отправить подарок'}
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
          <div className="space-y-4">
            {GIFTS.map(gift => (
              <button
                key={gift.id}
                onClick={() => handleSelectGift(gift)}
                className="w-full bg-white rounded-2xl p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="text-[80px] mb-3 text-center">{gift.emoji}</div>
                <div className="text-[18px] font-medium text-gray-900 mb-2 text-center">{gift.name}</div>
                <div className="flex items-center justify-center gap-1 text-yellow-600 font-semibold">
                  <Zap size={18} fill="currentColor" />
                  {gift.cost}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Confirm */}
        {step === 'confirm' && selectedContact && selectedGift && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 text-white text-center">
              <div className="text-[100px] mb-4">{selectedGift.emoji}</div>
              <h3 className="text-[20px] font-bold mb-2">{selectedGift.name}</h3>
              <p className="text-white/90 text-[15px]">
                Подарок для {selectedContact.name}
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
                <span className="text-[17px] font-semibold text-gray-900">{selectedContact.name}</span>
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
                {selectedContact?.name} получит ваш подарок
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
