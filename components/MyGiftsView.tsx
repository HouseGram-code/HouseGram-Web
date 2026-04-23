'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Gift, Star, Loader2 } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

export default function MyGiftsView() {
  const { setView, themeColor, isGlassEnabled } = useChat();
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
          <p className="text-sm opacity-80">Полученные подарки</p>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <Gift size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Функция временно недоступна</h3>
          <p className="text-gray-500 text-sm">
            Подарки будут доступны после настройки базы данных
          </p>
        </div>
      </div>
    </motion.div>
  );
}