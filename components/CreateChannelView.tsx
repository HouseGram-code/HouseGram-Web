'use client';

import { useChat } from '@/context/ChatContext';
import { ArrowLeft, Camera } from 'lucide-react';
import { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';

export default function CreateChannelView() {
  const { setView, themeColor } = useChat();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreate = async () => {
    if (!name.trim() || !auth.currentUser) return;
    
    setIsCreating(true);
    
    try {
      const channelId = `channel_${Date.now()}`;
      const inviteCode = generateInviteCode();
      const link = `https://house-gram-site.vercel.app/join/${inviteCode}`;
      
      const channelData = {
        id: channelId,
        name: name.trim(),
        description: description.trim() || '',
        avatarUrl: avatarUrl.trim() || '',
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        subscribersCount: 1,
        link,
        inviteCode,
        subscribers: [auth.currentUser.uid]
      };
      
      await setDoc(doc(db, 'channels', channelId), channelData);
      
      // Create invite link document
      await setDoc(doc(db, 'invites', inviteCode), {
        channelId,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid
      });

      alert('Канал успешно создан!');
      setView('menu');
    } catch (error: any) {
      console.error('Failed to create channel:', error);
      alert(`Ошибка при создании канала: ${error.message || 'Неизвестная ошибка'}\nКод: ${error.code || 'unknown'}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-white z-30 flex flex-col">
      <div 
        className="flex items-center gap-4 p-4 text-white transition-colors"
        style={{ backgroundColor: themeColor }}
      >
        <button onClick={() => setView('menu')} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-medium">Новый канал</h1>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-2">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
              <Camera size={32} className="text-gray-400" />
            )}
          </div>
          <input
            type="text"
            placeholder="URL аватарки (необязательно)"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="text-sm text-center text-gray-600 border-b border-gray-300 focus:border-blue-500 outline-none px-2 py-1 w-64"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название канала <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название"
              maxLength={50}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание (необязательно)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Расскажите о вашем канале"
              maxLength={200}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleCreate}
          disabled={!name.trim() || isCreating}
          className="w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            backgroundColor: name.trim() && !isCreating ? themeColor : '#ccc',
            color: 'white'
          }}
        >
          {isCreating ? 'Создание...' : 'Создать канал'}
        </button>
      </div>
    </div>
  );
}
