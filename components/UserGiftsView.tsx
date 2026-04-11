'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Gift, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UserGift {
  id: string;
  giftId: string;
  name: string;
  emoji: string;
  cost: number;
  receivedAt: string;
}

export default function UserGiftsView() {
  const { setView, themeColor, activeChatId, contacts } = useChat();
  const [gifts, setGifts] = useState<UserGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);

  const contact = activeChatId ? contacts[activeChatId] : null;

  useEffect(() => {
    loadUserGifts();
  }, [activeChatId]);

  const loadUserGifts = async () => {
    if (!activeChatId) return;
    
    try {
      const { data, error } = await supabase
        .from('received_gifts')
        .select('id, gift_id, name, emoji, cost, received_at')
        .eq('user_id', activeChatId)
        .order('received_at', { ascending: false });
      
      if (error) {
        console.error('Error loading user gifts:', error);
        throw error;
      }
      
      const loadedGifts: UserGift[] = (data || []).map(item => ({
        id: item.id,
        giftId: item.gift_id,
        name: item.name,
        emoji: item.emoji,
        cost: item.cost,
        receivedAt: item.received_at
      }));
      
      // Подсчитываем общую стоимость
      const total = loadedGifts.reduce((sum, gift) => sum + gift.cost, 0);
      setTotalValue(total);
      
      setGifts(loadedGifts);
    } catch (e) {
      console.error('Failed to load user gifts:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-tg-bg-light flex flex-col z-20"
    >
      {/* Header */}
      <div
        className="text-tg-header-text px-2.5 h-12 flex items-center gap-2.5 shrink-0"
        style={{ backgroundColor: themeColor }}
      >
        <button
          onClick={() => setView('profile')}
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[18px] font-medium">Подарки</h1>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : gifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Gift size={40} className="text-gray-400" />
            </div>
            <h3 className="text-[17px] font-medium text-gray-900 mb-2">Нет подарков</h3>
            <p className="text-[14px] text-gray-500 leading-relaxed">
              {contact?.name} пока не получал(а) подарков
            </p>
          </div>
        ) : (
          <>
            {/* Stats Header */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-white mb-2">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={20} />
                <span className="text-[14px] opacity-90">Коллекция подарков</span>
              </div>
              <div className="text-[32px] font-bold mb-1">{gifts.length}</div>
              <div className="text-[14px] opacity-90">
                Общая стоимость: {totalValue} ⚡
              </div>
            </div>

            {/* Gifts Grid */}
            <div className="p-4">
              <div className="grid grid-cols-3 gap-3">
                {gifts.map((gift) => (
                  <motion.div
                    key={gift.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center"
                  >
                    {/* Gift Emoji */}
                    <div className="text-5xl mb-2">{gift.emoji}</div>
                    
                    {/* Gift Name */}
                    <div className="text-[12px] text-gray-900 font-medium text-center mb-1 line-clamp-2">
                      {gift.name}
                    </div>
                    
                    {/* Gift Cost */}
                    <div className="text-[11px] text-gray-500 flex items-center gap-1">
                      {gift.cost} ⚡
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Info Card */}
            <div className="px-4 pb-4">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Gift size={20} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-[15px] font-medium text-gray-900 mb-1">О подарках</h3>
                    <p className="text-[14px] text-gray-600 leading-relaxed">
                      Это коллекция подарков, которые получил(а) {contact?.name}. Отправьте свой подарок через раздел "Молнии"!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
