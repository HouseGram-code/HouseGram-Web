'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Zap, TrendingUp, Gift, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function StarsView() {
  const { setView, themeColor } = useChat();
  const [stars, setStars] = useState(100);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    giftsReceived: 0,
    giftsSent: 0,
    starsReceived: 0,
    starsSent: 0
  });

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
        
        // Если поле stars не существует или отрицательное, сбрасываем на 0
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
        
        // Загружаем статистику
        setStats({
          giftsReceived: data.giftsReceived || 0,
          giftsSent: data.giftsSent || 0,
          starsReceived: (data.giftsReceived || 0) * 15, // Примерно, каждый подарок = 15 молний
          starsSent: (data.giftsSent || 0) * 15
        });
      }
    } catch (e) {
      console.error('Failed to load stars:', e);
    } finally {
      setLoading(false);
    }
  };

  const resetBalance = async () => {
    if (!auth.currentUser) return;
    
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        stars: 0
      });
      setStars(0);
      alert('Баланс сброшен на 0 молний!');
    } catch (e) {
      console.error('Failed to reset balance:', e);
      alert('Ошибка при сбросе баланса');
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
          onClick={() => setView('settings')}
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[18px] font-medium">Молнии</h1>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4">
        {/* Balance Card with Stars Animation */}
        <div className="relative bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 rounded-3xl p-6 mb-4 overflow-hidden">
          {/* Animated Stars Background - за контентом */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-white/30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  fontSize: '20px'
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 0.6, 0],
                  rotate: [0, 180, 360],
                  x: [0, (Math.random() - 0.5) * 50],
                  y: [0, (Math.random() - 0.5) * 50],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
              >
                ⭐
              </motion.div>
            ))}
          </div>

          {/* Content - поверх звездочек */}
          <div className="relative z-20">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={24} className="text-white" fill="white" />
              <span className="text-white/90 text-[15px] font-medium">Ваш баланс</span>
            </div>
            <div className="text-white text-[48px] font-bold mb-1 flex items-center gap-2">
              {loading ? '...' : stars}
              <Zap size={32} className="text-white" fill="white" />
            </div>
            <p className="text-white/80 text-[14px]">Отправляйте подарки друзьям</p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <button
            onClick={() => setView('send-gift')}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mb-3"
          >
            <Gift size={20} />
            Отправить подарок
          </button>
          
          <button
            onClick={() => {
              localStorage.setItem('sendGiftToSelf', 'true');
              setView('send-gift');
            }}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mb-3"
          >
            <Gift size={20} />
            Отправить себе подарок
          </button>
          
          <button
            onClick={() => setView('buy-stars')}
            className="w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Zap size={20} fill="white" />
            Пополнить молнии
          </button>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-blue-500" />
            </div>
            <h2 className="text-[17px] font-medium text-gray-900">Статистика</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[15px] text-gray-700">Всего получено</span>
              <span className="text-[17px] font-semibold text-gray-900 flex items-center gap-1">
                {stats.starsReceived} <Zap size={14} className="text-yellow-500" fill="currentColor" />
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[15px] text-gray-700">Всего отправлено</span>
              <span className="text-[17px] font-semibold text-gray-900 flex items-center gap-1">
                {stats.starsSent} <Zap size={14} className="text-yellow-500" fill="currentColor" />
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[15px] text-gray-700">Подарков получено</span>
              <span className="text-[17px] font-semibold text-gray-900">{stats.giftsReceived}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[15px] text-gray-700">Подарков отправлено</span>
              <span className="text-[17px] font-semibold text-gray-900">{stats.giftsSent}</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <Sparkles size={20} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-[15px] font-medium text-gray-900 mb-1">Что такое Молнии?</h3>
              <p className="text-[14px] text-gray-600 leading-relaxed">
                Молнии — это внутренняя валюта HouseGram. Используйте их для отправки подарков друзьям и близким!
              </p>
            </div>
          </div>
        </div>

        {/* Reset Button (для тестирования) */}
        {stars < 0 && (
          <button
            onClick={resetBalance}
            className="w-full bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition-colors"
          >
            Сбросить баланс на 0
          </button>
        )}
      </div>
    </motion.div>
  );
}
