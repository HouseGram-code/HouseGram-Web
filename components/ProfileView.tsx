'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Camera, User, Check, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { auth, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProfileView() {
  const { setView, userProfile, themeColor, updateProfile } = useChat();
  const [name, setName] = useState(userProfile?.name || '');
  const [username, setUsername] = useState(userProfile?.username || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateProfile({ name, username, bio });
    setView('settings');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      updateProfile({ avatarUrl: url });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Ошибка при загрузке аватара');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-tg-bg-light flex flex-col z-30"
    >
      <div 
        className="text-tg-header-text px-3 h-12 flex items-center gap-4 shrink-0"
        style={{ backgroundColor: themeColor }}
      >
        <button 
          onClick={() => setView('settings')} 
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow text-[17px] font-medium">Редактировать профиль</div>
        <button 
          onClick={handleSave}
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <Check size={24} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        <div className="flex justify-center mt-4 mb-6">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 overflow-hidden">
              {userProfile?.avatarUrl ? (
                <Image src={userProfile.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
              ) : (
                <User size={48} />
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleAvatarUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900 hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 rounded-xl shadow-sm border border-gray-100 dark:border-tg-divider overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-tg-divider">
            <label className="block text-xs font-medium text-blue-500 mb-1">Имя</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-tg-text-primary text-[16px]"
              placeholder="Ваше имя"
            />
          </div>
          <div className="p-4 border-b border-gray-100 dark:border-tg-divider">
            <label className="block text-xs font-medium text-blue-500 mb-1">Имя пользователя</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-tg-text-primary text-[16px]"
              placeholder="@username"
            />
          </div>
          <div className="p-4">
            <label className="block text-xs font-medium text-blue-500 mb-1">О себе</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-tg-text-primary text-[16px] resize-none h-20"
              placeholder="Расскажите немного о себе"
            />
          </div>
        </div>
        
        <p className="text-sm text-tg-secondary-text px-2">
          Любые подробности, такие как возраст, род занятий или город.
          Пример: 23 года, дизайнер из Санкт-Петербурга.
        </p>
      </div>
    </motion.div>
  );
}
