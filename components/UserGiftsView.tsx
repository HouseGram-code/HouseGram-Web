'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Gift, User, Loader2, Zap } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getGiftAnimatedUrl } from '@/lib/gifts';
import Image from 'next/image';

interface SentGift {
  id: string;
  gift_id: string;
  /** Приходит из sendGift после фикса — для старых документов может отсутствовать. */
  gift_name?: string;
  gift_emoji?: string;
  to_user_id: string;
  cost: number;
  sent_at: any;
}

export default function UserGiftsView() {
  const { setView, themeColor, isGlassEnabled, currentUser, contacts } = useChat();
  const [gifts, setGifts] = useState<SentGift[]>([]);
  const [loading, setLoading] = useState(true);

  // Реальное время: отправленный подарок появляется моментально в истории.
  // Не используем orderBy — чтобы не требовался composite-индекс
  // (from_user_id + sent_at DESC), сортируем на клиенте.
  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'gifts_sent'),
      where('from_user_id', '==', currentUser.id),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: SentGift[] = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as SentGift,
        );
        items.sort((a, b) => {
          const aTime = a.sent_at?.toMillis?.() || 0;
          const bTime = b.sent_at?.toMillis?.() || 0;
          return bTime - aTime;
        });
        setGifts(items);
        setLoading(false);
      },
      (error) => {
        console.error('Error subscribing to sent gifts:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecipientName = (userId: string) => {
    const contact = contacts[userId];
    return contact?.name || 'Пользователь';
  };

  // Берём name/emoji сначала из сохранённых полей в документе (новый
  // формат после фикса sendGift); для старых записей — фолбэк на
  // захардкоженную мапу, чтобы уже отправленные подарки не превратились
  // в безымянные «Подарок 🎁».
  const getGiftInfo = (gift: SentGift) => {
    if (gift.gift_name || gift.gift_emoji) {
      return {
        name: gift.gift_name || 'Подарок',
        emoji: gift.gift_emoji || '🎁',
      };
    }

    const giftMap: Record<string, { name: string; emoji: string }> = {
      'teddy_bear': { name: 'Плюшевый мишка', emoji: '🧸' },
      'red_heart': { name: 'Красное сердце', emoji: '❤️' },
      'rose': { name: 'Роза', emoji: '🌹' },
      'cake': { name: 'Торт', emoji: '🎂' },
      'star': { name: 'Звезда', emoji: '⭐' },
      'gift_box': { name: 'Подарочная коробка', emoji: '🎁' },
      'diamond': { name: 'Бриллиант', emoji: '💎' },
      'crown': { name: 'Корона', emoji: '👑' },
      'easter_bunny': { name: 'Пасхальный заяц', emoji: '🐰🥚' },
      'cosmonaut': { name: 'Космонавт', emoji: '👨‍🚀🚀' },
      'may_1': { name: '1 Мая', emoji: '🌷' },
    };

    return giftMap[gift.gift_id] || { name: 'Подарок', emoji: '🎁' };
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
      <motion.div
        className={`text-tg-header-text px-4 h-14 flex items-center gap-3 shrink-0 transition-colors ${
          isGlassEnabled ? 'backdrop-blur-xl border-b border-white/20 shadow-xl' : 'shadow-lg'
        }`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'DD' : themeColor }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setView('menu')}
          className="p-2 rounded-full hover:bg-white/15 active:bg-white/25 transition-all duration-200"
        >
          <ArrowLeft size={24} />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Отправленные подарки</h1>
          <p className="text-sm opacity-80">
            {gifts.length > 0 ? `Отправлено: ${gifts.length}` : 'История отправки'}
          </p>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={48} className="animate-spin text-gray-400" />
          </div>
        ) : gifts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <User size={64} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Нет отправленных подарков</h3>
              <p className="text-gray-500 text-sm">
                Отправьте подарок друзьям, и он появится здесь
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {gifts.map((gift, index) => {
                const giftInfo = getGiftInfo(gift);
                
                return (
                  <motion.div
                    key={gift.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      {/* Gift Icon */}
                      <motion.div
                        className="flex-shrink-0"
                        whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        {getGiftAnimatedUrl(gift.gift_id) ? (
                          <Image
                            src={getGiftAnimatedUrl(gift.gift_id)!}
                            alt={giftInfo.name}
                            width={60}
                            height={60}
                            className="object-contain"
                            unoptimized
                          />
                        ) : (
                          <span className="text-[60px]">{giftInfo.emoji}</span>
                        )}
                      </motion.div>

                      {/* Gift Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[16px] font-semibold text-gray-900 mb-1">
                          {giftInfo.name}
                        </h3>
                        <p className="text-[13px] text-gray-600 mb-1">
                          Для: {getRecipientName(gift.to_user_id)}
                        </p>
                        <p className="text-[12px] text-gray-400">
                          {formatDate(gift.sent_at)}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-yellow-600">
                          <Zap size={14} fill="currentColor" />
                          <span className="text-[13px] font-semibold">{gift.cost}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex-shrink-0 text-[12px] text-green-600 bg-green-50 px-3 py-2 rounded-xl font-medium">
                        Отправлено
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}