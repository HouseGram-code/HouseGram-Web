'use client';

import { motion } from 'motion/react';
import { AlertTriangle, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FrozenAccountScreenProps {
  frozenAt: string;
  reason?: string;
}

export default function FrozenAccountScreen({ frozenAt, reason }: FrozenAccountScreenProps) {
  const [daysLeft, setDaysLeft] = useState(7);

  useEffect(() => {
    const frozenDate = new Date(frozenAt);
    const now = new Date();
    const diffTime = 7 * 24 * 60 * 60 * 1000 - (now.getTime() - frozenDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysLeft(Math.max(0, diffDays));
  }, [frozenAt]);

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900 flex items-center justify-center overflow-hidden">
      {/* Animated Snow/Ice Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10%`,
            }}
            animate={{
              y: ['0vh', '110vh'],
              x: [0, Math.random() * 100 - 50],
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Frost Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent pointer-events-none" />

      {/* Main Content */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative z-10 max-w-md mx-4"
      >
        {/* Frozen Ghost Animation */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="mb-8 flex justify-center"
        >
          {/* Ghost Emoji with Ice Effect */}
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="text-[120px] filter drop-shadow-2xl"
            >
              👻
            </motion.div>
            
            {/* Ice Crystals around Ghost */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-4xl"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `rotate(${i * 45}deg) translateY(-80px)`,
                }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              >
                ❄️
              </motion.div>
            ))}

            {/* Frozen Effect Circle */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-cyan-400/50"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
            />
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-4 border-cyan-300/50"
        >
          {/* Warning Icon */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="flex justify-center mb-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
              <AlertTriangle size={32} className="text-white" />
            </div>
          </motion.div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Аккаунт заморожен
          </h1>

          {/* Frozen Badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <motion.span
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="text-6xl"
            >
              🧊
            </motion.span>
            <div className="text-center">
              <div className="text-sm text-gray-500 uppercase tracking-wider">Статус</div>
              <div className="text-xl font-bold text-blue-600">Заморожен</div>
            </div>
            <motion.span
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 1,
              }}
              className="text-6xl"
            >
              🧊
            </motion.span>
          </div>

          {/* Reason */}
          {reason && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <div className="text-sm text-red-600 font-semibold mb-1">Причина заморозки:</div>
              <div className="text-gray-800">{reason}</div>
            </div>
          )}

          {/* Warning Message */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
              >
                <AlertTriangle size={24} className="text-orange-600 shrink-0" />
              </motion.div>
              <div>
                <p className="text-gray-800 font-medium mb-2">
                  Ваш аккаунт временно заморожен и недоступен для использования.
                </p>
                <p className="text-gray-700 text-sm">
                  Если вы не свяжетесь с технической поддержкой в течение{' '}
                  <span className="font-bold text-red-600">{daysLeft} {daysLeft === 1 ? 'дня' : 'дней'}</span>,
                  ваш аккаунт будет <span className="font-bold text-red-600">удалён навсегда</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Countdown Timer */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
            className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 mb-6 text-center"
          >
            <div className="text-white/90 text-sm font-medium mb-1">До удаления аккаунта осталось</div>
            <div className="text-white text-4xl font-bold flex items-center justify-center gap-2">
              <span>⏰</span>
              <span>{daysLeft}</span>
              <span className="text-2xl">{daysLeft === 1 ? 'день' : 'дней'}</span>
            </div>
          </motion.div>

          {/* Contact Support Button */}
          <motion.a
            href="https://t.me/HouseGramSupport"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-shadow"
          >
            <MessageCircle size={24} />
            Связаться с поддержкой
          </motion.a>

          {/* Additional Info */}
          <p className="text-center text-gray-500 text-sm mt-4">
            Обратитесь в поддержку для разморозки аккаунта
          </p>
        </motion.div>

        {/* Floating Ice Crystals */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 360],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            >
              ❄️
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
