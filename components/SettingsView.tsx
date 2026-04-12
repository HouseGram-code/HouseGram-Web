'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Search, MoreVertical, Camera, Bell, Lock, Database, MessageCircle, Layers, User, Check, ShieldCheck, BadgeCheck, Info, Server, Zap, Gift } from 'lucide-react';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { storage, auth, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
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

  const handleSave = async () => {
    if (!editProfile.name.trim()) {
      alert('Имя не может быть пустым');
      return;
    }
    
    // Очищаем username от недопустимых символов перед сохранением
    let cleanUsername = editProfile.username;
    if (!cleanUsername.startsWith('@')) {
      cleanUsername = '@' + cleanUsername;
    }
    // Удаляем все символы кроме английских букв, цифр и подчеркивания
    cleanUsername = cleanUsername.replace(/[^@a-zA-Z0-9_]/g, '');
    
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          name: editProfile.name,
          username: cleanUsername,
          bio: editProfile.bio,
          phone: editProfile.phone,
        });
      }
      setUserProfile({...editProfile, username: cleanUsername});
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Ошибка при сохранении профиля');
    }
  };

  const getStatusText = () => {
    if (userProfile.status === 'online') return 'в сети';
    if (userProfile.lastSeen) {
      try {
        let date;
        if (typeof userProfile.lastSeen === 'object' && 'toDate' in userProfile.lastSeen) {
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
          maxSizeMB: 0.05, // 50 KB max for base64
          maxWidthOrHeight: 400,
          useWebWorker: false
        };
        const compressedFile = await imageCompression(file, options);
        
        // Convert to base64 to bypass Firebase Storage CORS issues
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          
          try {
            await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
              avatarUrl: base64data
            });
            setEditProfile({ ...editProfile, avatarUrl: base64data });
            setUserProfile({ ...editProfile, avatarUrl: base64data });
          } catch (error) {
            console.error('Error saving avatar to Firestore:', error);
            alert('Ошибка при сохранении аватара');
          } finally {
            setIsUploading(false);
          }
        };
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
      {/* Header - Fixed */}
      <div 
        className="text-white px-2.5 h-14 flex items-center gap-4 shrink-0 sticky top-0 z-30"
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

      {/* Scrollable Content */}
      <div className="flex-grow overflow-y-auto no-scrollbar bg-white">
        {/* Profile Info Area */}
        <div 
          className="text-white px-6 pb-6 pt-2 relative"
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

        <div className="pt-4 pb-10 bg-white">
        {/* Account Section */}
        <div className="px-4 py-2">
          <div className="text-[15px] font-medium mb-2" style={{ color: themeColor }}>Аккаунт</div>
          
          <div className="py-2.5 border-b border-gray-100">
            {isEditing ? (
              <>
                <input 
                  type="text" 
                  value={editProfile.username.startsWith('@') ? editProfile.username : '@' + editProfile.username}
                  onChange={e => {
                    let val = e.target.value;
                    // Убеждаемся что начинается с @
                    if (!val.startsWith('@')) val = '@' + val.replace(/@/g, '');
                    
                    // Удаляем все недопустимые символы (оставляем только @, английские буквы, цифры и _)
                    val = val.replace(/[^@a-zA-Z0-9_]/g, '');
                    
                    // Обновляем значение
                    setEditProfile({...editProfile, username: val});
                  }}
                  maxLength={16}
                  className="w-full text-[16px] text-black outline-none border-b border-blue-300 pb-1"
                  placeholder="@username"
                />
                <div className="text-[12px] text-gray-400 mt-1">Только английские буквы, цифры и _</div>
              </>
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
          <div className="text-[15px] font-medium mb-3 text-gray-500 uppercase tracking-wide">Настройки</div>
          
          {/* Группа: Персонализация */}
          <div className="bg-white rounded-2xl overflow-hidden mb-3 shadow-sm">
            <SettingsItem 
              icon={<Zap size={22} className="text-yellow-500" fill="currentColor" />} 
              text="Молнии" 
              subtitle="Баланс и подарки"
              onClick={() => setView('stars')} 
            />
            <SettingsItem 
              icon={<Gift size={22} className="text-pink-500" />} 
              text="Мои подарки" 
              subtitle="Полученные подарки"
              onClick={() => setView('my-gifts')} 
              divider
            />
          </div>

          {/* Группа: Приватность */}
          <div className="bg-white rounded-2xl overflow-hidden mb-3 shadow-sm">
            <SettingsItem 
              icon={<Bell size={22} className="text-blue-500" />} 
              text="Уведомления и звуки" 
              onClick={() => setView('notifications')} 
            />
            <SettingsItem 
              icon={<Lock size={22} className="text-purple-500" />} 
              text="Конфиденциальность" 
              onClick={() => setView('privacy-settings')} 
              divider
            />
            <SettingsItem 
              icon={<ShieldCheck size={22} className="text-green-500" />} 
              text="Безопасность" 
              onClick={() => setView('security')} 
              divider
            />
          </div>

          {/* Группа: Данные */}
          <div className="bg-white rounded-2xl overflow-hidden mb-3 shadow-sm">
            <SettingsItem 
              icon={<Database size={22} className="text-gray-500" />} 
              text="Данные и память" 
              soon 
            />
            <SettingsItem 
              icon={<MessageCircle size={22} className="text-indigo-500" />} 
              text="Настройки чата" 
              onClick={() => setView('chat-settings')} 
              divider
            />
          </div>

          {/* Группа: Информация */}
          <div className="bg-white rounded-2xl overflow-hidden mb-3 shadow-sm">
            <SettingsItem 
              icon={<Server size={22} className="text-cyan-500" />} 
              text="Статус сервера" 
              onClick={() => setView('server-status')} 
            />
            <SettingsItem 
              icon={<Info size={22} className="text-orange-500" />} 
              text="Правила и политика" 
              onClick={() => setView('privacy')} 
              divider
            />
            <SettingsItem 
              icon={<Info size={22} className="text-teal-500" />} 
              text="О приложении" 
              onClick={() => setView('info')} 
              divider
            />
          </div>

          {/* Стеклянный дизайн */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div 
              className="flex items-center px-4 py-3.5 gap-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
              onClick={() => setIsGlassEnabled(!isGlassEnabled)}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <Layers size={18} className="text-blue-600" />
              </div>
              <span className="text-[16px] text-gray-900 flex-grow font-medium">Стеклянный дизайн</span>
              <div className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${isGlassEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${isGlassEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </motion.div>
  );
}

function SettingsItem({ icon, text, subtitle, onClick, soon, divider }: { icon: React.ReactNode; text: string; subtitle?: string; onClick?: () => void; soon?: boolean; divider?: boolean }) {
  return (
    <div className={divider ? 'border-t border-gray-100' : ''}>
      <div 
        className={`flex items-center px-4 py-3.5 gap-4 transition-colors ${
          soon 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:bg-gray-50 active:bg-gray-100'
        }`}
        onClick={!soon ? onClick : undefined}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-grow">
          <div className="text-[16px] text-gray-900 font-medium">{text}</div>
          {subtitle && <div className="text-[13px] text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
        {soon && (
          <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium bg-gray-100 px-2.5 py-1 rounded-full">
            <span>soon!</span>
            <Lock size={10} />
          </div>
        )}
      </div>
    </div>
  );
}
