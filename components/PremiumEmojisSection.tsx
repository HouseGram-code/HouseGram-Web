'use client';

import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, Crown, Search, X } from 'lucide-react';
import { useState } from 'react';
import { premiumEmojiPacks, searchPremiumEmojis } from '@/lib/premiumEmojis';
import Image from 'next/image';

interface PremiumEmojisSectionProps {
  isPremium: boolean;
}

export default function PremiumEmojisSection({ isPremium }: PremiumEmojisSectionProps) {
  const [selectedEmojiPack, setSelectedEmojiPack] = useState<string | null>(null);
  const [emojiSearch, setEmojiSearch] = useState('');

  return (
    <div className="px-4 mb-6">
      <h3 className="text-[18px] font-bold text-gray-900 mb-2 flex items-center gap-2">
        <Sparkles size={20} className="text-purple-500" />
        Анимированные эмодзи
      </h3>
      <p className="text-[14px] text-gray-600 mb-4">
        Эксклюзивные анимированные эмодзи как в Telegram
      </p>

      {/* Emoji Packs */}
      <AnimatePresence mode="wait">
        {!selectedEmojiPack ? (
          <motion.div
            key="packs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            {premiumEmojiPacks.map((pack, index) => (
              <motion.button
                key={pack.id}
                onClick={() => setSelectedEmojiPack(pack.id)}
                className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-4 text-left"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-[48px] mb-2">{pack.icon}</div>
                <div className="text-[15px] font-semibold text-gray-900 mb-1">
                  {pack.name}
                </div>
                <div className="text-[12px] text-gray-600">
                  {pack.emojis.length} эмодзи
                </div>
                {!isPremium && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-purple-600 font-medium">
                    <Crown size={12} />
                    Premium
                  </div>
                )}
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="emojis"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedEmojiPack(null);
                setEmojiSearch('');
              }}
              className="flex items-center gap-2 text-blue-500 mb-3 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-[14px] font-medium">Назад к пакам</span>
            </button>

            {/* Search */}
            <div className="mb-3">
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  value={emojiSearch}
                  onChange={(e) => setEmojiSearch(e.target.value)}
                  placeholder="Поиск эмодзи..."
                  className="flex-grow bg-transparent outline-none text-[14px] text-gray-700 placeholder-gray-400"
                />
                {emojiSearch && (
                  <button
                    onClick={() => setEmojiSearch('')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Emoji Grid */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {(emojiSearch 
                ? searchPremiumEmojis(emojiSearch)
                : premiumEmojiPacks.find(p => p.id === selectedEmojiPack)?.emojis || []
              ).map((emoji, index) => (
                <motion.button
                  key={emoji.id}
                  className="aspect-square bg-white rounded-xl p-2 hover:bg-gray-50 transition-colors relative group overflow-hidden"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title={emoji.name}
                  disabled={!isPremium}
                >
                  <Image
                    src={emoji.url}
                    alt={emoji.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-contain"
                    unoptimized
                  />
                  {!isPremium && (
                    <motion.div 
                      className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Crown size={20} className="text-white" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>

            {!isPremium && (
              <motion.div 
                className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-[13px] text-purple-700 mb-2 flex items-center justify-center gap-1">
                  <Crown size={14} />
                  Требуется Premium подписка
                </p>
                <p className="text-[12px] text-purple-600">
                  Оформите Premium чтобы использовать анимированные эмодзи
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
