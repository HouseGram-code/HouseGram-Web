'use client';

import { motion } from 'motion/react';

interface FounderBadgeProps {
  size?: number;
  className?: string;
}

export default function FounderBadge({ size = 24, className = '' }: FounderBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Основной круг с градиентом */}
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #4F46E5 100%)',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
        }}
      />
      
      {/* Внутренний белый круг */}
      <div 
        className="absolute inset-[2px] rounded-full bg-white flex items-center justify-center"
      />
      
      {/* Буква H с градиентом */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative z-10 font-bold text-transparent bg-clip-text"
        style={{
          fontSize: size * 0.5,
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #4F46E5 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 900
        }}
      >
        H
      </motion.div>
      
      {/* Блики и эффекты */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          background: [
            'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)'
          ]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
}