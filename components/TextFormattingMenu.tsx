'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Bold, Italic, Code, Link as LinkIcon, Strikethrough, Underline } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface TextFormattingMenuProps {
  selectedText: string;
  position: { x: number; y: number };
  onFormat: (format: string) => void;
  onClose: () => void;
}

export default function TextFormattingMenu({ 
  selectedText, 
  position, 
  onFormat, 
  onClose 
}: TextFormattingMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const formatOptions = [
    { 
      id: 'bold', 
      icon: <Bold size={18} />, 
      label: 'Жирный',
      format: (text: string) => `**${text}**`,
      color: 'text-blue-600'
    },
    { 
      id: 'italic', 
      icon: <Italic size={18} />, 
      label: 'Курсив',
      format: (text: string) => `_${text}_`,
      color: 'text-purple-600'
    },
    { 
      id: 'code', 
      icon: <Code size={18} />, 
      label: 'Моноширинный',
      format: (text: string) => `\`${text}\``,
      color: 'text-green-600'
    },
    { 
      id: 'strikethrough', 
      icon: <Strikethrough size={18} />, 
      label: 'Зачёркнутый',
      format: (text: string) => `~~${text}~~`,
      color: 'text-red-600'
    },
    { 
      id: 'underline', 
      icon: <Underline size={18} />, 
      label: 'Подчёркнутый',
      format: (text: string) => `__${text}__`,
      color: 'text-orange-600'
    },
    { 
      id: 'link', 
      icon: <LinkIcon size={18} />, 
      label: 'Ссылка',
      format: (text: string) => `[${text}](url)`,
      color: 'text-cyan-600'
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="fixed z-[100] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        style={{
          left: Math.min(position.x, window.innerWidth - 320),
          top: Math.max(position.y - 60, 10),
          minWidth: '280px'
        }}
      >
        {/* Header */}
        <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
          <div className="text-[13px] font-medium text-gray-700">Форматирование текста</div>
          <div className="text-[11px] text-gray-500 truncate mt-0.5">
            "{selectedText.substring(0, 30)}{selectedText.length > 30 ? '...' : ''}"
          </div>
        </div>

        {/* Format Options */}
        <div className="py-1">
          {formatOptions.map((option, index) => (
            <motion.button
              key={option.id}
              onClick={() => {
                onFormat(option.format(selectedText));
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left group"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ x: 4 }}
            >
              <motion.div 
                className={`${option.color} group-hover:scale-110 transition-transform`}
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.3 }}
              >
                {option.icon}
              </motion.div>
              <div className="flex-grow">
                <div className="text-[14px] font-medium text-gray-900">{option.label}</div>
                <div className="text-[11px] text-gray-500 font-mono">
                  {option.format('текст')}
                </div>
              </div>
              <motion.div
                className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                whileHover={{ scale: 1.2 }}
              >
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              </motion.div>
            </motion.button>
          ))}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <div className="text-[10px] text-gray-500 text-center">
            💡 Выделите текст для форматирования
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
