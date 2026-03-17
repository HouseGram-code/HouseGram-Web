'use client';

import { motion } from 'motion/react';

export function Skeleton({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.8 }}
      className={`bg-gray-200 rounded-md ${className}`}
    />
  );
}

export default Skeleton;
