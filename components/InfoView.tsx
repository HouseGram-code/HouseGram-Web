import { ArrowLeft, Info, Shield, HelpCircle, FileText, Globe, Github, Heart, Sparkles, Code, ExternalLink } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { useState } from 'react';

export default function InfoView() {
  const { setView, themeColor } = useChat();
  const [isHovering, setIsHovering] = useState(false);

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-[#f4f4f5] flex flex-col z-20"
    >
      {/* Header */}
      <div 
        className="text-white px-2.5 h-14 flex items-center gap-4 shrink-0 relative z-30 shadow-sm"
        style={{ backgroundColor: themeColor }}
      >
        <button onClick={() => setView('settings')} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow text-[18px] font-medium">Информация</div>
      </div>

      <div className="flex-grow overflow-y-auto pb-6">
        {/* Logo and Version with Animation */}
        <div className="flex flex-col items-center justify-center py-10 bg-gradient-to-br from-white via-gray-50 to-white border-b border-gray-200 relative overflow-hidden">
          {/* Animated Background Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-20"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, Math.random() * 20 - 10, 0],
                  scale: [1, 1.5, 1],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>

          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-24 h-24 rounded-full flex items-center justify-center text-white mb-4 shadow-2xl relative z-10"
            style={{ 
              background: `linear-gradient(135deg, ${themeColor} 0%, #667eea 100%)`,
            }}
          >
            <Globe size={48} />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-gray-900 relative z-10"
          >
            HouseGram Web
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-500 mt-1 relative z-10"
          >
            Версия 2.0.0-beta
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-3 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-[13px] font-medium shadow-lg relative z-10 flex items-center gap-2"
          >
            <Sparkles size={14} />
            Beta Release
          </motion.div>
        </div>

        {/* About Section with Stagger Animation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 bg-white border-y border-gray-200 px-4 py-5"
        >
          <h2 className="text-[14px] font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Info size={16} />
            О приложении
          </h2>
          <p className="text-[15px] text-gray-700 leading-relaxed mb-4">
            HouseGram Web — это современный, быстрый и безопасный мессенджер, созданный с фокусом на удобство использования и приватность. Общайтесь с друзьями, делитесь моментами и оставайтесь на связи где бы вы ни были.
          </p>
          <div className="space-y-2">
            {[
              'Быстрая и надежная доставка сообщений',
              'Защита данных и конфиденциальность',
              'Кастомизация интерфейса',
              'Стикеры, GIF и медиафайлы'
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-3 text-[14px] text-gray-600"
              >
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: themeColor }}
                />
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Links Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-4 bg-white border-y border-gray-200"
        >
          <button 
            onClick={() => setView('faq')}
            className="w-full px-4 py-3 flex items-center gap-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors group"
          >
            <HelpCircle size={24} className="text-blue-500 group-hover:scale-110 transition-transform" />
            <div className="flex-grow text-left">
              <div className="text-[16px] text-gray-900">Вопросы и ответы</div>
              <div className="text-[13px] text-gray-500">Часто задаваемые вопросы</div>
            </div>
          </button>
          <button 
            onClick={() => setView('privacy')}
            className="w-full px-4 py-3 flex items-center gap-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors group"
          >
            <Shield size={24} className="text-green-500 group-hover:scale-110 transition-transform" />
            <div className="flex-grow text-left">
              <div className="text-[16px] text-gray-900">Политика конфиденциальности</div>
              <div className="text-[13px] text-gray-500">Как мы защищаем ваши данные</div>
            </div>
          </button>
          <button 
            onClick={() => setView('terms')}
            className="w-full px-4 py-3 flex items-center gap-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors group"
          >
            <FileText size={24} className="text-orange-500 group-hover:scale-110 transition-transform" />
            <div className="flex-grow text-left">
              <div className="text-[16px] text-gray-900">Условия использования</div>
              <div className="text-[13px] text-gray-500">Правила и соглашения</div>
            </div>
          </button>
        </motion.div>

        {/* Developer Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-4 bg-white border-y border-gray-200"
        >
          <div className="px-4 py-4">
            <h2 className="text-[14px] font-medium text-gray-500 uppercase tracking-wider mb-4">О разработчиках</h2>
            <p className="text-[15px] text-gray-700 leading-relaxed mb-4">
              HouseGram создан командой энтузиастов, которые верят в открытое и безопасное общение. Мы постоянно работаем над улучшением приложения и добавлением новых функций.
            </p>
            <div className="flex items-center gap-2 text-gray-500 text-[14px]">
              Сделано с <Heart size={16} className="text-red-500 fill-red-500 animate-pulse" /> командой HouseGram
            </div>
          </div>
        </motion.div>

        {/* GitHub Link with Epic Animation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-4 bg-white border-y border-gray-200 relative overflow-hidden"
        >
          <a 
            href="https://github.com/HouseGram-code/HouseGram-Web" 
            target="_blank" 
            rel="noopener noreferrer" 
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="px-4 py-4 flex items-center gap-4 cursor-pointer hover:bg-gradient-to-r hover:from-red-50 hover:to-black/5 transition-all duration-300 relative group"
          >
            {/* Animated Background Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-black/5 to-red-500/10"
              animate={{
                x: isHovering ? ['-100%', '100%'] : '0%',
              }}
              transition={{
                duration: 1.5,
                repeat: isHovering ? Infinity : 0,
                ease: "linear"
              }}
            />

            {/* Icon with Rotation */}
            <motion.div
              animate={{
                rotate: isHovering ? 360 : 0,
                scale: isHovering ? 1.1 : 1,
              }}
              transition={{ duration: 0.6 }}
              className="relative z-10"
            >
              <Github size={28} className="text-gray-800" />
            </motion.div>

            <div className="flex-grow relative z-10">
              <div className="text-[17px] font-semibold text-gray-900 flex items-center gap-2">
                Исходный код
                <motion.div
                  animate={{
                    x: isHovering ? [0, 5, 0] : 0,
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: isHovering ? Infinity : 0,
                  }}
                >
                  <ExternalLink size={16} className="text-blue-500" />
                </motion.div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <motion.span
                  animate={{
                    scale: isHovering ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: isHovering ? Infinity : 0,
                  }}
                  className="px-2 py-0.5 bg-gradient-to-r from-red-500 to-black text-white text-[11px] font-bold rounded-full uppercase tracking-wide"
                >
                  Открыто
                </motion.span>
                <span className="text-[13px] text-gray-500">на GitHub</span>
              </div>
            </div>

            {/* Sparkles Effect */}
            {isHovering && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-yellow-400"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      y: [0, -20],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  >
                    ✨
                  </motion.div>
                ))}
              </>
            )}
          </a>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="p-6 text-center text-gray-400 text-[13px]"
        >
          © 2026 HouseGram. Все права защищены.
        </motion.div>
      </div>
    </motion.div>
  );
}
