/**
 * HouseGram Premium - Страница премиум подписки
 */

'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Check } from 'lucide-react';


export default function PremiumView() {
  const { setView, themeColor } = useChat();

  const handleSubscribe = () => {
    // TODO: Открыть страницу оплаты
    alert('Переход на страницу оплаты...');
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex flex-col z-10"
    >


      {/* Header */}
      <div
        className="text-white px-2.5 h-12 flex items-center gap-2.5 shrink-0 relative z-10"
        style={{ backgroundColor: themeColor }}
      >
        <button
          onClick={() => setView('settings')}
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[18px] font-medium">HouseGram Premium</h1>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4 relative z-10">
        {/* Premium Logo */}
        <div className="flex flex-col items-center justify-center py-8 mb-6">
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
            className="mb-4"
          >
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <motion.path
                d="M60 10L69.27 40.73L100 50L69.27 59.27L60 90L50.73 59.27L20 50L50.73 40.73L60 10Z"
                fill="url(#premium-gradient-big)"
                animate={{
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
              <motion.path
                d="M85 20L88.75 31.25L100 35L88.75 38.75L85 50L81.25 38.75L70 35L81.25 31.25L85 20Z"
                fill="url(#premium-gradient-big)"
                fillOpacity="0.6"
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.5,
                }}
              />
              <motion.path
                d="M35 25L37.5 32.5L45 35L37.5 37.5L35 45L32.5 37.5L25 35L32.5 32.5L35 25Z"
                fill="url(#premium-gradient-big)"
                fillOpacity="0.6"
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 1,
                }}
              />
              <defs>
                <linearGradient id="premium-gradient-big" x1="20" y1="10" x2="100" y2="90">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="50%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          <h2 className="text-[28px] font-bold text-gray-900 mb-2">
            HouseGram Premium
          </h2>
          <p className="text-[15px] text-gray-600 text-center max-w-sm">
            Получите доступ к эксклюзивным возможностям и улучшите свой опыт использования HouseGram
          </p>
        </div>

        {/* Pricing Card */}
        <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-2xl p-6 mb-4 text-white shadow-lg">
          <div className="text-center mb-4">
            <div className="text-[48px] font-bold mb-1">₽299</div>
            <div className="text-[15px] opacity-90">в месяц</div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubscribe}
            className="w-full bg-white text-purple-600 font-semibold py-3.5 rounded-xl text-[16px] shadow-lg"
          >
            Оформить подписку
          </motion.button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 rounded-2xl p-4 mb-4">
          <p className="text-[13px] text-gray-600 text-center leading-relaxed">
            Подписка автоматически продлевается каждый месяц. Вы можете отменить её в любое время в настройках.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
