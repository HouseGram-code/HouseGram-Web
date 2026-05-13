'use client';

import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface ShinyButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'premium' | 'primary' | 'success';
}

export default function ShinyButton({ 
  children, 
  onClick, 
  className = '',
  variant = 'premium'
}: ShinyButtonProps) {
  
  const variants = {
    premium: 'from-yellow-400 via-amber-500 to-orange-500',
    primary: 'from-blue-500 via-blue-600 to-purple-600',
    success: 'from-green-400 via-green-500 to-emerald-500',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(251, 191, 36, 0.4)' }}
      whileTap={{ scale: 0.98 }}
      className={`relative group overflow-hidden rounded-2xl ${className}`}
    >
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-r ${variants[variant]} opacity-100`} />
      
      {/* Multiple shine effects for more depth */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-40"
        animate={{
          x: ['-200%', '200%'],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          repeatDelay: 0.3,
          ease: 'easeInOut',
        }}
        style={{
          transform: 'skewX(-20deg)',
        }}
      />
      
      {/* Secondary shine */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-50"
        animate={{
          opacity: [0, 0.5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Glow effect */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${variants[variant]} blur-2xl opacity-60 group-hover:opacity-90 transition-opacity duration-500`} />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center space-x-2 px-6 py-3 text-white font-semibold drop-shadow-lg">
        {children}
      </div>
      
      {/* Enhanced sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-lg"
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: Math.random() * 100 + '%',
              opacity: 0,
              scale: 0,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      
      {/* Pulse effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        animate={{
          boxShadow: [
            '0 0 20px rgba(251, 191, 36, 0.3)',
            '0 0 40px rgba(251, 191, 36, 0.6)',
            '0 0 20px rgba(251, 191, 36, 0.3)',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.button>
  );
}
