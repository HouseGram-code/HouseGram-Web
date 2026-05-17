'use client';

/**
 * HouseGram Premium — переработанный экран.
 *
 * Что изменилось по сравнению с прошлой версией:
 *  - Один источник правды для статуса премиума: контекст `useChat()`
 *    (`isPremium`, `premiumExpiry`). Локальный fetch удалён — он жил
 *    своей жизнью и не реагировал на изменения профиля.
 *  - Вместо нативного `alert()` — нативная модалка успеха, в которой
 *    можно скопировать ID заявки и id бота нажатием.
 *  - Учтена тёмная тема: фон, карточки, текст переключаются вместе с
 *    `isDarkMode`. Раньше экран был всегда светлым и плохо смотрелся.
 *  - Список "что входит" / "сравнение" вынесены в табы; добавлены
 *    реалистичные пункты, без выдумывания.
 *  - Удалены неиспользуемые импорты — компилятор ругался warning'ами,
 *    а часть из них (Image, Search, X) вообще не была применена.
 *  - Кнопка покупки умеет показывать "Уже Premium" / "Продлить" в
 *    зависимости от текущего статуса.
 */

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Star,
  Check,
  Crown,
  Bot,
  Sparkles,
  Shield,
  Zap,
  Copy,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import ShinyButton from './ShinyButton';
import PremiumEmojisSection from './PremiumEmojisSection';

const PREMIUM_PRICE_RUB = 299;
const PREMIUM_BOT = '@HouseGramBot';

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

const FEATURES: FeatureItem[] = [
  {
    icon: <Bot size={22} className="text-purple-500" />,
    title: '5 запросов к ИИ в день',
    description: 'Вместо 1 у обычных пользователей',
    highlight: true,
  },
  {
    icon: <Star size={22} className="text-yellow-500" fill="currentColor" />,
    title: 'Премиум-значок',
    description: 'Звёздочка рядом с именем во всех чатах',
    highlight: true,
  },
  {
    icon: <Sparkles size={22} className="text-pink-500" />,
    title: 'Премиум-эмодзи',
    description: 'Анимированные пакеты эмодзи только для подписчиков',
  },
  {
    icon: <Shield size={22} className="text-emerald-500" />,
    title: 'Расширенная приватность',
    description: 'Тонкая настройка кто видит ваш статус и фото',
  },
  {
    icon: <Zap size={22} className="text-amber-500" fill="currentColor" />,
    title: 'Бонусы в подарках',
    description: 'Скидки и приоритет на новые лимитированные подарки',
  },
];

interface ComparisonRow {
  label: string;
  free: string;
  premium: string;
}

const COMPARISON: ComparisonRow[] = [
  { label: 'Запросы к ИИ', free: '1 / день', premium: '5 / день' },
  { label: 'Премиум-эмодзи', free: '—', premium: 'Все пакеты' },
  { label: 'Премиум-значок', free: '—', premium: '⭐' },
  { label: 'Анимированные подарки', free: 'Стандартные', premium: 'Все + ранний доступ' },
  { label: 'Поддержка', free: 'Обычная', premium: 'Приоритетная' },
];

function formatExpiry(date: Date) {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getDaysLeft(date: Date) {
  const ms = date.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export default function PremiumView() {
  const {
    setView,
    themeColor,
    userProfile,
    isPremium,
    premiumExpiry,
    isDarkMode,
    isGlassEnabled,
  } = useChat();

  const [purchasing, setPurchasing] = useState(false);
  const [tab, setTab] = useState<'features' | 'compare'>('features');
  const [successRequest, setSuccessRequest] = useState<{
    id: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const purchasePremium = async () => {
    if (!auth.currentUser) {
      setToast('Войдите в аккаунт');
      return;
    }
    setPurchasing(true);
    try {
      const requestRef = await addDoc(collection(db, 'premium_requests'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        userName: userProfile.name,
        price: PREMIUM_PRICE_RUB,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setSuccessRequest({ id: requestRef.id.slice(0, 8) });
    } catch (error) {
      console.error('Premium purchase error:', error);
      setToast('Не удалось создать заявку');
    } finally {
      setPurchasing(false);
    }
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast(`${label} скопирован`);
    } catch {
      setToast('Не удалось скопировать');
    }
  };

  const bgClass = isDarkMode ? 'bg-[#0f0f0f]' : 'bg-gray-50';
  const cardBg = isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDarkMode ? 'border-white/5' : 'border-gray-100';

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`absolute inset-0 ${bgClass} flex flex-col z-10`}
    >
      {/* Header */}
      <div
        className={`text-white px-2.5 h-14 flex items-center gap-3 shrink-0 absolute top-0 left-0 w-full z-30 transition-colors ${
          isGlassEnabled ? 'backdrop-blur-md border-b border-white/15' : ''
        }`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'CC' : themeColor }}
      >
        <button
          onClick={() => setView('settings')}
          className="p-1.5 rounded-full hover:bg-white/15 active:bg-white/25 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[18px] font-semibold flex items-center gap-2 tracking-tight">
          <Crown size={20} className="text-yellow-200 drop-shadow" />
          Premium
        </h1>
      </div>

      <div className="flex-grow overflow-y-auto pt-16 pb-32 no-scrollbar">
        {/* HERO */}
        <div className="px-4">
          <Hero
            isPremium={isPremium}
            premiumExpiry={premiumExpiry}
            themeColor={themeColor}
          />
        </div>

        {/* TABS */}
        <div className="px-4 mt-5 mb-3">
          <div
            className={`grid grid-cols-2 rounded-2xl p-1 ${
              isDarkMode ? 'bg-white/5' : 'bg-gray-200/60'
            }`}
          >
            {(['features', 'compare'] as const).map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative py-2 text-[14px] font-semibold rounded-xl transition-colors ${
                    active
                      ? 'text-white'
                      : isDarkMode
                      ? 'text-gray-300'
                      : 'text-gray-700'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="premium-tab"
                      className="absolute inset-0 rounded-xl shadow"
                      style={{ backgroundColor: themeColor }}
                      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                    />
                  )}
                  <span className="relative z-10">
                    {t === 'features' ? 'Возможности' : 'Сравнение'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB CONTENT */}
        <AnimatePresence mode="wait">
          {tab === 'features' ? (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="px-4 space-y-2.5"
            >
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.25 }}
                  className={`relative rounded-2xl p-4 border shadow-sm ${cardBg} ${borderColor} ${
                    f.highlight && !isDarkMode
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50'
                      : ''
                  } ${f.highlight && isDarkMode ? 'ring-1 ring-purple-500/30' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      className="shrink-0 mt-0.5"
                      animate={
                        f.highlight
                          ? { scale: [1, 1.08, 1], rotate: [0, -4, 4, 0] }
                          : undefined
                      }
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {f.icon}
                    </motion.div>
                    <div className="flex-grow min-w-0">
                      <h4 className={`text-[15.5px] font-semibold ${textPrimary}`}>
                        {f.title}
                      </h4>
                      <p className={`text-[13.5px] leading-snug mt-0.5 ${textSecondary}`}>
                        {f.description}
                      </p>
                    </div>
                    {isPremium && (
                      <Check size={18} className="text-emerald-500 shrink-0 mt-1" />
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="compare"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="px-4"
            >
              <div className={`rounded-2xl overflow-hidden border ${cardBg} ${borderColor} shadow-sm`}>
                <div
                  className={`grid grid-cols-3 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide ${
                    isDarkMode
                      ? 'bg-white/5 text-gray-400'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  <div>Функция</div>
                  <div className="text-center">Free</div>
                  <div className="text-center">Premium</div>
                </div>
                {COMPARISON.map((row, i) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-3 px-4 py-3 text-[13.5px] items-center ${
                      i < COMPARISON.length - 1
                        ? isDarkMode
                          ? 'border-b border-white/5'
                          : 'border-b border-gray-100'
                        : ''
                    }`}
                  >
                    <div className={textPrimary}>{row.label}</div>
                    <div className={`text-center ${textSecondary}`}>{row.free}</div>
                    <div
                      className="text-center font-semibold"
                      style={{ color: themeColor }}
                    >
                      {row.premium}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium emojis */}
        <PremiumEmojisSection isPremium={isPremium} />

        {/* AI limits */}
        <div className="px-4 mt-2 mb-4">
          <div
            className={`rounded-2xl p-4 border ${
              isDarkMode
                ? 'bg-blue-500/5 border-blue-500/20'
                : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <Bot size={22} className="text-blue-500 shrink-0 mt-0.5" />
              <div className="flex-grow">
                <h3 className={`text-[15.5px] font-semibold mb-2 ${textPrimary}`}>
                  Лимиты ИИ-помощника
                </h3>
                <div className="space-y-1.5 text-[13.5px]">
                  <Pair
                    label="Free"
                    value="1 запрос в день"
                    isDarkMode={isDarkMode}
                  />
                  <Pair
                    label="Premium"
                    value="5 запросов в день"
                    isDarkMode={isDarkMode}
                    accentColor={themeColor}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms */}
        <p className={`px-6 text-[11.5px] text-center leading-relaxed ${textSecondary}`}>
          Premium активируется вручную после оплаты через бота. Подписка не списывается
          автоматически. Отменить можно в любой момент через поддержку.
        </p>
      </div>

      {/* Bottom action */}
      <div
        className={`absolute bottom-0 inset-x-0 p-4 border-t ${
          isDarkMode ? 'bg-[#0f0f0f] border-white/5' : 'bg-white border-gray-100'
        }`}
      >
        {isPremium ? (
          <button
            disabled
            className="w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 opacity-90"
            style={{
              background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`,
            }}
          >
            <Check size={20} />
            <span>Premium активен</span>
          </button>
        ) : (
          <ShinyButton
            onClick={purchasePremium}
            variant="premium"
            className="w-full rounded-2xl"
          >
            {purchasing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Создаём заявку...</span>
              </>
            ) : (
              <>
                <Crown size={20} />
                <span>Купить Premium за {PREMIUM_PRICE_RUB} ₽</span>
                <Sparkles size={18} />
              </>
            )}
          </ShinyButton>
        )}
      </div>

      {/* Success modal */}
      <AnimatePresence>
        {successRequest && (
          <SuccessModal
            requestId={successRequest.id}
            themeColor={themeColor}
            isDarkMode={isDarkMode}
            onClose={() => {
              setSuccessRequest(null);
              setView('menu');
            }}
            onCopy={copy}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-24 px-4 py-2 rounded-full text-[13px] font-medium shadow-lg z-50 bg-black/85 text-white"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ====================================================================
// Hero card
// ====================================================================

function Hero({
  isPremium,
  premiumExpiry,
  themeColor,
}: {
  isPremium: boolean;
  premiumExpiry: Date | null;
  themeColor: string;
}) {
  const gradient = isPremium
    ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #ef4444 100%)'
    : `linear-gradient(135deg, ${themeColor}, #a855f7 60%, #ec4899)`;

  const days = premiumExpiry ? getDaysLeft(premiumExpiry) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="relative rounded-3xl overflow-hidden text-white p-6 shadow-xl"
      style={{ background: gradient }}
    >
      {/* sparkle bg */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(14)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${(i * 17 + 5) % 100}%`,
              top: `${(i * 23 + 11) % 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              rotate: [0, 180],
            }}
            transition={{
              duration: 2.4 + (i % 4) * 0.3,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          >
            <Sparkles size={12} className="text-white/70" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 flex items-start gap-4">
        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="text-[44px] leading-none drop-shadow-lg select-none"
          aria-hidden
        >
          👑
        </motion.div>
        <div className="flex-grow min-w-0">
          <h2 className="text-[22px] font-extrabold leading-tight tracking-tight">
            HouseGram Premium
          </h2>
          <p className="text-[13.5px] text-white/85 mt-0.5">
            {isPremium
              ? 'Подписка активна. Спасибо за поддержку!'
              : 'Расширь возможности мессенджера'}
          </p>
        </div>
      </div>

      {isPremium && premiumExpiry ? (
        <div className="relative z-10 mt-4 rounded-2xl bg-white/15 backdrop-blur-sm p-3.5">
          <div className="flex items-center justify-between text-[14px]">
            <span className="text-white/85">Действует до</span>
            <span className="font-semibold">{formatExpiry(premiumExpiry)}</span>
          </div>
          {days !== null && (
            <div className="flex items-center justify-between text-[14px] mt-1.5">
              <span className="text-white/85">Осталось</span>
              <span className="font-semibold">
                {days} {pluralDays(days)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative z-10 mt-4 rounded-2xl bg-white/15 backdrop-blur-sm p-3.5 flex items-baseline justify-between">
          <span className="text-[14px] text-white/85">Стоимость</span>
          <span className="text-[22px] font-extrabold tracking-tight">
            {PREMIUM_PRICE_RUB} ₽<span className="text-[13px] font-medium opacity-80">/мес</span>
          </span>
        </div>
      )}
    </motion.div>
  );
}

function pluralDays(n: number) {
  const m = n % 100;
  if (m >= 11 && m <= 14) return 'дней';
  const u = n % 10;
  if (u === 1) return 'день';
  if (u >= 2 && u <= 4) return 'дня';
  return 'дней';
}

// ====================================================================
// Success modal — показываем после создания заявки
// ====================================================================

function SuccessModal({
  requestId,
  themeColor,
  isDarkMode,
  onClose,
  onCopy,
}: {
  requestId: string;
  themeColor: string;
  isDarkMode: boolean;
  onClose: () => void;
  onCopy: (text: string, label: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full sm:w-[min(92vw,420px)] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl ${
          isDarkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'
        }`}
      >
        <div
          className="relative px-6 pt-6 pb-5 text-white text-center overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${themeColor}, #a855f7 60%, #ec4899)`,
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            className="text-[56px] leading-none mb-2 drop-shadow-lg"
            aria-hidden
          >
            👑
          </motion.div>
          <h3 className="text-[20px] font-extrabold tracking-tight">
            Заявка создана!
          </h3>
          <p className="text-[13.5px] text-white/90 mt-1">
            Напиши боту, чтобы активировать Premium
          </p>
        </div>

        <div className="px-5 py-4 space-y-3">
          <CopyRow
            label="Бот"
            value={PREMIUM_BOT}
            onCopy={() => onCopy(PREMIUM_BOT, 'Имя бота')}
            isDarkMode={isDarkMode}
          />
          <CopyRow
            label="ID заявки"
            value={requestId}
            onCopy={() => onCopy(requestId, 'ID заявки')}
            isDarkMode={isDarkMode}
            mono
          />
          <CopyRow
            label="Текст сообщения"
            value={`Хочу купить Premium за ${PREMIUM_PRICE_RUB}₽ #${requestId}`}
            onCopy={() =>
              onCopy(
                `Хочу купить Premium за ${PREMIUM_PRICE_RUB}₽ #${requestId}`,
                'Текст',
              )
            }
            isDarkMode={isDarkMode}
            multiline
          />
        </div>

        <div
          className={`px-5 py-4 border-t ${
            isDarkMode ? 'border-white/10' : 'border-gray-100'
          }`}
        >
          <button
            onClick={onClose}
            className="w-full text-white rounded-2xl py-3 text-[15px] font-semibold shadow"
            style={{
              background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`,
            }}
          >
            Понятно
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CopyRow({
  label,
  value,
  onCopy,
  isDarkMode,
  mono,
  multiline,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  isDarkMode: boolean;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <button
      onClick={onCopy}
      className={`w-full rounded-xl p-3 flex items-start gap-3 text-left transition-colors ${
        isDarkMode
          ? 'bg-white/5 hover:bg-white/10'
          : 'bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <div className="flex-grow min-w-0">
        <div
          className={`text-[11px] font-semibold uppercase tracking-wider ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          {label}
        </div>
        <div
          className={`text-[14px] font-medium mt-0.5 ${
            mono ? 'font-mono' : ''
          } ${multiline ? 'whitespace-normal break-words' : 'truncate'} ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          {value}
        </div>
      </div>
      <Copy
        size={16}
        className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
      />
    </button>
  );
}

function Pair({
  label,
  value,
  isDarkMode,
  accentColor,
}: {
  label: string;
  value: string;
  isDarkMode: boolean;
  accentColor?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
        {label}:
      </span>
      <span
        className="font-semibold"
        style={accentColor ? { color: accentColor } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
