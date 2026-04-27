'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Zap, TrendingUp, Gift, Sparkles, Star } from 'lucide-react';
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
      className="absolute inset-0 bg-tg-bg-light flex flex-col z-10 overflow-hidden"
    >
      {/* Header */}
      <div
        className="text-tg-header-text px-2.5 h-12 flex items-center gap-2.5 shrink-0 relative z-20"
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
      <div className="flex-grow overflow-y-auto p-4 pb-safe"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {/* MEGA SALE BANNER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative bg-gradient-to-br from-red-600 via-pink-600 to-purple-700 rounded-3xl p-6 mb-4 overflow-hidden shadow-2xl cursor-pointer"
          onClick={() => setView('buy-stars')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Animated Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Pulsing Circles */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`circle-${i}`}
                className="absolute rounded-full bg-white/10"
                style={{
                  width: 200 + i * 100,
                  height: 200 + i * 100,
                  left: '50%',
                  top: '50%',
                  x: '-50%',
                  y: '-50%',
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.1, 0.3],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5
                }}
              />
            ))}
            
            {/* Flying Stars */}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute text-yellow-300"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  fontSize: `${16 + Math.random() * 16}px`
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 20, 0],
                  rotate: [0, 360],
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }}
              >
                ⭐
              </motion.div>
            ))}
            
            {/* Lightning Bolts */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`bolt-${i}`}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -50],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.5, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: "easeOut"
                }}
              >
                <Zap size={20 + Math.random() * 10} className="text-yellow-300" fill="currentColor" />
              </motion.div>
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Sale Badge */}
            <motion.div
              className="inline-flex items-center gap-2 bg-yellow-400 text-red-700 px-4 py-1.5 rounded-full font-bold text-[13px] mb-3 shadow-lg"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [-2, 2, -2],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                🔥
              </motion.div>
              МЕГА СКИДКА
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                🔥
              </motion.div>
            </motion.div>

            {/* Main Text */}
            <motion.h2
              className="text-white text-[32px] font-black mb-2 leading-tight"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              -50% НА ВСЕ
              <br />
              <motion.span
                className="text-yellow-300"
                animate={{
                  textShadow: [
                    "0 0 10px rgba(253, 224, 71, 0.5)",
                    "0 0 20px rgba(253, 224, 71, 0.8)",
                    "0 0 10px rgba(253, 224, 71, 0.5)",
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                МОЛНИИ!
              </motion.span>
            </motion.h2>

            <motion.p
              className="text-white/90 text-[15px] mb-4 font-medium"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Только сегодня! Успей купить по супер цене! ⚡
            </motion.p>

            {/* CTA Button */}
            <motion.div
              className="inline-flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-full font-bold text-[15px] shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  "0 10px 30px rgba(255, 255, 255, 0.3)",
                  "0 10px 40px rgba(255, 255, 255, 0.5)",
                  "0 10px 30px rgba(255, 255, 255, 0.3)",
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
              >
                🎁
              </motion.div>
              КУПИТЬ СЕЙЧАС
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                →
              </motion.div>
            </motion.div>

            {/* Timer */}
            <motion.div
              className="mt-4 flex items-center gap-2 text-yellow-300 text-[13px] font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ⏰
              </motion.div>
              Предложение ограничено!
            </motion.div>
          </div>

          {/* Corner Decoration */}
          <motion.div
            className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>

        {/* Balance Card with Enhanced Stars Animation */}
        <motion.div 
          className="relative bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 rounded-3xl p-6 mb-4 overflow-hidden shadow-2xl"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {/* Animated Stars Background - Optimized for Mobile */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {[...Array(10)].map((_, i) => {
              const randomX = Math.random() * 100;
              const randomY = Math.random() * 100;
              const randomDelay = Math.random() * 3;
              const randomDuration = 2 + Math.random() * 3;
              
              return (
                <motion.div
                  key={i}
                  className="absolute will-change-transform"
                  style={{
                    left: `${randomX}%`,
                    top: `${randomY}%`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1.2, 0.8, 0],
                    opacity: [0, 1, 0.8, 0],
                    rotate: [0, 180, 360],
                    x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 50, 0],
                    y: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 50, 0],
                  }}
                  transition={{
                    duration: randomDuration,
                    repeat: Infinity,
                    delay: randomDelay,
                    ease: "easeInOut"
                  }}
                >
                  <Star 
                    size={16 + Math.random() * 12} 
                    className="text-white/40" 
                    fill="white"
                  />
                </motion.div>
              );
            })}
            
            {/* Floating Sparkles - Reduced for Mobile */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute text-white/50 will-change-transform"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  fontSize: '24px'
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
              >
                ✨
              </motion.div>
            ))}
          </div>

          {/* Content - поверх звездочек */}
          <div className="relative z-20">
            <motion.div 
              className="flex items-center gap-2 mb-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                <Zap size={24} className="text-white" fill="white" />
              </motion.div>
              <span className="text-white/90 text-[15px] font-medium">Ваш баланс</span>
            </motion.div>
            
            <motion.div 
              className="text-white text-[48px] font-bold mb-1 flex items-center gap-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={stars}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {loading ? '...' : stars}
                </motion.span>
              </AnimatePresence>
              <motion.div
                animate={{ 
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              >
                <Zap size={32} className="text-white" fill="white" />
              </motion.div>
            </motion.div>
            
            <motion.p 
              className="text-white/80 text-[14px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Отправляйте подарки друзьям
            </motion.p>
          </div>
        </motion.div>

        {/* Actions with Animations */}
        <motion.div 
          className="bg-white rounded-2xl p-4 mb-4 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            onClick={() => setView('send-gift')}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 mb-3 relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              <Gift size={20} />
            </motion.div>
            Отправить подарок
            
            {/* Shimmer Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut"
              }}
            />
          </motion.button>
          
          <motion.button
            onClick={() => {
              localStorage.setItem('sendGiftToSelf', 'true');
              setView('send-gift');
            }}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 mb-3 relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 360],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Gift size={20} />
            </motion.div>
            Отправить себе подарок
            
            {/* Shimmer Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut",
                delay: 0.5
              }}
            />
          </motion.button>
          
          <motion.button
            onClick={() => setView('buy-stars')}
            className="w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, -15, 15, -15, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              <Zap size={20} fill="white" />
            </motion.div>
            Пополнить молнии
            
            {/* Shimmer Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut",
                delay: 1
              }}
            />
          </motion.button>
        </motion.div>

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
