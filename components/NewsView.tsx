'use client';

import { useChat } from '@/context/ChatContext';
import { ArrowLeft, Newspaper, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function NewsView() {
  const { setView, themeColor, isGlassEnabled } = useChat();

  // Здесь можно добавить реальные новости из базы данных
  const news: Array<{
    id: number;
    title: string;
    description: string;
    date: string;
    icon: string;
  }> = [
    // Пример структуры новости:
    // {
    //   id: 1,
    //   title: 'Обновление 2.0',
    //   description: 'Добавлены новые функции...',
    //   date: '21 апреля 2026',
    //   icon: '🎉'
    // }
  ];

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
      className="absolute inset-0 bg-tg-bg-light flex flex-col"
    >
      {/* Header */}
      <div 
        className={`text-tg-header-text px-3 h-14 flex items-center gap-4 shrink-0 transition-all duration-300 ${isGlassEnabled ? 'backdrop-blur-xl border-b border-white/20 shadow-lg' : 'shadow-md'}`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'DD' : themeColor }}
      >
        <button 
          onClick={() => setView('menu')} 
          className="p-2 rounded-full hover:bg-white/15 active:bg-white/25 transition-all duration-200"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex-grow text-[19px] font-semibold tracking-tight">
          Новости
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4">
        {news.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center h-full text-center px-6"
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-6 shadow-lg"
            >
              <Newspaper size={64} className="text-blue-500" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              Пока пусто
              <Sparkles size={24} className="text-yellow-500" />
            </h2>
            
            <p className="text-gray-600 text-[15px] leading-relaxed mb-4">
              Здесь будут появляться новости и обновления HouseGram
            </p>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 mt-4 border border-blue-100">
              <p className="text-sm text-gray-700">
                💡 Следите за обновлениями! Скоро здесь появятся интересные новости.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {news.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-100"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{item.icon}</div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-[14px] leading-relaxed mb-3">{item.description}</p>
                    <div className="text-xs text-gray-400">{item.date}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
