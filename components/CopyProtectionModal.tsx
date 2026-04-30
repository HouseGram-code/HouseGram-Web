'use client';

import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { useState } from 'react';
import { Copy, Forward, Camera, Crown, Check, X } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

interface CopyProtectionModalProps {
  open: boolean;
  contactId: string;
  contactName: string;
  isEnabled: boolean;
  onClose: () => void;
}

// На GitHub-зеркале Telegram-эмодзи нет файла `Locked.webp` — есть только
// `Locked With Key.webp` в папке `Objects`. Старый URL отдавал 404, замок
// не показывался. На случай если CDN снова отвалится — есть fallback на 🔒.
const LOCK_ANIMATED =
  'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Objects/Locked%20With%20Key.webp';

export default function CopyProtectionModal({
  open,
  contactId,
  contactName,
  isEnabled,
  onClose,
}: CopyProtectionModalProps) {
  const { isPremium, setCopyProtection, setView, isDarkMode, themeColor } = useChat();
  const [lockBroken, setLockBroken] = useState(false);

  const handleToggle = async () => {
    if (!isPremium) return;
    try {
      await setCopyProtection(contactId, !isEnabled);
    } catch {
      // setCopyProtection уже показал alert и пробросил — UI не менялся,
      // так как локальный стейт обновляется только после успешной записи.
    }
  };

  const handleGoPremium = () => {
    onClose();
    setView('premium');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className={`fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none`}
          >
            <div
              className={`pointer-events-auto w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl ${
                isDarkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with animated lock */}
              <div
                className="relative h-36 flex items-center justify-center overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`,
                }}
              >
                {/* Sparkles */}
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-white/70"
                    style={{
                      left: `${(i * 13) % 100}%`,
                      top: `${(i * 27) % 100}%`,
                    }}
                    animate={{
                      y: [0, 16, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2 + (i % 3) * 0.4,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  whileHover={{ rotate: [0, -8, 8, -4, 4, 0] }}
                  className="flex items-center justify-center"
                >
                  {lockBroken ? (
                    <span
                      role="img"
                      aria-label="lock"
                      className="text-[80px] leading-none drop-shadow-lg"
                    >
                      🔒
                    </span>
                  ) : (
                    <Image
                      src={LOCK_ANIMATED}
                      alt="lock"
                      width={96}
                      height={96}
                      className="drop-shadow-lg"
                      unoptimized
                      onError={() => setLockBroken(true)}
                    />
                  )}
                </motion.div>
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/25 hover:bg-black/40 text-white transition-colors"
                  aria-label="Закрыть"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5">
                <h2 className="text-[20px] font-semibold text-center mb-1">
                  Запретить копирование
                </h2>
                <p
                  className={`text-[14px] text-center mb-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  Для чата с <span className="font-medium">{contactName}</span>
                </p>

                <ul className="space-y-3 mb-5">
                  <FeatureRow
                    icon={<Copy size={18} />}
                    title="Копирование текста"
                    desc="Собеседник не сможет выделить и скопировать ваши сообщения."
                    isDarkMode={isDarkMode}
                  />
                  <FeatureRow
                    icon={<Forward size={18} />}
                    title="Пересылка"
                    desc="Ваши сообщения нельзя будет переслать в другие чаты."
                    isDarkMode={isDarkMode}
                  />
                  <FeatureRow
                    icon={<Camera size={18} />}
                    title="Скриншоты"
                    desc="Появится напоминание, что контент защищён."
                    isDarkMode={isDarkMode}
                  />
                </ul>

                {isPremium ? (
                  <button
                    type="button"
                    onClick={handleToggle}
                    className={`w-full flex items-center justify-between gap-3 rounded-2xl px-4 py-3 transition-colors ${
                      isDarkMode
                        ? isEnabled
                          ? 'bg-green-500/15'
                          : 'bg-white/5 hover:bg-white/10'
                        : isEnabled
                        ? 'bg-green-50'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span
                      className={`text-[15px] font-medium ${
                        isEnabled
                          ? isDarkMode
                            ? 'text-green-300'
                            : 'text-green-700'
                          : ''
                      }`}
                    >
                      {isEnabled ? 'Защита включена' : 'Включить защиту'}
                    </span>
                    <motion.div
                      layout
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        isEnabled ? 'bg-green-500' : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}
                    >
                      <motion.div
                        layout
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center"
                        style={{ left: isEnabled ? 22 : 2 }}
                      >
                        {isEnabled && <Check size={12} className="text-green-500" />}
                      </motion.div>
                    </motion.div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoPremium}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-white font-medium"
                    style={{
                      background:
                        'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #a855f7 100%)',
                    }}
                  >
                    <Crown size={18} />
                    Доступно в Premium
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FeatureRow({
  icon,
  title,
  desc,
  isDarkMode,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  isDarkMode: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          isDarkMode ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium">{title}</div>
        <div
          className={`text-[12px] leading-snug ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          {desc}
        </div>
      </div>
    </li>
  );
}
