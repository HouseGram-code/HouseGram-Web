'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useChat } from '@/context/ChatContext';
import { Edit, Reply, Forward, Copy, Trash2, Pin, Star } from 'lucide-react';

export interface ContextMenuItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  items: ContextMenuItem[];
}

export default function ContextMenu({ isOpen, onClose, position, items }: ContextMenuProps) {
  const { isDarkMode } = useChat();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Adjust position to keep menu in viewport
  const adjustedPosition = { ...position };
  if (menuRef.current) {
    const rect = menuRef.current.getBoundingClientRect();
    if (position.x + rect.width > window.innerWidth) {
      adjustedPosition.x = window.innerWidth - rect.width - 10;
    }
    if (position.y + rect.height > window.innerHeight) {
      adjustedPosition.y = window.innerHeight - rect.height - 10;
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          {/* Context Menu */}
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={`fixed z-50 min-w-[200px] rounded-xl shadow-2xl overflow-hidden ${
              isDarkMode ? 'bg-[#1a1a1a] border border-gray-800' : 'bg-white border border-gray-200'
            }`}
            style={{
              left: `${adjustedPosition.x}px`,
              top: `${adjustedPosition.y}px`,
            }}
          >
            <div className="py-2">
              {items.map((item, index) => (
                <div key={index}>
                  {item.divider && (
                    <div className={`h-px my-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
                  )}
                  <button
                    onClick={() => {
                      item.onClick();
                      onClose();
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 transition-colors ${
                      item.danger
                        ? 'hover:bg-red-500/10 text-red-500'
                        : isDarkMode
                        ? 'hover:bg-gray-800'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <item.icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Example usage component
export function MessageContextMenu() {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const menuItems: ContextMenuItem[] = [
    {
      icon: Edit,
      label: 'Редактировать',
      onClick: () => console.log('Edit'),
    },
    {
      icon: Reply,
      label: 'Ответить',
      onClick: () => console.log('Reply'),
    },
    {
      icon: Forward,
      label: 'Переслать',
      onClick: () => console.log('Forward'),
    },
    {
      icon: Copy,
      label: 'Копировать',
      onClick: () => console.log('Copy'),
    },
    {
      icon: Pin,
      label: 'Закрепить',
      onClick: () => console.log('Pin'),
      divider: true,
    },
    {
      icon: Star,
      label: 'В избранное',
      onClick: () => console.log('Favorite'),
    },
    {
      icon: Trash2,
      label: 'Удалить',
      onClick: () => console.log('Delete'),
      danger: true,
      divider: true,
    },
  ];

  return (
    <ContextMenu
      isOpen={contextMenu !== null}
      onClose={() => setContextMenu(null)}
      position={contextMenu || { x: 0, y: 0 }}
      items={menuItems}
    />
  );
}
