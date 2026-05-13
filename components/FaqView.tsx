'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, HelpCircle, ChevronDown, Sparkles, MessageCircle, Lock, Sticker, Palette, Mic, Star, Edit3, Share2, Image as ImageIcon, Trash2, Smartphone, Mail } from 'lucide-react';
import { useState } from 'react';

interface FaqItem {
  question: string;
  answer: string;
  icon: any;
  color: string;
}

export default function FaqView() {
  const { setView, themeColor, isGlassEnabled } = useChat();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const faqItems: FaqItem[] = [
    {
      question: 'Что такое HouseGram Web?',
      answer: 'HouseGram Web — это веб-версия мессенджера HouseGram, которая позволяет общаться с друзьями и близкими прямо из браузера. Никаких установок не требуется!',
      icon: MessageCircle,
      color: '#3b82f6'
    },
    {
      question: 'Безопасны ли мои сообщения?',
      answer: 'Да! Мы используем современные методы шифрования для защиты ваших данных. Все сообщения и медиафайлы надежно защищены от несанкционированного доступа.',
      icon: Lock,
      color: '#10b981'
    },
    {
      question: 'Как создать свой стикер?',
      answer: 'Откройте любой чат, нажмите на иконку смайлика 🙂, перейдите во вкладку "Стикеры" и нажмите кнопку "+". Выберите изображение, введите название и готово!',
      icon: Sticker,
      color: '#f59e0b'
    },
    {
      question: 'Можно ли изменить тему оформления?',
      answer: 'Конечно! Перейдите в Настройки → Оформление чата. Там вы можете выбрать цвет темы, обои для чата и включить эффект стекла.',
      icon: Palette,
      color: '#8b5cf6'
    },
    {
      question: 'Как отправить голосовое сообщение?',
      answer: 'В любом чате нажмите и удерживайте кнопку микрофона. Говорите ваше сообщение, затем отпустите кнопку для отправки.',
      icon: Mic,
      color: '#ef4444'
    },
    {
      question: 'Что такое "Избранное"?',
      answer: 'Избранное — это личное хранилище для важных сообщений, файлов и медиа. Только вы можете видеть содержимое избранного.',
      icon: Star,
      color: '#eab308'
    },
    {
      question: 'Можно ли редактировать отправленные сообщения?',
      answer: 'Да! Нажмите и удерживайте на своем сообщении, затем выберите "Редактировать". Отредактированные сообщения будут помечены.',
      icon: Edit3,
      color: '#06b6d4'
    },
    {
      question: 'Как переслать сообщение?',
      answer: 'Нажмите и удерживайте на сообщении, выберите "Переслать", затем выберите чат, в который хотите переслать сообщение.',
      icon: Share2,
      color: '#ec4899'
    },
    {
      question: 'Поддерживаются ли GIF-анимации?',
      answer: 'Да! В панели эмодзи есть вкладка "GIF", где вы можете выбрать и отправить анимированные изображения.',
      icon: ImageIcon,
      color: '#14b8a6'
    },
    {
      question: 'Как удалить чат?',
      answer: 'Откройте чат, нажмите на три точки в правом верхнем углу и выберите "Удалить чат". Это действие нельзя отменить.',
      icon: Trash2,
      color: '#f43f5e'
    },
    {
      question: 'Можно ли использовать HouseGram на телефоне?',
      answer: 'Да! HouseGram Web адаптирован для мобильных устройств. Просто откройте сайт в браузере вашего телефона.',
      icon: Smartphone,
      color: '#6366f1'
    },
    {
      question: 'Как связаться с поддержкой?',
      answer: 'Если у вас возникли проблемы или вопросы, вы можете написать нам через раздел "Информация" в настройках.',
      icon: Mail,
      color: '#f97316'
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col z-20"
    >
      <div 
        className={`text-white px-2.5 h-14 flex items-center gap-4 shrink-0 relative z-30 transition-colors ${isGlassEnabled ? 'backdrop-blur-md border-b border-black/10' : ''}`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'CC' : themeColor }}
      >
        <button onClick={() => setView('info')} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow text-[18px] font-medium">Вопросы и ответы</div>
      </div>

      <div className="flex-grow overflow-y-auto p-5 no-scrollbar">
        {/* Hero Section with Animation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl p-8 shadow-2xl mb-6 relative overflow-hidden"
        >
          {/* Animated Background Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-white/20 text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, Math.random() * 20 - 10, 0],
                  scale: [1, 1.5, 1],
                  opacity: [0.2, 0.5, 0.2],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              >
                ❓
              </motion.div>
            ))}
          </div>

          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 relative z-10"
          >
            <HelpCircle size={40} className="text-white" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Часто задаваемые вопросы</h2>
          <p className="text-white/90 text-[15px] leading-relaxed relative z-10">
            Здесь вы найдете ответы на самые популярные вопросы о HouseGram Web.
          </p>
        </motion.div>

        {/* FAQ Items with Stagger Animation */}
        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const Icon = item.icon;
            const isOpen = openIndex === index;
            const isHovered = hoveredIndex === index;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden relative"
                style={{
                  boxShadow: isHovered ? `0 10px 40px ${item.color}20` : undefined,
                }}
              >
                {/* Animated Border on Hover */}
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  animate={{
                    boxShadow: isHovered 
                      ? `inset 0 0 0 2px ${item.color}40`
                      : 'inset 0 0 0 0px transparent',
                  }}
                  transition={{ duration: 0.3 }}
                />

                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors relative z-10"
                >
                  {/* Icon with Animation */}
                  <motion.div
                    animate={{
                      scale: isHovered ? 1.1 : 1,
                      rotate: isOpen ? 360 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ 
                      backgroundColor: `${item.color}15`,
                      color: item.color 
                    }}
                  >
                    <Icon size={24} />
                  </motion.div>

                  <span className="text-[15px] font-semibold text-gray-900 pr-4 flex-grow">
                    {item.question}
                  </span>

                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown size={20} className="text-gray-400" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <motion.div
                        initial={{ y: -10 }}
                        animate={{ y: 0 }}
                        exit={{ y: -10 }}
                        className="px-5 pb-5 pt-2 border-t border-gray-100"
                      >
                        <div 
                          className="pl-4 border-l-4 rounded"
                          style={{ borderColor: item.color }}
                        >
                          <p className="text-[15px] text-gray-600 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Contact Support Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 relative overflow-hidden"
        >
          {/* Sparkles Animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-yellow-400"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  y: [0, -20],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                }}
              >
                ✨
              </motion.div>
            ))}
          </div>

          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-gray-900 mb-2">Не нашли ответ?</h3>
              <p className="text-[14px] text-gray-600 leading-relaxed">
                Если ваш вопрос не указан выше, свяжитесь с нашей службой поддержки через раздел "Информация" в настройках.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
