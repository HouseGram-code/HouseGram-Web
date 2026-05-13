'use client';

import { useChat } from '@/context/ChatContext';
import { ArrowLeft, Link as LinkIcon, Users, Share2, Copy, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';

export default function ChannelInfoView() {
  const { setView, activeChatId, themeColor, contacts } = useChat();
  const [channelData, setChannelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChannelInfo = async () => {
      if (!activeChatId) return;
      
      const contact = contacts[activeChatId];
      if (!contact?.isChannel) {
        setView('chat');
        return;
      }

      try {
        const channelDoc = await getDoc(doc(db, 'channels', activeChatId));
        if (channelDoc.exists()) {
          setChannelData(channelDoc.data());
        }
      } catch (error) {
        console.error('Failed to load channel info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChannelInfo();
  }, [activeChatId, contacts, setView]);

  const copyLink = () => {
    if (channelData?.link) {
      navigator.clipboard.writeText(channelData.link);
      alert('Ссылка скопирована в буфер обмена!');
    }
  };

  const shareLink = async () => {
    if (!channelData?.link) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Присоединяйтесь к каналу "${channelData.name}"`,
          text: channelData.description || 'Присоединяйтесь к нашему каналу!',
          url: channelData.link
        });
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      copyLink();
    }
  };

  const openLink = () => {
    if (channelData?.link) {
      window.open(channelData.link, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="absolute inset-0 bg-white z-30 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-white z-30 flex flex-col">
      <div 
        className="flex items-center gap-4 p-4 text-white transition-colors"
        style={{ backgroundColor: themeColor }}
      >
        <button onClick={() => setView('chat')} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-medium">Информация о канале</h1>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className="flex flex-col items-center p-6 border-b border-gray-200">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-3">
            {channelData?.avatarUrl ? (
              <Image src={channelData.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
              <span className="text-3xl font-medium text-gray-600">
                {channelData?.name?.charAt(0).toUpperCase() || 'C'}
              </span>
            )}
          </div>
          <h2 className="text-xl font-medium mb-1">{channelData?.name || 'Канал'}</h2>
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <Users size={16} />
            <span>{channelData?.subscribersCount || 0} подписчиков</span>
          </div>
        </div>

        {channelData?.description && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Описание</h3>
            <p className="text-gray-800">{channelData.description}</p>
          </div>
        )}

        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Пригласительная ссылка</h3>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-3">
            <div className="flex items-center gap-3 mb-3">
              <LinkIcon size={20} className="text-blue-600" />
              <span className="text-blue-600 text-sm flex-grow truncate font-mono">
                {channelData?.link || 'Ссылка недоступна'}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={copyLink}
                className="flex flex-col items-center gap-1 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Copy size={20} className="text-gray-600" />
                <span className="text-xs text-gray-600">Копировать</span>
              </button>
              
              <button
                onClick={shareLink}
                className="flex flex-col items-center gap-1 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Share2 size={20} className="text-gray-600" />
                <span className="text-xs text-gray-600">Поделиться</span>
              </button>
              
              <button
                onClick={openLink}
                className="flex flex-col items-center gap-1 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ExternalLink size={20} className="text-gray-600" />
                <span className="text-xs text-gray-600">Открыть</span>
              </button>
            </div>
          </div>
          
          <p className="text-xs text-gray-500">
            Поделитесь этой ссылкой, чтобы пригласить людей в канал
          </p>
        </div>

        <div className="p-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">Настройки скоро...</p>
        </div>
      </div>
    </div>
  );
}
