'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Gift, Zap, AlertCircle, Sparkles, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ReceivedGift {
  id: string;
  giftId: string;
  name: string;
  emoji: string;
  cost: number;
  from: string;
  fromName: string;
  receivedAt: string;
  canConvert: boolean;
}

export default function MyGiftsView() {
  const { setView, themeColor, currentUser } = useChat();
  const [gifts, setGifts] = useState<ReceivedGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<ReceivedGift | null>(null);

  useEffect(() => {
    loadReceivedGifts();
  }, []);

  const loadReceivedGifts = async () => {
    if (!currentUser?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('received_gifts')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('received_at', { ascending: false });
      
      if (error) {
        console.error('Error loading gifts:', error);
        throw error;
      }
      
      const loadedGifts: ReceivedGift[] = (data || []).map(item => ({
        id: item.id,
        giftId: item.gift_id,
        name: item.name,
        emoji: item.emoji,
        cost: item.cost,
        from: item.from_user_id,
        fromName: item.from_name,
        receivedAt: item.received_at,
        canConvert: item.can_convert !== false
      }));
      
      setGifts(loadedGifts);
    } catch (e) {
      console.error('Failed to load gifts:', e);
    } finally {
      setLoading(false);
    }
  };

  const convertGiftToStars = async (gift: ReceivedGift) => {
    if (!currentUser?.id || !gift.canConvert) return;
    
    setConverting(gift.id);
    
    try {
      // Комиссия 2%
      const commission = Math.ceil(gift.cost * 0.02);
      const starsToAdd = gift.cost - commission;
      
      // Получаем текущий баланс
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('stars')
        .eq('id', currentUser.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentStars = userData?.stars || 100;
      
      // Обновляем баланс пользователя
      const { error: updateError } = await supabase
        .from('users')
        .update({ stars: currentStars + starsToAdd })
        .eq('id', currentUser.id);
      
      if (updateError) throw updateError;
      
      // Удаляем подарок из коллекции
      const { error: deleteError } = await supabase
        .from('received_gifts')
        .delete()
        .eq('id', gift.id);
      
      if (deleteError) throw deleteError;
      
      // Обновляем локальное состояние
      setGifts(prev => prev.filter(g => g.id !== gift.id));
      setShowConfirm(null);
      
      // Показываем уведомление
      alert(`✨ Подарок обменян!\n\nПолучено: ${starsToAdd} ⚡\nКомиссия (2%): ${commission} ⚡`);
    } catch (e) {
      console.error('Failed to convert gift:', e);
      alert('Ошибка при обмене подарка');
    } finally {
      setConverting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const calculateConversion = (cost: number) => {
    const commission = Math.ceil(cost * 0.02);
    const result = cost - commission;
    return { result, commission };
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
          onClick={() => setView('settings')}
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[18px] font-medium">Мои подарки</h1>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : gifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Gift size={40} className="text-gray-400" />
            </div>
            <h3 className="text-[17px] font-medium text-gray-900 mb-2">Пока нет подарков</h3>
            <p className="text-[14px] text-gray-500 leading-relaxed">
              Когда вам отправят подарок, он появится здесь. Вы сможете обменять его на молнии!
            </p>
          </div>
        ) : (
          <>
            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <Sparkles size={20} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-[15px] font-medium text-gray-900 mb-1">Обмен подарков</h3>
                  <p className="text-[14px] text-gray-600 leading-relaxed">
                    Обменивайте полученные подарки на молнии с комиссией 2%. Молнии можно использовать для отправки новых подарков!
                  </p>
                </div>
              </div>
            </div>

            {/* Gifts List */}
            <div className="space-y-3">
              {gifts.map((gift) => {
                const { result, commission } = calculateConversion(gift.cost);
                
                return (
                  <motion.div
                    key={gift.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      {/* Gift Emoji */}
                      <div className="text-5xl shrink-0">{gift.emoji}</div>
                      
                      {/* Gift Info */}
                      <div className="flex-grow min-w-0">
                        <h3 className="text-[16px] font-medium text-gray-900 mb-1">{gift.name}</h3>
                        <p className="text-[14px] text-gray-500 mb-2">
                          От: <span className="font-medium text-gray-700">{gift.fromName}</span>
                        </p>
                        <div className="flex items-center gap-2 text-[13px] text-gray-400 mb-3">
                          <span>{formatDate(gift.receivedAt)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            {gift.cost} <Zap size={12} className="text-yellow-500" fill="currentColor" />
                          </span>
                        </div>
                        
                        {/* Convert Button */}
                        {gift.canConvert ? (
                          <button
                            onClick={() => setShowConfirm(gift)}
                            disabled={converting === gift.id}
                            className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {converting === gift.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Обмен...
                              </>
                            ) : (
                              <>
                                <TrendingUp size={16} />
                                Обменять на {result} ⚡
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="w-full bg-gray-100 text-gray-400 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2">
                            <AlertCircle size={16} />
                            Обмен недоступен
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(null)}
              className="absolute inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[320px] bg-white rounded-3xl p-6 z-50 shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{showConfirm.emoji}</div>
                <h3 className="text-[18px] font-semibold text-gray-900 mb-2">
                  Обменять подарок?
                </h3>
                <p className="text-[14px] text-gray-600 mb-4">
                  {showConfirm.name}
                </p>
                
                {/* Conversion Details */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-4 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[14px] text-gray-600">Стоимость подарка</span>
                    <span className="text-[15px] font-medium text-gray-900 flex items-center gap-1">
                      {showConfirm.cost} <Zap size={14} className="text-yellow-500" fill="currentColor" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[14px] text-gray-600">Комиссия (2%)</span>
                    <span className="text-[15px] font-medium text-red-500 flex items-center gap-1">
                      -{calculateConversion(showConfirm.cost).commission} <Zap size={14} className="text-yellow-500" fill="currentColor" />
                    </span>
                  </div>
                  <div className="h-px bg-gray-200 my-2"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-medium text-gray-900">Вы получите</span>
                    <span className="text-[17px] font-bold text-green-500 flex items-center gap-1">
                      +{calculateConversion(showConfirm.cost).result} <Zap size={16} className="text-yellow-500" fill="currentColor" />
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => convertGiftToStars(showConfirm)}
                  disabled={converting === showConfirm.id}
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {converting === showConfirm.id ? 'Обмен...' : 'Обменять'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
