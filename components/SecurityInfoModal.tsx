'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

/**
 * Информационное окно "Как защищён HouseGram".
 *
 * Анимированные эмоджи + список реальных мер защиты, которые включены
 * в коде (firestore.rules, storage.rules, security headers, rate-limit,
 * anti-SSRF, keyless ID-token verification). Окно намеренно лёгкое —
 * только framer-motion + emoji, без сетевых запросов.
 */

interface SecurityInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeColor: string;
  isDarkMode: boolean;
}

interface Item {
  emoji: string;
  title: string;
  desc: string;
  /** Анимация для эмоджи: лёгкая вариативность, чтобы не однообразно. */
  motion?: 'pulse' | 'rotate' | 'bounce' | 'shake' | 'wave';
}

const ITEMS: Item[] = [
  {
    emoji: '🛡️',
    title: 'Жёсткие правила Firestore',
    desc: 'Каждый видит только свои чаты, сессии и подарки. Чужую переписку и платежи прочитать нельзя.',
    motion: 'pulse',
  },
  {
    emoji: '🔒',
    title: 'Защита Storage',
    desc: 'Файлы можно загружать только в свою папку. Whitelisted типы и лимиты по размеру — нельзя залить .exe или забить бакет.',
    motion: 'shake',
  },
  {
    emoji: '🔑',
    title: 'Проверка токенов без секретов',
    desc: 'API проверяет вашу личность по подписи Google, без приватных ключей на сервере. Угнать токен и подделать запрос не получится.',
    motion: 'rotate',
  },
  {
    emoji: '⚡',
    title: 'Rate-limit на API',
    desc: 'Каждый IP ограничен по числу запросов в минуту. Брутфорс пароля и спам через формы получают 429.',
    motion: 'bounce',
  },
  {
    emoji: '🌐',
    title: 'Анти-SSRF и whitelisted CDN',
    desc: 'Сервер не пойдёт по ссылке на localhost, приватные сети или подозрительный домен. Скачивание идёт только из доверенных хранилищ.',
    motion: 'wave',
  },
  {
    emoji: '🧱',
    title: 'Security headers и HTTPS',
    desc: 'CSP, HSTS, X-Frame, COOP/CORP включены на всех страницах. http автоматически редиректится в https.',
    motion: 'pulse',
  },
  {
    emoji: '🚫',
    title: 'Эскалация прав запрещена',
    desc: 'Никто не может сам себе поставить admin/premium/banned, поменять чужие транзакции или счётчики подарков сильнее, чем на +1.',
    motion: 'shake',
  },
  {
    emoji: '🛰️',
    title: 'Защита от подделок данных',
    desc: 'Просмотры сторис и постов, активации промокодов и счётчики строго увеличиваются на +1 — нельзя «накрутить» себе тысячи.',
    motion: 'rotate',
  },
];

const motionVariants: Record<NonNullable<Item['motion']>, any> = {
  pulse: {
    animate: { scale: [1, 1.15, 1] },
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
  },
  rotate: {
    animate: { rotate: [0, -8, 8, -4, 0] },
    transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
  },
  bounce: {
    animate: { y: [0, -6, 0] },
    transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
  },
  shake: {
    animate: { x: [0, -3, 3, -3, 3, 0] },
    transition: { duration: 1.5, repeat: Infinity, repeatDelay: 1.5 },
  },
  wave: {
    animate: { rotate: [0, 12, -12, 6, -6, 0] },
    transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
  },
};

export default function SecurityInfoModal({
  isOpen,
  onClose,
  themeColor,
  isDarkMode,
}: SecurityInfoModalProps) {
  // Esc закрывает модалку.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Блокируем скролл фона пока модалка открыта.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full sm:w-[min(92vw,520px)] max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden ${
              isDarkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'
            }`}
          >
            {/* Декоративный градиентный заголовок */}
            <div
              className="relative px-6 pt-7 pb-6 text-white overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${themeColor}, ${themeColor}aa)`,
              }}
            >
              {/* Звёзды-блёстки на фоне */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${(i * 13 + 7) % 100}%`,
                      top: `${(i * 23 + 11) % 100}%`,
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      rotate: [0, 180],
                    }}
                    transition={{
                      duration: 2.4 + i * 0.15,
                      repeat: Infinity,
                      delay: i * 0.18,
                    }}
                  >
                    <Sparkles size={12} className="text-white/70" />
                  </motion.div>
                ))}
              </div>

              <button
                onClick={onClose}
                aria-label="Закрыть"
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 transition-colors flex items-center justify-center backdrop-blur-sm"
              >
                <X size={18} />
              </button>

              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
                className="relative z-10 flex items-center gap-3 mb-2"
              >
                <motion.div
                  className="text-[44px] leading-none drop-shadow-md"
                  animate={{ rotate: [0, -8, 8, -4, 0], scale: [1, 1.05, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  aria-hidden
                >
                  🛡️
                </motion.div>
                <div>
                  <h2 className="text-[22px] font-extrabold leading-tight tracking-tight">
                    HouseGram защищён
                  </h2>
                  <p className="text-[13px] text-white/85">
                    Реальные меры в коде, не маркетинг
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Список мер */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-6 py-4 space-y-2.5">
              {ITEMS.map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + idx * 0.05, duration: 0.25 }}
                  className={`flex items-start gap-3 rounded-2xl px-3.5 py-3 ${
                    isDarkMode
                      ? 'bg-white/5 hover:bg-white/10'
                      : 'bg-gray-50 hover:bg-gray-100'
                  } transition-colors`}
                >
                  <motion.div
                    className="text-[30px] leading-none shrink-0 select-none"
                    aria-hidden
                    animate={motionVariants[item.motion ?? 'pulse'].animate}
                    transition={motionVariants[item.motion ?? 'pulse'].transition}
                  >
                    {item.emoji}
                  </motion.div>
                  <div className="min-w-0">
                    <div
                      className={`text-[15px] font-semibold leading-snug ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {item.title}
                    </div>
                    <div
                      className={`text-[13px] leading-snug mt-0.5 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {item.desc}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Подвал-плашка с подсказкой */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className={`mt-4 rounded-2xl p-3.5 text-[12.5px] leading-relaxed ${
                  isDarkMode
                    ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                }`}
              >
                <span className="font-semibold">Совет.</span> Никогда не передавайте
                свой пароль и пароль-код посторонним. Поддержка HouseGram никогда не
                спрашивает их в чатах.
              </motion.div>
            </div>

            {/* Кнопка ОК */}
            <div
              className={`px-4 sm:px-6 py-3 border-t ${
                isDarkMode ? 'border-white/10' : 'border-gray-100'
              }`}
            >
              <button
                onClick={onClose}
                className="w-full text-white rounded-xl py-3 text-[15px] font-semibold shadow hover:shadow-md active:scale-[0.99] transition-all"
                style={{
                  background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`,
                }}
              >
                Понятно
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
