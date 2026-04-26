'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Star, Zap, Check, Crown, MessageSquare, Bot, Sparkles, Shield, Clock, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import ShinyButton from './ShinyButton';

interface PremiumFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    icon: <Bot size={24} className="text-purple-500" />,
    title: "5 запросов к ИИ в день",
    description: "Вместо 1 запроса для обычных пользователей",
    highlight: true
  },
  {
    icon: <Star size={24} className="text-yellow-500" fill="currentColor" />,
    title: "Премиум значок",
    description: "Красная и черная звездочка как в Telegram",
    highlight: true
  },
  {
    icon: <MessageSquare size={24} className="text-blue-500" />,
    title: "Приоритетная поддержка",
    description: "Быстрые ответы от службы поддержки"
  },
  {
    icon: <Sparkles size={24} className="text-pink-500" />,
    title: "Эксклюзивные функции",
    description: "Доступ к новым возможностям первыми"
  },
  {
    icon: <Shield size={24} className="text-green-500" />,
    title: "Расширенная приватность",
    description: "Дополнительные настройки конфиденциальности"
  }
];

export default function PremiumView() {
  const { setView, themeColor, userProfile } = useChat();
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiry, setPremiumExpiry] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadPremiumStatus();
  }, []);

  const loadPremiumStatus = async () => {
    if (!auth.currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const premium = data.premium || false;
        const expiry = data.premiumExpiry;
        
        setIsPremium(premium);
        if (expiry) {
          const expiryDate = expiry.toDate ? expiry.toDate() : new Date(expiry);
          setPremiumExpiry(expiryDate);
          
          // Проверяем не истек ли премиум
          if (expiryDate < new Date() && premium) {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
              premium: false,
              premiumExpiry: null
            });
            setIsPremium(false);
            setPremiumExpiry(null);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load premium status:', e);
    } finally {
      setLoading(false);
    }
  };

  const purchasePremium = async () => {
    if (!auth.currentUser) return;
    
    setPurchasing(true);
    
    try {
      // Создаем заявку на покупку премиума
      const requestRef = await addDoc(collection(db, 'premium_requests'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        userName: userProfile.name,
        price: 299,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      alert(`Заявка на Premium создана!\n\nНапишите боту @HouseGramBot:\n"Хочу купить Premium за 299₽"\n\nID заявки: ${requestRef.id.slice(0, 8)}`);
      setView('menu');
    } catch (error) {
      console.error('Premium purchase error:', error);
      alert('Ошибка при создании заявки на Premium');
    } finally {
      setPurchasing(false);
    }
  };

  const formatExpiryDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDaysLeft = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <div className="absolute inset-0 bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-gray-50 flex flex-col z-10"
    >
      {/* Header */}
      <div
        className="text-white px-2.5 h-12 flex items-center gap-2.5 shrink-0"
        style={{ backgroundColor: themeColor }}
      >
        <button
          onClick={() => setView('settings')}
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[18px] font-medium flex items-center gap-2">
          <Crown size={20} />
          HouseGram Premium
        </h1>
      </div>

      <div className="flex-grow overflow-y-auto">
        {/* Premium Status */}
        {isPremium ? (
          <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 text-white p-6 m-4 rounded-3xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <Star size={32} className="text-yellow-300" fill="currentColor" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h2 className="text-[20px] font-bold">Premium активен!</h2>
                <p className="text-white/90 text-[14px]">
                  Вы премиум пользователь HouseGram
                </p>
              </div>
            </div>
            
            {premiumExpiry && (
              <div className="bg-white/20 rounded-xl p-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-white/90">Действует до:</span>
                  <span className="text-[16px] font-semibold">
                    {formatExpiryDate(premiumExpiry)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[14px] text-white/90">Осталось дней:</span>
                  <span className="text-[16px] font-semibold">
                    {getDaysLeft(premiumExpiry)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white p-6 m-4 rounded-3xl">
            <div className="flex items-center gap-3 mb-3">
              <Crown size={32} className="text-yellow-300" />
              <div>
                <h2 className="text-[20px] font-bold">HouseGram Premium</h2>
                <p className="text-white/90 text-[14px]">
                  Расширьте возможности мессенджера
                </p>
              </div>
            </div>
            
            <div className="bg-white/20 rounded-xl p-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-semibold">Стоимость:</span>
                <span className="text-[20px] font-bold">299 ₽/мес</span>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="px-4 mb-6">
          <h3 className="text-[18px] font-bold text-gray-900 mb-4">
            Возможности Premium
          </h3>
          
          <div className="space-y-3">
            {PREMIUM_FEATURES.map((feature, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-4 shadow-sm border ${
                  feature.highlight ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {feature.icon}
                  </div>
                  <div className="flex-grow">
                    <h4 className="text-[16px] font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-[14px] text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  {isPremium && (
                    <Check size={20} className="text-green-500 shrink-0 mt-0.5" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Usage Info */}
        <div className="px-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Bot size={24} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-[16px] font-semibold text-gray-900 mb-2">
                  Лимиты ИИ помощника
                </h3>
                <div className="space-y-2 text-[14px]">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Обычные пользователи:</span>
                    <span className="font-semibold text-gray-900">1 запрос/день</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Premium пользователи:</span>
                    <span className="font-semibold text-purple-600">5 запросов/день</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Badge Info */}
        <div className="px-4 mb-6">
          <div className="bg-gradient-to-br from-yellow-50 to-red-50 border border-yellow-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Star size={24} className="text-yellow-500 shrink-0 mt-0.5" fill="currentColor" />
              <div>
                <h3 className="text-[16px] font-semibold text-gray-900 mb-2">
                  Премиум значок
                </h3>
                <p className="text-[14px] text-gray-600 leading-relaxed mb-3">
                  Получите красивый значок рядом с именем, как в Telegram Premium. 
                  Другие пользователи смогут увидеть ваш статус и узнать больше о Premium при нажатии на звездочку.
                </p>
                <div className="flex items-center gap-2 text-[14px]">
                  <span className="text-gray-700">Пример:</span>
                  <span className="font-semibold text-gray-900">Ваше Имя</span>
                  <div className="relative">
                    <Star size={16} className="text-yellow-500" fill="currentColor" />
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="px-4 mb-6">
          <p className="text-[12px] text-gray-500 text-center leading-relaxed">
            Premium подписка продлевается автоматически каждый месяц. 
            Вы можете отменить подписку в любое время через поддержку.
          </p>
        </div>
      </div>

      {/* Bottom Button */}
      {!isPremium && (
        <div className="p-4 bg-white border-t border-gray-100">
          <ShinyButton
            onClick={purchasePremium}
            variant="premium"
            className="w-full rounded-2xl"
          >
            {purchasing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Обработка...</span>
              </>
            ) : (
              <>
                <Crown size={20} />
                <span>Купить Premium за 299 ₽</span>
                <Sparkles size={18} />
              </>
            )}
          </ShinyButton>
        </div>
      )}
    </motion.div>
  );
}