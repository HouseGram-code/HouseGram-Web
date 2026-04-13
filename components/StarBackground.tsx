/**
 * Анимированный фон со звездами как в Telegram
 */

'use client';

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export default function StarBackground() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    // Генерируем случайные звезды
    const generateStars = () => {
      const newStars: Star[] = [];
      const starCount = 50; // Количество звезд

      for (let i = 0; i < starCount; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100, // Позиция X в процентах
          y: Math.random() * 100, // Позиция Y в процентах
          size: Math.random() * 3 + 1, // Размер от 1 до 4
          duration: Math.random() * 3 + 2, // Длительность анимации от 2 до 5 секунд
          delay: Math.random() * 2, // Задержка от 0 до 2 секунд
          opacity: Math.random() * 0.5 + 0.3 // Прозрачность от 0.3 до 0.8
        });
      }

      setStars(newStars);
    };

    generateStars();
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
          animate={{
            opacity: [star.opacity, star.opacity * 0.3, star.opacity],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Большие звезды с особой анимацией */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`big-star-${i}`}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 4,
            delay: i * 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L14.09 8.26L20 10L14.09 11.74L12 18L9.91 11.74L4 10L9.91 8.26L12 2Z"
              fill="white"
              fillOpacity="0.6"
            />
          </svg>
        </motion.div>
      ))}

      {/* Мерцающие частицы */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 0.8, 0],
            y: [0, -30, -60],
          }}
          transition={{
            duration: 3,
            delay: i * 0.2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}
