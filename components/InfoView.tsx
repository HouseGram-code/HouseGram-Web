import { ArrowLeft, Info, Shield, HelpCircle, FileText, Globe, Github, Heart, Sparkles, Code, ExternalLink } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { useState } from 'react';
import StarBackground from './StarBackground';

export default function InfoView() {
  const { setView, themeColor } = useChat();
  const [isHovering, setIsHovering] = useState(false);

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-[#f4f4f5] flex flex-col z-20"
    >
      {/* Animated Star Background */}
      <StarBackground />
      
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
            Версия 2.0.1-beta
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

        {/* About Section with Enhanced Design */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-xl border border-gray-200 p-6 relative overflow-hidden"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-500/10 to-orange-500/10 rounded-full blur-2xl" />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Info size={20} className="text-white" />
              </div>
              <h2 className="text-[18px] font-bold text-gray-900">О приложении</h2>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-[15px] text-gray-700 leading-relaxed mb-6 pl-1"
            >
              <span className="font-semibold text-gray-900">HouseGram Web</span> — это современный, быстрый и безопасный мессенджер, созданный с фокусом на удобство использования и приватность. Общайтесь с друзьями, делитесь моментами и оставайтесь на связи где бы вы ни были.
            </motion.p>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: '⚡',
                  title: 'Быстрая доставка',
                  desc: 'Мгновенные сообщения',
                  color: 'from-yellow-400 to-orange-500'
                },
                {
                  icon: '🔒',
                  title: 'Безопасность',
                  desc: 'Защита данных',
                  color: 'from-green-400 to-emerald-500'
                },
                {
                  icon: '🎨',
                  title: 'Кастомизация',
                  desc: 'Настройка интерфейса',
                  color: 'from-purple-400 to-pink-500'
                },
                {
                  icon: '🎭',
                  title: 'Медиа',
                  desc: 'Стикеры, GIF, файлы',
                  color: 'from-blue-400 to-cyan-500'
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 relative overflow-hidden group cursor-pointer"
                >
                  {/* Gradient Background on Hover */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  />

                  <div className="relative z-10">
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3,
                      }}
                      className="text-3xl mb-2"
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="text-[14px] font-bold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-[12px] text-gray-600">
                      {feature.desc}
                    </p>
                  </div>

                  {/* Shine Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 5,
                    }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Stats Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="mt-6 grid grid-cols-3 gap-3"
            >
              {[
                { value: '99.9%', label: 'Uptime' },
                { value: '<100ms', label: 'Latency' },
                { value: '24/7', label: 'Support' }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 text-center border border-gray-100"
                >
                  <div className="text-[18px] font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
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
