'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';

const REPLENISHMENT_ENABLED = false;

export default function StarsView() {
  const { setView } = useChat();
  const [stars, setStars] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    giftsReceived: 0,
    giftsSent: 0,
    starsReceived: 0,
    starsSent: 0
  });
  const [showPromo, setShowPromo] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [promocode, setPromocode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadStarsBalance();
  }, []);

  const loadStarsBalance = async () => {
    if (!auth.currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        let currentStars = data.stars;
        if (currentStars === undefined || currentStars === null || currentStars < 0) {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            stars: 0,
            giftsSent: data.giftsSent || 0,
            giftsReceived: data.giftsReceived || 0
          });
          setStars(0);
        } else {
          setStars(currentStars);
        }
        setStats({
          giftsReceived: data.giftsReceived || 0,
          giftsSent: data.giftsSent || 0,
          starsReceived: data.starsReceived || 0,
          starsSent: data.starsSent || 0
        });
      }
    } catch (e) {
      console.error('Failed to load stars:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPromo = async () => {
    const code = promocode.trim().toUpperCase();
    if (!code || !auth.currentUser) return;
    setIsApplyingPromo(true);
    setPromoMessage({ type: '', text: '' });
    try {
      await runTransaction(db, async (transaction) => {
        if (!auth.currentUser) return;
        const promoRef = doc(db, 'promocodes', code);
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const promoDoc = await transaction.get(promoRef);
        if (!promoDoc.exists()) throw new Error('Промокод не найден');
        const promoData = promoDoc.data();
        if (!promoData.active) throw new Error('Этот промокод отключён');
        if (promoData.usesCount >= promoData.maxUses) throw new Error('Количество активаций исчерпано');
        if (promoData.usedBy?.includes(auth.currentUser.uid)) throw new Error('Вы уже использовали этот промокод');
        const userDoc = await transaction.get(userRef);
        const currentStars = userDoc.exists() ? (userDoc.data().stars || 0) : 0;
        const currentStarsReceived = userDoc.exists() ? (userDoc.data().starsReceived || 0) : 0;
        transaction.update(promoRef, {
          usesCount: (promoData.usesCount || 0) + 1,
          usedBy: [...(promoData.usedBy || []), auth.currentUser.uid]
        });
        transaction.update(userRef, {
          stars: currentStars + promoData.rewardStars,
          starsReceived: currentStarsReceived + promoData.rewardStars
        });
        setPromoMessage({ type: 'success', text: `Вы получили ${promoData.rewardStars} молний!` });
        setStars(currentStars + promoData.rewardStars);
        setPromocode('');
      });
    } catch (e: any) {
      console.error('Failed to apply promo:', e);
      setPromoMessage({ type: 'error', text: e.message || 'Ошибка активации' });
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const menuItems = [
    {
      emoji: '📊',
      label: 'Открыть статистику',
      action: () => setShowStats(true)
    },
    {
      emoji: '🎁',
      label: 'Подарить молнии друзьям',
      action: () => setView('send-gift')
    },
    {
      emoji: '🎟️',
      label: 'Ввести промокод',
      action: () => { setShowPromo(true); setPromoMessage({ type: '', text: '' }); }
    },
  ];

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 flex flex-col z-50 overflow-hidden"
      style={{ backgroundColor: '#1C1C1E' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0">
        <motion.button
          onClick={() => setView('settings')}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeft size={18} className="text-white" />
        </motion.button>
        <motion.button
          onClick={() => setView('settings')}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          whileTap={{ scale: 0.9 }}
        >
          <X size={16} className="text-white" />
        </motion.button>
      </div>

      {/* Scrollable content */}
      <div className="flex-grow overflow-y-auto flex flex-col items-center px-6 pb-10"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Большая иконка молнии с сиянием */}
        <motion.div
          className="mt-4 mb-5 relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.05 }}
        >
          {/* Пульсирующие кольца */}
          {[1.7, 1.4, 1.15].map((scale, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                inset: 0,
                transform: `scale(${scale})`,
                background: 'radial-gradient(circle, rgba(251,191,36,0.18) 0%, transparent 70%)',
              }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.35, ease: 'easeInOut' }}
            />
          ))}
          <div
            className="relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(145deg, #fde047, #f59e0b, #ea580c)',
              boxShadow: '0 0 40px rgba(245,158,11,0.5), 0 0 80px rgba(245,158,11,0.2)'
            }}
          >
            <motion.span
              className="text-5xl"
              animate={{ rotate: [-6, 6, -6] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              ⚡
            </motion.span>
          </div>
        </motion.div>

        {/* Заголовок */}
        <motion.h1
          className="text-white text-[22px] font-bold mb-2 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          Молнии HouseGram
        </motion.h1>

        <motion.p
          className="text-center mb-7 leading-relaxed max-w-[280px]"
          style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22 }}
        >
          Молнии нужны для оплаты контента и отправки подарков в HouseGram
        </motion.p>

        {/* Кнопка Пополнить баланс */}
        {REPLENISHMENT_ENABLED ? (
          <motion.button
            onClick={() => setView('buy-stars')}
            className="w-full max-w-sm text-white py-4 rounded-2xl font-semibold text-[17px] flex items-center justify-center gap-2.5 mb-5 shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #b91c1c, #dc2626)',
              boxShadow: '0 8px 30px rgba(185,28,28,0.4)'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
          >
            <span className="text-[22px] font-light leading-none mt-[-2px]">+</span>
            Пополнить баланс
          </motion.button>
        ) : (
          <motion.div
            className="w-full max-w-sm py-4 rounded-2xl mb-5 flex flex-col items-center justify-center gap-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
          >
            <span className="text-white font-semibold text-[16px]">Пополнение временно недоступно</span>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>Скоро откроем — следите за обновлениями</span>
          </motion.div>
        )}

        {/* Баланс */}
        <motion.div
          className="flex items-center gap-1.5 mb-7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.33 }}
        >
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>Ваш баланс:</span>
          <span className="text-yellow-400 text-[16px]">⚡</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={stars}
              className="text-white font-bold text-[16px]"
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {loading ? '...' : stars}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* Разделитель */}
        <div className="w-full max-w-sm mb-1" style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />

        {/* Пункты меню */}
        {menuItems.map((item, i) => (
          <motion.button
            key={i}
            onClick={item.action}
            className="w-full max-w-sm flex items-center gap-4 py-4 text-left"
            style={{ borderBottom: i < menuItems.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
            whileTap={{ opacity: 0.6 }}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.38 + i * 0.06 }}
          >
            <span className="text-[26px] w-9 text-center">{item.emoji}</span>
            <span className="text-white text-[16px] flex-grow">{item.label}</span>
            <span className="text-[22px]" style={{ color: 'rgba(255,255,255,0.25)' }}>›</span>
          </motion.button>
        ))}
      </div>

      {/* Модальное окно статистики */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-end z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
            onClick={() => setShowStats(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="w-full rounded-t-3xl p-6"
              style={{ backgroundColor: '#2C2C2E' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-[20px] font-bold">Статистика молний</h3>
                <button
                  onClick={() => setShowStats(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
                >
                  <X size={15} className="text-white" />
                </button>
              </div>
              <div className="space-y-1">
                {[
                  { label: 'Молний получено', value: `${stats.starsReceived} ⚡` },
                  { label: 'Молний потрачено', value: `${stats.starsSent} ⚡` },
                  { label: 'Подарков получено', value: `${stats.giftsReceived} 🎁` },
                  { label: 'Подарков отправлено', value: `${stats.giftsSent} 🎁` },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3.5"
                    style={{ borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>{s.label}</span>
                    <span className="text-white font-semibold text-[16px]">{s.value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowStats(false)}
                className="w-full mt-5 text-white py-3.5 rounded-2xl font-semibold text-[16px]"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
              >
                Закрыть
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно промокода */}
      <AnimatePresence>
        {showPromo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-end z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
            onClick={() => setShowPromo(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="w-full rounded-t-3xl p-6"
              style={{ backgroundColor: '#2C2C2E' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white text-[20px] font-bold">Промокод</h3>
                <button
                  onClick={() => setShowPromo(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
                >
                  <X size={15} className="text-white" />
                </button>
              </div>
              <input
                type="text"
                value={promocode}
                onChange={e => { setPromocode(e.target.value); setPromoMessage({ type: '', text: '' }); }}
                placeholder="Например: FREE50"
                className="w-full rounded-xl px-4 py-3.5 outline-none uppercase font-semibold text-[16px] tracking-wider mb-3"
                style={{ backgroundColor: '#3A3A3C', color: 'white', caretColor: '#fbbf24' }}
                autoFocus
              />
              {promoMessage.text && (
                <p className={`text-[13px] mb-3 font-medium ${promoMessage.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                  {promoMessage.text}
                </p>
              )}
              <button
                onClick={handleApplyPromo}
                disabled={isApplyingPromo || !promocode.trim()}
                className="w-full bg-blue-500 text-white py-3.5 rounded-2xl font-semibold text-[16px] disabled:opacity-40 active:scale-[0.98] transition-transform"
              >
                {isApplyingPromo ? 'Применяем...' : 'Применить'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
