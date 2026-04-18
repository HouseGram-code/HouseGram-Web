'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Zap, CreditCard, Check, MessageCircle, Copy } from 'lucide-react';
import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';

// Пакеты молний как в Telegram
const STAR_PACKAGES = [
  { stars: 50, price: 99, priceUSD: 0.99, popular: false, discount: true },
  { stars: 100, price: 199, priceUSD: 1.99, popular: false },
  { stars: 250, price: 449, priceUSD: 4.49, popular: true },
  { stars: 500, price: 899, priceUSD: 8.99, popular: false },
  { stars: 1000, price: 1699, priceUSD: 16.99, popular: false },
  { stars: 2500, price: 3999, priceUSD: 39.99, popular: false },
];

export default function BuyStarsView() {
  const { setView, themeColor, userProfile } = useChat();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!auth.currentUser || selectedPackage === null) return;
    
    const pkg = STAR_PACKAGES[selectedPackage];
    setLoading(true);

    try {
      // Создаем заявку на пополнение
      const requestRef = await addDoc(collection(db, 'payment_requests'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        userName: userProfile.name,
        stars: pkg.stars,
        price: pkg.price,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      alert(`Заявка создана!\n\nНапишите боту @HouseGramBot:\n"Хочу купить ${pkg.stars} молний за ${pkg.price}₽"\n\nID заявки: ${requestRef.id.slice(0, 8)}`);
      setView('stars');
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Ошибка при создании заявки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-tg-bg-light flex flex-col z-10"
    >
      {/* Header */}
      <div
        className="text-tg-header-text px-2.5 h-12 flex items-center gap-2.5 shrink-0"
        style={{ backgroundColor: themeColor }}
      >
        <button
          onClick={() => setView('stars')}
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[18px] font-medium">Купить молнии</h1>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4">
        {/* Info Banner */}
        <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 rounded-3xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Zap size={32} fill="white" />
            <h2 className="text-[20px] font-bold">Молнии HouseGram</h2>
          </div>
          <p className="text-[15px] opacity-90 leading-relaxed">
            Покупайте молнии и отправляйте подарки друзьям! Выберите подходящий пакет ниже.
          </p>
        </div>

        {/* Packages */}
        <div className="space-y-3 mb-6">
          {STAR_PACKAGES.map((pkg, index) => (
            <motion.button
              key={index}
              onClick={() => setSelectedPackage(index)}
              whileTap={{ scale: 0.98 }}
              className={`w-full bg-white rounded-2xl p-4 shadow-sm transition-all relative overflow-hidden ${
                selectedPackage === index
                  ? 'ring-2 ring-blue-500'
                  : 'hover:shadow-md'
              }`}
            >
              {/* Discount Badge */}
              {pkg.discount && (
                <div className="absolute top-0 left-0 bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-br-xl rounded-tl-2xl shadow-lg flex items-center gap-1">
                  <Zap size={12} fill="white" />
                  СКИДКА 99₽
                </div>
              )}

              {/* Popular Badge */}
              {pkg.popular && !pkg.discount && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[11px] font-medium px-3 py-1 rounded-bl-xl rounded-tr-2xl">
                  ПОПУЛЯРНО
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Radio Button */}
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedPackage === index
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedPackage === index && (
                      <Check size={16} className="text-white" strokeWidth={3} />
                    )}
                  </div>

                  {/* Stars Count */}
                  <div className="flex items-center gap-2">
                    <Zap size={24} className="text-yellow-500" fill="currentColor" />
                    <span className="text-[20px] font-bold text-gray-900">
                      {pkg.stars}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right">
                  <div className="text-[18px] font-bold text-gray-900">
                    {pkg.price} ₽
                  </div>
                  <div className="text-[13px] text-gray-500">
                    ${pkg.priceUSD}
                  </div>
                </div>
              </div>

              {/* Price per star */}
              <div className="mt-2 text-[13px] text-gray-500 ml-9">
                {(pkg.price / pkg.stars).toFixed(2)} ₽ за молнию
              </div>
            </motion.button>
          ))}
        </div>

        {/* Payment Info */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-5 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <MessageCircle size={24} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-[16px] font-semibold text-gray-900 mb-2">
                Как купить молнии?
              </h3>
              <ol className="text-[14px] text-gray-700 leading-relaxed space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-500 shrink-0">1.</span>
                  <span>Выберите пакет молний выше</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-500 shrink-0">2.</span>
                  <span>Нажмите кнопку "Купить"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-500 shrink-0">3.</span>
                  <span>Напишите боту <span className="font-mono bg-white px-2 py-0.5 rounded text-blue-600">@HouseGramBot</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-500 shrink-0">4.</span>
                  <span>Переведите деньги на карту</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-500 shrink-0">5.</span>
                  <span>Молнии зачислятся в течение 5 минут!</span>
                </li>
              </ol>
            </div>
          </div>

          <button
            onClick={() => window.open('https://t.me/HouseGramBot', '_blank')}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <MessageCircle size={20} />
            Открыть @HouseGramBot
          </button>
        </div>

        {/* Safety Info */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <CreditCard size={20} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-[15px] font-medium text-gray-900 mb-1">
                Безопасно и быстро
              </h3>
              <p className="text-[14px] text-gray-600 leading-relaxed">
                Все платежи проверяются вручную. Мы не храним данные ваших карт. Поддержка работает 24/7.
              </p>
            </div>
          </div>
        </div>

        {/* Terms */}
        <p className="text-[12px] text-gray-500 text-center leading-relaxed px-4">
          Нажимая "Купить", вы соглашаетесь с условиями использования и политикой конфиденциальности HouseGram
        </p>
      </div>

      {/* Bottom Button */}
      <div className="p-4 bg-white border-t border-gray-100">
        <button
          onClick={handlePurchase}
          disabled={selectedPackage === null || loading}
          className={`w-full py-4 rounded-xl font-medium text-[16px] transition-all ${
            selectedPackage === null || loading
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90 active:scale-[0.98]'
          }`}
        >
          {loading ? (
            'Обработка...'
          ) : selectedPackage !== null ? (
            `Купить за ${STAR_PACKAGES[selectedPackage].price} ₽`
          ) : (
            'Выберите пакет'
          )}
        </button>
      </div>
    </motion.div>
  );
}
