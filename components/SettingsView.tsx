'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Search, MoreVertical, Camera, Bell, Lock, Database, MessageCircle, Layers, User, Check, ShieldCheck, BadgeCheck } from 'lucide-react';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { storage, auth } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import imageCompression from 'browser-image-compression';

export default function SettingsView() {
  const { setView, themeColor, isGlassEnabled, setIsGlassEnabled, userProfile, setUserProfile } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState(userProfile);
  const [isUploading, setIsUploading] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProfile = isEditing ? editProfile : userProfile;

  const handleSave = () => {
    if (!editProfile.name.trim()) {
      alert('Имя не может быть пустым');
      return;
    }
    setUserProfile(editProfile);
    setIsEditing(false);
  };

  const getStatusText = () => {
    if (userProfile.status === 'online') return 'в сети';
    if (userProfile.lastSeen) {
      try {
        let date;
        if (userProfile.lastSeen.toDate) {
          date = userProfile.lastSeen.toDate();
        } else if (userProfile.lastSeen instanceof Date) {
          date = userProfile.lastSeen;
        } else {
          date = new Date(userProfile.lastSeen);
        }
        const distance = formatDistanceToNow(date, { addSuffix: true, locale: ru });
        if (distance === 'меньше минуты назад') {
          return 'был(а) только что';
        }
        return `был(а) ${distance}`;
      } catch (e) {
        return 'был(а) недавно';
      }
    }
    return 'был(а) недавно';
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && auth.currentUser) {
      setIsUploading(true);
      try {
        const options = {
          maxSizeMB: 0.5, // 500 KB max
          maxWidthOrHeight: 800,
          useWebWorker: false
        };
        const compressedFile = await imageCompression(file, options);
        
        const storageRef = ref(storage, `avatars/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, compressedFile);
        const avatarUrl = await getDownloadURL(storageRef);
        
        setEditProfile({ ...editProfile, avatarUrl });
        setUserProfile({ ...editProfile, avatarUrl });
        setIsUploading(false);
      } catch (error) {
        console.error("Error uploading avatar:", error);
        setIsUploading(false);
        alert('Ошибка при загрузке аватара');
      }
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-white flex flex-col z-20"
    >
      {/* Header */}
      <div 
        className="text-white px-2.5 h-14 flex items-center gap-4 shrink-0 relative z-30"
        style={{ backgroundColor: themeColor }}
      >
        <button onClick={() => setView('menu')} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow text-[18px] font-medium">Настройки</div>
        {isEditing ? (
          <button onClick={handleSave} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
            <Check size={24} />
          </button>
        ) : (
          <>
            <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
              <Search size={24} />
            </button>
            <div className="relative">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                <MoreVertical size={24} />
              </button>
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50 text-black">
                    <button 
                      onClick={() => { setIsEditing(true); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-[15px]"
                    >
                      Изменить
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Profile Info Area */}
      <div 
        className="text-white px-6 pb-6 pt-2 relative shrink-0"
        style={{ backgroundColor: themeColor }}
      >
        <div className="flex items-center gap-4">
          <div className="w-[72px] h-[72px] rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-3xl font-medium overflow-hidden relative">
            {currentProfile.avatarUrl ? (
              <Image src={currentProfile.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
              <User size={40} className="text-white" fill="currentColor" />
            )}
          </div>
          <div className="flex flex-col flex-grow">
            {isEditing ? (
              <input 
                type="text" 
                value={editProfile.name}
                onChange={e => setEditProfile({...editProfile, name: e.target.value})}
                maxLength={45}
                className="bg-white/20 text-white placeholder-white/50 border-none outline-none rounded px-2 py-1 text-[20px] font-medium w-full"
                placeholder="Имя"
              />
            ) : (
              <div className="text-[24px] font-medium leading-tight flex items-center gap-1">
                {userProfile.name}
                {userProfile.isOfficial && <BadgeCheck size={24} className="text-white fill-blue-500" />}
              </div>
            )}
            <div className="text-[14px] text-white/70 mt-1">{getStatusText()}</div>
          </div>
        </div>
        
        {/* Floating Camera Button */}
        {isEditing && (
          <>
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
              className="absolute -bottom-7 right-6 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors border border-gray-100 z-10"
            >
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Camera size={28} strokeWidth={1.5} />
              )}
            </button>
          </>
        )}
      </div>

      <div className="flex-grow overflow-y-auto pt-4 pb-10 no-scrollbar bg-white">
        {/* Account Section */}
        <div className="px-4 py-2">
          <div className="text-[15px] font-medium mb-2" style={{ color: themeColor }}>Аккаунт</div>
          
          <div className="py-2.5 border-b border-gray-100">
            {isEditing ? (
              <input 
                type="text" 
                value={editProfile.username.startsWith('@') ? editProfile.username : '@' + editProfile.username}
                onChange={e => {
                  let val = e.target.value;
                  if (!val.startsWith('@')) val = '@' + val.replace(/@/g, '');
                  setEditProfile({...editProfile, username: val});
                }}
                maxLength={15}
                className="w-full text-[16px] text-black outline-none border-b border-blue-300 pb-1"
                placeholder="Имя пользователя"
              />
            ) : (
              <div className="text-[16px] text-black">{userProfile.username}</div>
            )}
            <div className="text-[13px] text-gray-500 mt-1">Имя пользователя</div>
          </div>
          
          <div className="py-2.5 border-b border-gray-100">
            {isEditing ? (
              <input 
                type="text" 
                value={editProfile.bio}
                onChange={e => setEditProfile({...editProfile, bio: e.target.value})}
                maxLength={50}
                className="w-full text-[16px] text-black outline-none border-b border-blue-300 pb-1"
                placeholder="О себе"
              />
            ) : (
              <div className="text-[16px] text-black">{userProfile.bio}</div>
            )}
            <div className="text-[13px] text-gray-500 mt-1">О себе</div>
          </div>
        </div>

        <div className="h-2 bg-gray-100 w-full my-2"></div>

        {/* Settings Section */}
        <div className="px-4 py-2">
          <div className="text-[15px] font-medium mb-2" style={{ color: themeColor }}>Настройки</div>
          
          <SettingsItem 
            icon={<Bell size={24} />} 
            text="Уведомления и звуки" 
            onClick={() => setView('notifications')} 
          />
          <SettingsItem 
            icon={<Lock size={24} />} 
            text="Конфиденциальность" 
            onClick={() => setView('security')} 
          />
          <SettingsItem icon={<Database size={24} />} text="Данные и память" soon />
          <SettingsItem 
            icon={<MessageCircle size={24} />} 
            text="Настройки чата" 
            onClick={() => setView('chat-settings')} 
          />
          <SettingsItem 
            icon={<ShieldCheck size={24} />} 
            text="Правила и политика конфиденциальности" 
            onClick={() => setView('privacy')} 
          />
          <div 
            className="flex items-center py-3 gap-5 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsGlassEnabled(!isGlassEnabled)}
          >
            <div className="text-gray-500"><Layers size={24} /></div>
            <span className="text-[16px] text-black flex-grow">Стеклянный дизайн</span>
            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isGlassEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isGlassEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SettingsItem({ icon, text, onClick, soon }: { icon: React.ReactNode; text: string; onClick?: () => void; soon?: boolean }) {
  return (
    <div 
      className={`flex items-center py-3 gap-5 transition-colors ${soon ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
      onClick={!soon ? onClick : undefined}
    >
      <div className="text-gray-500">{icon}</div>
      <span className="text-[16px] text-black flex-grow">{text}</span>
      {soon && (
        <div className="flex items-center gap-1 text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-md">
          <span>soon!</span>
          <Lock size={12} />
        </div>
      )}
    </div>
  );
}
