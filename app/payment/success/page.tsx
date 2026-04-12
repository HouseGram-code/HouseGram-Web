'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { CheckCircle, Zap, ArrowRight } from 'lucide-react';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Автоматическое перенаправление через 5 секунд
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleGoToApp = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <CheckCircle size={80} className="text-green-500" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2"
            >
              <Zap size={24} fill="white" className="text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[28px] font-bold text-gray-900 mb-3"
        >
          Оплата успешна!
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[16px] text-gray-600 mb-8 leading-relaxed"
        >
          Молнии уже зачислены на ваш счет. Теперь вы можете отправлять подарки друзьям!
        </motion.p>

        {/* Animated Stars */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-center gap-2 text-white">
            <Zap size={32} fill="white" />
            <span className="text-[24px] font-bold">Молнии получены!</span>
          </div>
        </motion.div>

        {/* Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={handleGoToApp}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-medium text-[16px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          Вернуться в приложение
          <ArrowRight size={20} />
        </motion.button>

        {/* Countdown */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-[14px] text-gray-500 mt-4"
        >
          Автоматическое перенаправление через {countdown} сек...
        </motion.p>

        {/* Confetti Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: '50%',
                y: '50%',
                scale: 0,
                opacity: 1
              }}
              animate={{
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                scale: [0, 1, 0],
                opacity: [1, 1, 0]
              }}
              transition={{
                duration: 2,
                delay: i * 0.05,
                ease: 'easeOut'
              }}
              className="absolute text-2xl"
            >
              {['⭐', '✨', '🎉', '🎊'][Math.floor(Math.random() * 4)]}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
