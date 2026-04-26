'use client';

import { Monitor, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';

interface ModeToggleButtonProps {
  isDesktop: boolean;
  onToggle: () => void;
}

export default function ModeToggleButton({ isDesktop, onToggle }: ModeToggleButtonProps) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
      <div className="relative flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg">
        {isDesktop ? (
          <>
            <Smartphone size={18} />
            <span className="text-sm font-medium">Мобильный</span>
          </>
        ) : (
          <>
            <Monitor size={18} />
            <span className="text-sm font-medium">Desktop</span>
          </>
        )}
      </div>
    </motion.button>
  );
}
