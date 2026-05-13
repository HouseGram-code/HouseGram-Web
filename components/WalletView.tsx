'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Wallet, TrendingUp, Zap, Crown, Gamepad2, Coins, Star, Gift } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function WalletView() {
  const { setView, themeColor } = useChat();
  const [balance, setBalance] = useState(0);
  const [stars, setStars] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    if (!auth.currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setBalance(data.walletBalance || 0);
        setStars(data.stars || 0);
      }
    } catch (e) {
      console.error('Failed to load wallet:', e);
    } finally {
      setLoading(false);
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
          onClick={() => setView('menu')}
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[18px] font-medium">Кошелёк</h1>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4">
        {/* Crypto Balance Card */}
        <motion.div 
          className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-3xl p-6 mb-4 overflow-hidden shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 0.3, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              >
                <Coins size={20} className="text-white/30" />
              </motion.div>
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <Wallet size={24} className="text-white" />
              </motion.div>
              <span className="text-white/90 text-[15px] font-medium">Баланс HouseCoin</span>
            </div>
            
            <motion.div 
              className="text-white text-[48px] font-bold mb-1 flex items-center gap-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              {loading ? '...' : balance.toFixed(2)}
              <motion.span 
                className="text-[24px] text-white/80"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                HC
              </motion.span>
            </motion.div>
            
            <p className="text-white/80 text-[14px]">≈ ${(balance * 0.5).toFixed(2)} USD</p>
          </div>
        </motion.div>

        {/* Stars Balance */}
        <motion.div 
          className="bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 rounded-2xl p-4 mb-4 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => setView('stars')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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
                <Zap size={32} className="text-white" fill="white" />
              </motion.div>
              <div>
                <div className="text-white/90 text-[13px] font-medium">Молнии</div>
                <div className="text-white text-[24px] font-bold">{stars}</div>
              </div>
            </div>
            <ArrowLeft size={20} className="text-white rotate-180" />
          </div>
        </motion.div>

        {/* Coming Soon Section */}
        <motion.div 
          className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6 mb-4 cursor-pointer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => setView('mini-games')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-start gap-4 mb-4">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <Gamepad2 size={24} className="text-white" />
            </motion.div>
            <div className="flex-grow">
              <h3 className="text-[17px] font-bold text-gray-900 mb-1">Мини-игры уже доступны!</h3>
              <p className="text-[14px] text-gray-600 leading-relaxed">
                Играйте в увлекательные игры и зарабатывайте HouseCoin
              </p>
            </div>
            <ArrowLeft size={20} className="text-indigo-500 rotate-180 shrink-0 mt-1" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Coins size={20} className="text-yellow-600" />
              </div>
              <div className="flex-grow">
                <div className="text-[14px] font-medium text-gray-900">Зарабатывайте монеты</div>
                <div className="text-[12px] text-gray-500">Играйте и получайте награды</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Zap size={20} className="text-orange-600" fill="currentColor" />
              </div>
              <div className="flex-grow">
                <div className="text-[14px] font-medium text-gray-900">Покупайте молнии</div>
                <div className="text-[12px] text-gray-500">Обменивайте монеты на молнии</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Crown size={20} className="text-purple-600" />
              </div>
              <div className="flex-grow">
                <div className="text-[14px] font-medium text-gray-900">Получайте премиум</div>
                <div className="text-[12px] text-gray-500">Оплачивайте подписку монетами</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-3">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                <Gift size={20} className="text-pink-600" />
              </div>
              <div className="flex-grow">
                <div className="text-[14px] font-medium text-gray-900">Дарите подарки</div>
                <div className="text-[12px] text-gray-500">Отправляйте подарки друзьям</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div 
          className="bg-blue-50 border border-blue-100 rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-start gap-3">
            <TrendingUp size={20} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-[15px] font-medium text-gray-900 mb-1">Что такое HouseCoin?</h3>
              <p className="text-[14px] text-gray-600 leading-relaxed">
                HouseCoin (HC) — это внутренняя криптовалюта HouseGram. Зарабатывайте монеты в играх и используйте их для покупки молний, премиум подписки и отправки подарков!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
