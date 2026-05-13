'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { auth } from '@/lib/firebase';

// Пакеты молний (цены как у Telegram Stars в рублях)
const PACKAGES = [
  { count: 100,    price: 182,    icon: '⚡' },
  { count: 250,    price: 429,    icon: '⚡⚡' },
  { count: 500,    price: 849,    icon: '⚡⚡⚡' },
  { count: 1000,   price: 1679,   icon: '⚡⚡⚡⚡' },
  { count: 2500,   price: 4199,   icon: '⚡⚡⚡⚡⚡' },
  { count: 10000,  price: 16599,  icon: '⚡⚡⚡⚡⚡⚡' },
  { count: 50000,  price: 82999,  icon: '⚡⚡⚡⚡⚡⚡⚡' },
  { count: 150000, price: 249999, icon: '⚡⚡⚡⚡⚡⚡⚡⚡' },
];

// Дополнительные небольшие пакеты
const EXTRA_PACKAGES = [
  { count: 25,  price: 49,  icon: '⚡' },
  { count: 50,  price: 95,  icon: '⚡' },
  { count: 75,  price: 140, icon: '⚡' },
];

function formatPrice(n: number) {
  return n.toLocaleString('ru-RU') + ',00 ₽';
}

function formatCount(n: number) {
  return n.toLocaleString('ru-RU');
}

type PayMethod = 'telegram-stars' | 'freekassa' | 'yoomoney' | 'robokassa';

const PAY_METHODS: { id: PayMethod; label: string; sub: string }[] = [
  { id: 'telegram-stars', label: '⭐ Telegram Stars',  sub: 'только токен бота · без регистрации' },
  { id: 'freekassa',      label: '⚡ FreeKassa',       sub: 'СБП · Сбербанк · карта · ЮМани' },
  { id: 'yoomoney',       label: '💳 ЮМани / Карта',   sub: 'только кошелёк ЮМани' },
  { id: 'robokassa',      label: '🏦 Robokassa',        sub: 'нужны ключи магазина' },
];

export default function BuyStarsView() {
  const { setView } = useChat();
  const [selected, setSelected] = useState<{ list: 'main' | 'extra'; idx: number } | null>(null);
  const [showExtra, setShowExtra] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>('telegram-stars');
  const [showMethods, setShowMethods] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedPkg = selected
    ? (selected.list === 'main' ? PACKAGES[selected.idx] : EXTRA_PACKAGES[selected.idx])
    : null;

  const handlePay = async () => {
    if (!selectedPkg || !auth.currentUser) return;
    setLoading(true);
    setError('');
    try {
      const isTgStars = payMethod === 'telegram-stars';
      const endpoint  = isTgStars
        ? '/api/payment/telegram-stars/create'
        : '/api/payment/create';

      const body = isTgStars
        ? { stars: selectedPkg.count, userId: auth.currentUser.uid }
        : { system: payMethod, stars: selectedPkg.count, price: selectedPkg.price, userId: auth.currentUser.uid };

      const res  = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setError(data.error || 'Ошибка создания платежа');
      }
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 flex flex-col z-50"
      style={{ backgroundColor: '#1C1C1E' }}
    >
      {/* Шапка */}
      <div
        className="flex items-center px-4 h-14 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <motion.button
          onClick={() => setView('stars')}
          className="mr-3 text-white"
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeft size={22} />
        </motion.button>
        <h1 className="text-white text-[18px] font-semibold">Выберите количество</h1>
      </div>

      {/* Список пакетов */}
      <div className="flex-grow overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>

        {PACKAGES.map((pkg, i) => {
          const isSelected = selected?.list === 'main' && selected.idx === i;
          return (
            <motion.button
              key={i}
              onClick={() => setSelected({ list: 'main', idx: i })}
              className="w-full flex items-center px-5 py-4"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                backgroundColor: isSelected ? 'rgba(251,191,36,0.1)' : 'transparent',
              }}
              whileTap={{ opacity: 0.7 }}
            >
              {/* Иконка */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shrink-0 text-lg"
                style={{
                  background: isSelected
                    ? 'linear-gradient(145deg,#fde047,#f59e0b)'
                    : 'linear-gradient(145deg,#3A3A3C,#2C2C2E)',
                }}
              >
                {pkg.icon.length <= 2 ? (
                  <span className="text-2xl">⚡</span>
                ) : (
                  <span className="text-xs leading-tight text-yellow-400">{pkg.icon}</span>
                )}
              </div>

              {/* Название */}
              <span className="text-white text-[16px] font-medium flex-grow text-left">
                {formatCount(pkg.count)} молний
              </span>

              {/* Цена */}
              <span className="text-[15px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {formatPrice(pkg.price)}
              </span>
            </motion.button>
          );
        })}

        {/* Дополнительно */}
        <motion.button
          onClick={() => setShowExtra(v => !v)}
          className="w-full flex items-center px-5 py-4 gap-3"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            color: '#fbbf24',
          }}
          whileTap={{ opacity: 0.7 }}
        >
          {showExtra ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          <span className="text-[15px] font-medium">Дополнительно</span>
        </motion.button>

        {/* Скрытые пакеты */}
        <AnimatePresence>
          {showExtra && EXTRA_PACKAGES.map((pkg, i) => {
            const isSelected = selected?.list === 'extra' && selected.idx === i;
            return (
              <motion.button
                key={`extra-${i}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelected({ list: 'extra', idx: i })}
                className="w-full flex items-center px-5 py-4"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: isSelected ? 'rgba(251,191,36,0.1)' : 'transparent',
                }}
                whileTap={{ opacity: 0.7 }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shrink-0"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(145deg,#fde047,#f59e0b)'
                      : 'linear-gradient(145deg,#3A3A3C,#2C2C2E)',
                  }}
                >
                  <span className="text-2xl">⚡</span>
                </div>
                <span className="text-white text-[16px] font-medium flex-grow text-left">
                  {pkg.count} молний
                </span>
                <span className="text-[15px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {formatPrice(pkg.price)}
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {/* Условия */}
        <p className="px-5 py-5 text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Приобретая молнии, Вы принимаете{' '}
          <button
            onClick={() => setView('terms')}
            className="underline"
            style={{ color: '#f87171' }}
          >
            условия HouseGram
          </button>
          .
        </p>
      </div>

      {/* Сообщение об ошибке */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-5 pb-2 text-red-400 text-[13px] text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Нижняя секция */}
      <div className="px-4 pb-6 pt-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Переключатель метода оплаты */}
        <motion.button
          onClick={() => setShowMethods(v => !v)}
          className="w-full flex items-center justify-between py-2.5 px-1 mb-3"
          whileTap={{ opacity: 0.7 }}
        >
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
            Способ оплаты:
          </span>
          <span className="text-white text-[14px] font-medium flex items-center gap-1.5">
            {PAY_METHODS.find(m => m.id === payMethod)?.label}
            {showMethods ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </motion.button>

        <AnimatePresence>
          {showMethods && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 rounded-2xl overflow-hidden"
              style={{ backgroundColor: '#2C2C2E' }}
            >
              {PAY_METHODS.map((m) => (
                <motion.button
                  key={m.id}
                  onClick={() => { setPayMethod(m.id); setShowMethods(false); setError(''); }}
                  className="w-full flex items-center justify-between px-4 py-3.5"
                  style={{ borderBottom: m.id !== 'robokassa' ? '1px solid rgba(255,255,255,0.09)' : 'none' }}
                  whileTap={{ opacity: 0.7 }}
                >
                  <div className="text-left">
                    <div className="text-white text-[15px] font-medium">{m.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{m.sub}</div>
                  </div>
                  {payMethod === m.id && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-[10px]">✓</span>
                    </div>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Кнопка оплаты */}
        <motion.button
          onClick={selectedPkg ? handlePay : () => setView('stars')}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-semibold text-[17px] text-white transition-all disabled:opacity-60"
          style={
            selectedPkg
              ? { background: 'linear-gradient(135deg,#b91c1c,#dc2626)', boxShadow: '0 8px 24px rgba(185,28,28,0.4)' }
              : { backgroundColor: 'rgba(255,255,255,0.12)' }
          }
          whileTap={{ scale: 0.97 }}
        >
          {loading
            ? 'Создаём платёж...'
            : selectedPkg
              ? `Оплатить ${formatPrice(selectedPkg.price)}`
              : 'Закрыть'}
        </motion.button>
      </div>

      {/* Модальное окно метода оплаты (overlay) */}
      <AnimatePresence>
        {showMethods && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10"
            onClick={() => setShowMethods(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
