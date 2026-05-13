'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Gift, Star, Loader2, Sparkles, Zap } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { getUserGifts, convertGiftToStars, ReceivedGift } from '@/lib/firebase-gifts';
import { getGiftAnimatedUrl } from '@/lib/gifts';
import Image from 'next/image';

export default function MyGiftsView() {
  const { setView, themeColor, isGlassEnabled, currentUser } = useChat();
  const [gifts, setGifts] = useState<ReceivedGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState<string | null>(null);

  // Реальное время: подписываемся на свою subcollection received_gifts, чтобы
  // только что присланный подарок появлялся моментально, без перехода
  // с другого экрана и обратно (раньше был getDocs разовым вызовом).
  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    const giftsRef = collection(db, 'users', currentUser.id, 'received_gifts');
    const unsubscribe = onSnapshot(
      giftsRef,
      (snapshot) => {
        const items: ReceivedGift[] = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as ReceivedGift,
        );
        items.sort((a, b) => {
          const aTime = a.received_at?.toMillis?.() || 0;
          const bTime = b.received_at?.toMillis?.() || 0;
          return bTime - aTime;
        });
        setGifts(items);
        setLoading(false);
      },
      (error) => {
        console.error('Error subscribing to gifts:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Fallback для кода, который ждёт loadGifts() (при convert снимки
  // обновятся автоматически через onSnapshot выше).
  const loadGifts = async () => {
    if (!currentUser?.id) return;
    try {
      const userGifts = await getUserGifts(currentUser.id);
      setGifts(userGifts);
    } catch (error) {
      console.error('Error loading gifts:', error);
    }
  };

  const handleConvert = async (giftId: string) => {
    if (!currentUser?.id || converting) return;
    
    setConverting(giftId);
    try {
      const result = await convertGiftToStars(currentUser.id, giftId);
      if (result.success) {
        // Обновляем список подарков
        await loadGifts();
      } else {
        alert(result.error || 'Ошибка конвертации');
      }
    } catch (error) {
      console.error('Error converting gift:', error);
      alert('Ошибка при конвертации подарка');
    } finally {
      setConverting(null);
    }
  };

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
          <h1 className="text-lg font-semibold">Мои подарки</h1>
          <p className="text-sm opacity-80">
            {gifts.length > 0 ? `Получено: ${gifts.length}` : 'Полученные подарки'}
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
              <Gift size={64} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Пока нет подарков</h3>
              <p className="text-gray-500 text-sm">
                Когда вам отправят подарок, он появится здесь
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {gifts.map((gift, index) => (
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

                    {/* Gift Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[16px] font-semibold text-gray-900 mb-1">
                        {gift.name}
                      </h3>
                      <p className="text-[13px] text-gray-600 mb-1">
                        От: {gift.from_name}
                      </p>
                      <p className="text-[12px] text-gray-400">
                        {formatDate(gift.received_at)}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-yellow-600">
                        <Zap size={14} fill="currentColor" />
                        <span className="text-[13px] font-semibold">{gift.cost}</span>
                      </div>
                    </div>

                    {/* Convert Button */}
                    {gift.can_convert && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleConvert(gift.id)}
                        disabled={converting === gift.id}
                        className="flex-shrink-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-xl font-medium text-[13px] flex items-center gap-2 disabled:opacity-50 shadow-md"
                      >
                        {converting === gift.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            <Sparkles size={16} />
                            <span>Конвертировать</span>
                          </>
                        )}
                      </motion.button>
                    )}
                    
                    {!gift.can_convert && (
                      <div className="flex-shrink-0 text-[12px] text-gray-400 bg-gray-100 px-3 py-2 rounded-xl">
                        Конвертирован
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}