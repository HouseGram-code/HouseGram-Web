'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, Star, Bot, Sparkles, Shield, MessageSquare } from 'lucide-react';
import PremiumBadge from './PremiumBadge';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onUpgrade?: () => void;
  isCurrentUser?: boolean;
}

export default function PremiumModal({ 
  isOpen, 
  onClose, 
  userName, 
  onUpgrade,
  isCurrentUser = false 
}: PremiumModalProps) {
  if (!isOpen) return null;

  const features = [
    {
      icon: <Bot size={20} className="text-purple-500" />,
      title: "5 запросов к ИИ в день",
      description: "Вместо 1 запроса для обычных пользователей"
    },
    {
      icon: <Star size={20} className="text-yellow-500" fill="currentColor" />,
      title: "Премиум значок",
      description: "Красивый значок рядом с именем"
    },
    {
      icon: <MessageSquare size={20} className="text-blue-500" />,
      title: "Приоритетная поддержка",
      description: "Быстрые ответы от службы поддержки"
    },
    {
      icon: <Sparkles size={20} className="text-pink-500" />,
      title: "Эксклюзивные функции",
      description: "Доступ к новым возможностям первыми"
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-white rounded-3xl max-w-sm w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 text-white p-6 relative overflow-hidden">
            {/* Animated Background Stars */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-white/20"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    fontSize: '16px'
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 0.4, 0],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeInOut"
                  }}
                >
                  ⭐
                </motion.div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <PremiumBadge size="lg" animated={false} />
                <div>
                  <h2 className="text-[20px] font-bold">
                    {isCurrentUser ? 'Ваш Premium' : `${userName} Premium`}
                  </h2>
                  <p className="text-white/90 text-[14px]">
                    {isCurrentUser ? 'У вас есть Premium подписка' : 'Этот пользователь имеет Premium'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-[18px] font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Crown size={20} className="text-purple-500" />
              Возможности Premium
            </h3>

            <div className="space-y-3 mb-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <div className="shrink-0 mt-0.5">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-[13px] text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Action Button */}
            {!isCurrentUser && onUpgrade && (
              <button
                onClick={onUpgrade}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Crown size={20} />
                Получить Premium
              </button>
            )}

            {isCurrentUser && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                <p className="text-[14px] text-green-700 font-medium">
                  ✨ Вы уже Premium пользователь!
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}