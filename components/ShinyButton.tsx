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
    premium: 'from-yellow-400 via-yellow-500 to-orange-500',
    primary: 'from-blue-500 via-blue-600 to-purple-600',
    success: 'from-green-400 via-green-500 to-emerald-500',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative group overflow-hidden ${className}`}
    >
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-r ${variants[variant]} opacity-100`} />
      
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30"
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 0.5,
          ease: 'easeInOut',
        }}
      />
      
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${variants[variant]} blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300`} />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center space-x-2 px-6 py-3 text-white font-semibold">
        {children}
      </div>
      
      {/* Sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: Math.random() * 100 + '%',
              opacity: 0,
              scale: 0,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.7,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.button>
  );
}
