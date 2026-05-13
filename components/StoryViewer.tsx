'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Camera } from 'lucide-react';

interface StoryViewerProps {
  stories: any[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentUserId: any;
}

export default function StoryViewer({ stories, currentIndex, onClose, onNext, onPrev, currentUserId }: StoryViewerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
      >
        <X size={24} />
      </button>

      <div className="text-center text-white">
        <Camera size={64} className="mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Функция временно недоступна</h3>
        <p className="text-sm opacity-70">
          Просмотр историй будет доступен после настройки базы данных
        </p>
      </div>
    </motion.div>
  );
}