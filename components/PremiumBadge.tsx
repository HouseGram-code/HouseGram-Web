'use client';

import { Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  onClick?: (e?: React.MouseEvent) => void;
  animated?: boolean;
}

export default function PremiumBadge({ size = 'md', onClick, animated = true }: PremiumBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  const dotSizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2'
  };

  const starSize = {
    sm: 12,
    md: 16,
    lg: 20
  };

  return (
    <motion.div
      className={`relative cursor-pointer ${sizeClasses[size]}`}
      onClick={(e) => onClick?.(e)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={animated ? { scale: 1.1 } : {}}
      whileTap={animated ? { scale: 0.95 } : {}}
    >
      {/* Main Star */}
      <Star 
        size={starSize[size]} 
        className="text-yellow-500" 
        fill="currentColor"
      />
      
      {/* Red Dot */}
      <div className={`absolute -top-0.5 -right-0.5 ${dotSizeClasses[size]} bg-red-500 rounded-full border border-white`}></div>
      
      {/* Sparkle Animation */}
      {animated && isHovered && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-yellow-400 pointer-events-none"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: size === 'sm' ? '8px' : size === 'md' ? '10px' : '12px'
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
                x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 40],
                y: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 40]
              }}
              transition={{
                duration: 1,
                delay: i * 0.2,
                ease: "easeOut"
              }}
            >
              ✨
            </motion.div>
          ))}
        </>
      )}
    </motion.div>
  );
}