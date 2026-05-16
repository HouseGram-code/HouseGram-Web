'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';

const REPLENISHMENT_ENABLED = false;

// Static particle data — fixed values avoid SSR hydration mismatch
const PARTICLES = [
  { id: 0,  left: '4%',  size: 11, dur: 11, delay: 0,   type: 'bolt' },
  { id: 1,  left: '11%', size: 7,  dur: 8,  delay: 2.3, type: 'spark' },
  { id: 2,  left: '19%', size: 13, dur: 13, delay: 0.7, type: 'bolt' },
  { id: 3,  left: '26%', size: 5,  dur: 7,  delay: 4.1, type: 'dot' },
  { id: 4,  left: '34%', size: 9,  dur: 10, delay: 1.5, type: 'spark' },
  { id: 5,  left: '41%', size: 14, dur: 15, delay: 3.2, type: 'bolt' },
  { id: 6,  left: '49%', size: 6,  dur: 7,  delay: 0.9, type: 'dot' },
  { id: 7,  left: '57%', size: 10, dur: 12, delay: 5.0, type: 'bolt' },
  { id: 8,  left: '64%', size: 6,  dur: 9,  delay: 2.7, type: 'spark' },
  { id: 9,  left: '71%', size: 12, dur: 11, delay: 1.1, type: 'bolt' },
  { id: 10, left: '78%', size: 7,  dur: 8,  delay: 3.8, type: 'dot' },
  { id: 11, left: '85%', size: 10, dur: 13, delay: 0.4, type: 'spark' },
  { id: 12, left: '92%', size: 8,  dur: 10, delay: 6.2, type: 'bolt' },
  { id: 13, left: '14%', size: 5,  dur: 7,  delay: 5.5, type: 'dot' },
  { id: 14, left: '38%', size: 9,  dur: 9,  delay: 7.1, type: 'bolt' },
  { id: 15, left: '61%', size: 6,  dur: 8,  delay: 4.6, type: 'spark' },
  { id: 16, left: '74%', size: 11, dur: 12, delay: 1.9, type: 'bolt' },
  { id: 17, left: '87%', size: 7,  dur: 10, delay: 3.0, type: 'dot' },
  { id: 18, left: '30%', size: 5,  dur: 7,  delay: 8.0, type: 'spark' },
  { id: 19, left: '53%', size: 12, dur: 14, delay: 2.0, type: 'bolt' },
];

function ParticleContent({ type, size }: { type: string; size: number }) {
  if (type === 'bolt') {
    return (
      <span style={{ fontSize: size, filter: 'drop-shadow(0 0 5px rgba(251,191,36,0.9))' }}>⚡</span>
    );
  }
  if (type === 'spark') {
    return (
      <span style={{ fontSize: size - 1, color: '#fde68a', filter: 'drop-shadow(0 0 4px rgba(251,191,36,1))' }}>✦</span>
    );
  }
  return (
    <div style={{
      width: size / 2,
      height: size / 2,
      borderRadius: '50%',
      backgroundColor: 'rgba(251,191,36,0.55)',
      boxShadow: '0 0 6px rgba(251,191,36,0.7)',
    }} />
  );
}

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
    { emoji: '📊', label: 'Открыть статистику',      action: () => setShowStats(true) },
    { emoji: '🎁', label: 'Подарить молнии друзьям', action: () => setView('send-gift') },
    { emoji: '🎟️', label: 'Ввести промокод',         action: () => { setShowPromo(true); setPromoMessage({ type: '', text: '' }); } },
  ];

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 flex flex-col z-50 overflow-hidden"
      style={{ backgroundColor: '#0A0A0E' }}
    >

      {/* ── Background: ambient glow blobs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Amber core glow — sits behind the icon */}
        <motion.div
          style={{
            position: 'absolute', top: '2%', left: '50%',
            transform: 'translateX(-50%)',
            width: 420, height: 420, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.22) 0%, rgba(251,191,36,0.07) 45%, transparent 70%)',
            filter: 'blur(32px)',
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Deep purple bottom accent */}
        <div style={{
          position: 'absolute', bottom: '-8%', left: '50%',
          transform: 'translateX(-50%)',
          width: 320, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(109,40,217,0.14) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        {/* Subtle warm left rim */}
        <div style={{
          position: 'absolute', top: '30%', left: '-10%',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,191,36,0.07) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }} />
        {/* Subtle warm right rim */}
        <div style={{
          position: 'absolute', top: '25%', right: '-10%',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,191,36,0.07) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }} />
      </div>

      {/* ── Floating particles ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {PARTICLES.map(p => (
          <motion.div
            key={p.id}
            className="absolute flex items-center justify-center"
            style={{ left: p.left, bottom: -24 }}
            animate={{
              y: [0, -880],
              opacity: [0, 0.85, 0.85, 0],
              x: [0, p.id % 2 === 0 ? 18 : -18, 0],
            }}
            transition={{
              duration: p.dur,
              delay: p.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <ParticleContent type={p.type} size={p.size} />
          </motion.div>
        ))}
      </div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0 relative z-10">
        <motion.button
          onClick={() => setView('settings')}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.88 }}
        >
          <ArrowLeft size={18} className="text-white" />
        </motion.button>
        <motion.button
          onClick={() => setView('settings')}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.88 }}
        >
          <X size={16} className="text-white" />
        </motion.button>
      </div>

      {/* ── Scrollable content ── */}
      <div
        className="flex-grow overflow-y-auto flex flex-col items-center px-6 pb-10 relative z-10"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Main lightning icon */}
        <motion.div
          className="mt-6 mb-5 relative"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.05 }}
        >
          {/* 4 pulsing glow rings */}
          {[2.4, 1.9, 1.5, 1.18].map((s, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                inset: 0,
                transform: `scale(${s})`,
                background: `radial-gradient(circle, rgba(251,191,36,${0.03 + i * 0.025}) 0%, transparent 68%)`,
              }}
              animate={{ opacity: [0.2, 0.9, 0.2], scale: [s, s * 1.06, s] }}
              transition={{ duration: 2.8 + i * 0.5, repeat: Infinity, delay: i * 0.38, ease: 'easeInOut' }}
            />
          ))}
          {/* Icon circle */}
          <div
            className="relative w-32 h-32 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #fef08a, #fbbf24, #f59e0b, #d97706)',
              boxShadow:
                '0 0 0 2px rgba(251,191,36,0.3), ' +
                '0 0 40px rgba(245,158,11,0.75), ' +
                '0 0 90px rgba(245,158,11,0.35), ' +
                '0 0 160px rgba(245,158,11,0.12)',
            }}
          >
            <motion.span
              className="text-6xl select-none"
              animate={{ rotate: [-6, 6, -6], scale: [1, 1.06, 1] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              ⚡
            </motion.span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-white text-[24px] font-bold mb-2 text-center tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          Молнии HouseGram
        </motion.h1>

        <motion.p
          className="text-center mb-7 leading-relaxed max-w-[270px]"
          style={{ color: 'rgba(255,255,255,0.48)', fontSize: 14 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          Молнии нужны для оплаты контента и отправки подарков в HouseGram
        </motion.p>

        {/* Balance pill */}
        <motion.div
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl mb-5"
          style={{
            backgroundColor: 'rgba(251,191,36,0.1)',
            border: '1px solid rgba(251,191,36,0.22)',
          }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 240 }}
        >
          <motion.span
            className="text-[20px]"
            animate={{ rotate: [-8, 8, -8] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >⚡</motion.span>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>Ваш баланс:</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={stars}
              className="font-bold text-[17px]"
              style={{ color: '#fde68a' }}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320 }}
            >
              {loading ? '...' : stars}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* Replenishment button / notice */}
        {REPLENISHMENT_ENABLED ? (
          <motion.button
            onClick={() => setView('buy-stars')}
            className="w-full max-w-sm text-white py-4 rounded-2xl font-semibold text-[17px] flex items-center justify-center gap-2.5 mb-5"
            style={{
              background: 'linear-gradient(135deg, #b45309, #d97706, #fbbf24)',
              boxShadow: '0 6px 28px rgba(217,119,6,0.5)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <span className="text-[22px] font-light leading-none mt-[-2px]">+</span>
            Пополнить баланс
          </motion.button>
        ) : (
          <motion.div
            className="w-full max-w-sm py-3.5 rounded-2xl mb-5 flex flex-col items-center justify-center gap-0.5"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <span className="text-white font-semibold text-[15px]">Пополнение временно недоступно</span>
            <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12 }}>Скоро откроем — следите за обновлениями</span>
          </motion.div>
        )}

        {/* Divider */}
        <div className="w-full max-w-sm mb-1" style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />

        {/* Menu items */}
        {menuItems.map((item, i) => (
          <motion.button
            key={i}
            onClick={item.action}
            className="w-full max-w-sm flex items-center gap-4 py-4 text-left"
            style={{ borderBottom: i < menuItems.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}
            whileTap={{ opacity: 0.55, x: 3 }}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.42 + i * 0.07 }}
          >
            <span className="text-[26px] w-9 text-center">{item.emoji}</span>
            <span className="text-white text-[16px] flex-grow">{item.label}</span>
            <span className="text-[22px]" style={{ color: 'rgba(255,255,255,0.22)' }}>›</span>
          </motion.button>
        ))}
      </div>

      {/* ── Stats modal ── */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-end z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.82)' }}
            onClick={() => setShowStats(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="w-full rounded-t-3xl p-6"
              style={{ backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white text-[20px] font-bold">⚡ Статистика</h3>
                <button
                  onClick={() => setShowStats(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                {[
                  { label: 'Молний получено',     value: `+${stats.starsReceived} ⚡`, color: '#4ade80' },
                  { label: 'Молний потрачено',     value: `${stats.starsSent} ⚡`,      color: '#f87171' },
                  { label: 'Подарков получено',    value: `${stats.giftsReceived} 🎁`,  color: '#a78bfa' },
                  { label: 'Подарков отправлено',  value: `${stats.giftsSent} 🎁`,      color: '#fbbf24' },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3.5"
                    style={{ borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none', backgroundColor: 'rgba(255,255,255,0.03)' }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.52)', fontSize: 14 }}>{s.label}</span>
                    <span className="font-semibold text-[15px]" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowStats(false)}
                className="w-full mt-4 text-white py-3.5 rounded-2xl font-semibold text-[16px]"
                style={{ backgroundColor: 'rgba(255,255,255,0.09)' }}
              >
                Закрыть
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Promo modal ── */}
      <AnimatePresence>
        {showPromo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-end z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.82)' }}
            onClick={() => setShowPromo(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="w-full rounded-t-3xl p-6"
              style={{ backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white text-[20px] font-bold">🎟️ Промокод</h3>
                <button
                  onClick={() => setShowPromo(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
              <input
                type="text"
                value={promocode}
                onChange={e => { setPromocode(e.target.value); setPromoMessage({ type: '', text: '' }); }}
                placeholder="Например: HOUSEGRAM50"
                className="w-full rounded-xl px-4 py-3.5 outline-none uppercase font-semibold text-[16px] tracking-widest mb-3"
                style={{
                  backgroundColor: '#1E1E24',
                  color: 'white',
                  caretColor: '#fbbf24',
                  border: '1px solid rgba(255,255,255,0.12)',
                  letterSpacing: '0.12em',
                }}
                autoFocus
              />
              <AnimatePresence>
                {promoMessage.text && (
                  <motion.p
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`text-[13px] mb-3 font-medium ${promoMessage.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}
                  >
                    {promoMessage.type === 'success' ? '✅ ' : '❌ '}{promoMessage.text}
                  </motion.p>
                )}
              </AnimatePresence>
              <motion.button
                onClick={handleApplyPromo}
                disabled={isApplyingPromo || !promocode.trim()}
                className="w-full text-white py-3.5 rounded-2xl font-semibold text-[16px] disabled:opacity-35 transition-all"
                style={{
                  background: (isApplyingPromo || !promocode.trim())
                    ? 'rgba(255,255,255,0.08)'
                    : 'linear-gradient(135deg, #1d4ed8, #3b82f6, #60a5fa)',
                  boxShadow: (isApplyingPromo || !promocode.trim()) ? 'none' : '0 4px 22px rgba(59,130,246,0.45)',
                }}
                whileTap={(!isApplyingPromo && promocode.trim()) ? { scale: 0.97 } : {}}
              >
                {isApplyingPromo ? '⏳ Применяем...' : '✓  Применить'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
