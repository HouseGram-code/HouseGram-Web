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
      <div className="flex-1 overflow-y-auto p-4 bg-[#f2f2f7] dark:bg-[#0f0f0f]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                <Loader2 size={40} className="text-gray-300" />
              </motion.div>
              <p className="text-[14px] text-gray-400">Загрузка...</p>
            </div>
          </div>
        ) : gifts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center px-6"
          >
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="text-[72px] mb-4"
            >
              🎁
            </motion.div>
            <h3 className="text-[20px] font-bold text-gray-800 dark:text-white mb-2">Пока нет подарков</h3>
            <p className="text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed max-w-[260px]">
              Попросите друзей отправить вам подарок, и он появится здесь
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {gifts.map((gift, index) => {
                const isSpace = gift.gift_id === 'cosmonaut';
                const isEaster = gift.gift_id === 'easter_bunny';
                const isMay = gift.gift_id === 'may_1';
                const gradientClass = isSpace
                  ? 'from-indigo-900 via-purple-900 to-black'
                  : isEaster
                  ? 'from-pink-400 via-purple-400 to-blue-400'
                  : isMay
                  ? 'from-red-500 via-rose-500 to-orange-400'
                  : null;
                
                return (
                  <motion.div
                    key={gift.id}
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: Math.min(index * 0.04, 0.3) }}
                    className={`rounded-2xl overflow-hidden shadow-sm ${
                      gradientClass ? `bg-gradient-to-br ${gradientClass} text-white` : 'bg-white dark:bg-[#1c1c1d]'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Gift Icon */}
                        <motion.div
                          className="flex-shrink-0"
                          animate={gradientClass ? { y: [0, -4, 0], rotate: [0, -5, 5, 0] } : {}}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          {getGiftAnimatedUrl(gift.gift_id) ? (
                            <Image src={getGiftAnimatedUrl(gift.gift_id)!} alt={gift.name} width={72} height={72} className="object-contain" unoptimized />
                          ) : (
                            <span className="text-[72px] leading-none">{gift.emoji}</span>
                          )}
                        </motion.div>

                        {/* Gift Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-[17px] font-bold mb-0.5 ${gradientClass ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            {gift.name}
                          </h3>
                          <p className={`text-[13px] mb-1 ${gradientClass ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                            От {gift.from_name}
                          </p>
                          <p className={`text-[11px] mb-2 ${gradientClass ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'}`}>
                            {formatDate(gift.received_at)}
                          </p>
                          {/* Greeting */}
                          {(gift as any).greeting && (
                            <p className={`text-[13px] italic mb-2 leading-relaxed ${
                              gradientClass ? 'text-white/85' : 'text-gray-600 dark:text-gray-300'
                            }`}>
                              «{(gift as any).greeting}»
                            </p>
                          )}
                          <div className={`flex items-center gap-1 ${gradientClass ? 'text-yellow-200' : 'text-yellow-600'}`}>
                            <Zap size={13} fill="currentColor" />
                            <span className="text-[13px] font-bold">{gift.cost}</span>
                          </div>
                        </div>
                      </div>

                      {/* Convert Button */}
                      {gift.can_convert && (
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleConvert(gift.id)}
                          disabled={converting === gift.id}
                          className={`w-full mt-3 py-2.5 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 transition-all ${
                            gradientClass
                              ? 'bg-white/20 hover:bg-white/30 text-white'
                              : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-orange-200/50 dark:shadow-none'
                          }`}
                        >
                          {converting === gift.id ? (
                            <><Loader2 size={16} className="animate-spin" /> Обработка...</>
                          ) : (
                            <><Sparkles size={16} /> Конвертировать в ⚡</>
                          )}
                        </motion.button>
                      )}
                      {!gift.can_convert && (
                        <div className={`mt-3 text-center text-[12px] font-medium ${
                          gradientClass ? 'text-white/50' : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          ✓ Конвертирован
                        </div>
                      )}
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