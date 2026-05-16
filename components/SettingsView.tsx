'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Camera, Bell, Lock, Database, MessageCircle, Layers, User, Check, ShieldCheck, BadgeCheck, Info, Server, Zap, Gift, Calendar, Moon, Sun, Palette, Globe, Pencil, X, ChevronRight, Crown, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { storage, auth, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import imageCompression from 'browser-image-compression';
import FounderBadge from './FounderBadge';

const colorThemes = [
  { id: 'blue', name: 'Синий', color: '#3B82F6', bg: 'bg-blue-500' },
  { id: 'green', name: 'Зеленый', color: '#22C55E', bg: 'bg-green-500' },
  { id: 'red', name: 'Красный', color: '#EF4444', bg: 'bg-red-500' },
  { id: 'purple', name: 'Фиолетовый', color: '#A855F7', bg: 'bg-purple-500' },
  { id: 'orange', name: 'Оранжевый', color: '#F97316', bg: 'bg-orange-500' },
  { id: 'cyan', name: 'Голубой', color: '#06B6D4', bg: 'bg-cyan-500' },
  { id: 'pink', name: 'Розовый', color: '#EC4899', bg: 'bg-pink-500' },
  { id: 'amber', name: 'Желтый', color: '#F59E0B', bg: 'bg-amber-500' },
];

export default function SettingsView() {
  const { setView, themeColor, wallpaper, isGlassEnabled, setIsGlassEnabled, userProfile, setUserProfile, user, isDarkMode, setIsDarkMode, setThemeColor, isPremium, premiumExpiry, aiRequestsToday, maxAiRequests } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState(userProfile);
  const [isUploading, setIsUploading] = useState(false);
  const [accountStats, setAccountStats] = useState({ messages: 0, chats: 0, days: 0 });
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [storageSize, setStorageSize] = useState('...');
  const [sessionSize, setSessionSize] = useState('...');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProfile = isEditing ? editProfile : userProfile;

  useEffect(() => {
    loadAccountStats();
  }, [user]);

  const loadAccountStats = async () => {
    if (!auth.currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const createdAt = data.createdAt?.toDate() || new Date();
        const daysSinceCreation = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        
        // Подсчет чатов
        const chatsQuery = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', auth.currentUser.uid)
        );
        const chatsSnapshot = await getDocs(chatsQuery);
        
        setAccountStats({
          messages: 0, // Можно добавить подсчет сообщений
          chats: chatsSnapshot.size,
          days: daysSinceCreation || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

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
        } else if (typeof userProfile.lastSeen === 'number' || typeof userProfile.lastSeen === 'string') {
          date = new Date(userProfile.lastSeen);
        } else {
          // FieldValue или неизвестный тип - показываем "недавно"
          return 'был(а) недавно';
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

  useEffect(() => {
    const fmt = (b: number) => b > 1048576 ? `${(b/1048576).toFixed(1)} МБ` : `${Math.round(b/1024)} КБ`;
    try {
      let ls = 0;
      for (const k in localStorage) if (Object.prototype.hasOwnProperty.call(localStorage,k)) ls += (localStorage[k].length+k.length)*2;
      let ss = 0;
      for (const k in sessionStorage) if (Object.prototype.hasOwnProperty.call(sessionStorage,k)) ss += (sessionStorage[k].length+k.length)*2;
      setStorageSize(fmt(ls)); setSessionSize(fmt(ss));
    } catch { setStorageSize('Н/Д'); setSessionSize('Н/Д'); }
  }, [showDataModal]);

  const clearCache = () => {
    try {
      const keep: Record<string,string> = {};
      ['housegram_theme','housegram_dark','housegram_glass','housegram_loader_shown'].forEach(k=>{ const v=localStorage.getItem(k); if(v) keep[k]=v; });
      localStorage.clear(); sessionStorage.clear();
      Object.entries(keep).forEach(([k,v])=>localStorage.setItem(k,v));
      setStorageSize('0 КБ'); setSessionSize('0 КБ');
    } catch(e) { console.error(e); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && auth.currentUser) {
      setIsUploading(true);
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 800,
          useWebWorker: false
        };
        const compressedFile = await imageCompression(file, options);

        // Загружаем в Firebase Storage вместо base64 в Firestore
        const storageRef = ref(storage, `avatars/${auth.currentUser.uid}/${Date.now()}_avatar.jpg`);
        const snapshot = await uploadBytes(storageRef, compressedFile);
        const downloadURL = await getDownloadURL(snapshot.ref);

        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          avatarUrl: downloadURL
        });
        setEditProfile({ ...editProfile, avatarUrl: downloadURL });
        setUserProfile({ ...editProfile, avatarUrl: downloadURL });
      } catch (error) {
        console.error('Error uploading avatar:', error);
        alert('Ошибка при загрузке аватара');
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`absolute inset-0 flex flex-col z-20 ${isDarkMode ? 'bg-[#0f0f0f] text-white' : 'bg-white text-black'}`}
    >
      {/* Header */}
      <div 
        className="text-white px-3 h-14 flex items-center gap-3 shrink-0 sticky top-0 z-30"
        style={{ backgroundColor: themeColor }}
      >
        <button onClick={() => setView('menu')} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 transition-all">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-grow text-[18px] font-semibold tracking-tight">Настройки</div>
        {isEditing && (
          <button onClick={handleSave} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-[14px] font-medium px-4 py-1.5 rounded-full transition-all">
            <Check size={16} />
            Сохранить
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className={`flex-grow overflow-y-auto no-scrollbar ${isDarkMode ? 'bg-[#0f0f0f]' : 'bg-[#f2f2f7]'}`}>
        {/* Profile Header — centered card style */}
        <div 
          className="text-white px-6 pt-10 pb-7 relative flex flex-col items-center overflow-hidden"
          style={{ background: `linear-gradient(155deg, ${themeColor} 0%, ${themeColor}dd 60%, ${themeColor}99 100%)` }}
        >
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute top-16 -left-8 w-32 h-32 rounded-full bg-white/8 blur-2xl pointer-events-none" />

          {/* File input */}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />

          {/* Avatar */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white/30 shadow-2xl relative" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              {currentProfile.avatarUrl ? (
                <Image src={currentProfile.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={44} className="text-white/90" />
                </div>
              )}
            </div>
            {/* Camera overlay button */}
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 transition-all hover:scale-110 active:scale-95"
                style={{ borderColor: themeColor }}
              >
                {isUploading
                  ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  : <Camera size={15} className="text-gray-500" strokeWidth={2} />}
              </button>
            )}
          </div>

          {/* Name */}
          {isEditing ? (
            <input
              type="text"
              value={editProfile.name}
              onChange={e => setEditProfile({...editProfile, name: e.target.value})}
              maxLength={45}
              className="bg-white/20 text-white text-center text-[20px] font-bold placeholder-white/50 outline-none rounded-2xl px-4 py-1.5 mb-1 w-full max-w-xs"
              placeholder="Имя"
            />
          ) : (
            <h1 className="text-[22px] font-bold text-center flex items-center gap-1.5 mb-0.5">
              <span>{userProfile.name}</span>
              {userProfile.isFounder && <FounderBadge size={24} />}
              {userProfile.isOfficial && !userProfile.isFounder && <BadgeCheck size={20} className="text-white fill-blue-400" />}
            </h1>
          )}

          {/* Username */}
          {userProfile.username && (
            <div className="text-[13px] text-white/70 font-medium mb-0.5">
              {userProfile.username.startsWith('@') ? userProfile.username : `@${userProfile.username}`}
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
            <span className="text-[12px] text-white/65">{getStatusText()}</span>
          </div>

          {/* Action buttons */}
          {isEditing ? (
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-white text-[14px] font-semibold px-5 py-2 rounded-full shadow transition-all hover:scale-[1.02] active:scale-[0.97]"
                style={{ color: themeColor }}
              >
                <Check size={16} /> Сохранить
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-[14px] font-medium px-4 py-2 rounded-full transition-all"
              >
                <X size={16} /> Отмена
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-4 flex items-center gap-2 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-[14px] font-medium px-5 py-2 rounded-full transition-all"
            >
              <Pencil size={14} />
              Редактировать профиль
            </button>
          )}
        </div>

        <div className={`pt-5 pb-10 ${isDarkMode ? 'bg-[#0f0f0f]' : 'bg-[#f2f2f7]'}`}>
        {/* Account edit fields — only when editing */}
        {isEditing && (
          <div className={`mx-4 mb-4 rounded-2xl overflow-hidden shadow-sm ${isDarkMode ? 'bg-[#1c1c1d] border border-[#2c2c2e]' : 'bg-white'}`}>
            <div className="px-4 pt-4 pb-3">
              <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Имя пользователя</div>
              <input
                type="text"
                value={editProfile.username.startsWith('@') ? editProfile.username : '@' + editProfile.username}
                onChange={e => {
                  let val = e.target.value;
                  if (!val.startsWith('@')) val = '@' + val.replace(/@/g, '');
                  val = val.replace(/[^@a-zA-Z0-9_]/g, '');
                  setEditProfile({...editProfile, username: val});
                }}
                maxLength={16}
                className={`w-full text-[16px] font-medium outline-none rounded-xl px-3 py-2.5 ${isDarkMode ? 'text-white bg-white/8 placeholder-gray-500' : 'text-gray-900 bg-gray-50 placeholder-gray-400'}`}
                placeholder="@username"
              />
              <div className={`text-[11px] mt-1.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Только A-Z, 0-9 и _  •  {editProfile.username.length}/16</div>
            </div>
            <div className={`border-t ${isDarkMode ? 'border-[#2c2c2e]' : 'border-gray-100'} px-4 pt-4 pb-3`}>
              <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>О себе</div>
              <textarea
                value={editProfile.bio}
                onChange={e => setEditProfile({...editProfile, bio: e.target.value})}
                maxLength={70}
                rows={3}
                className={`w-full text-[15px] outline-none rounded-xl px-3 py-2.5 resize-none ${isDarkMode ? 'text-white bg-white/8 placeholder-gray-500' : 'text-gray-900 bg-gray-50 placeholder-gray-400'}`}
                placeholder="Расскажите о себе…"
              />
              <div className={`text-[11px] mt-1 text-right ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{editProfile.bio.length}/70</div>
            </div>
          </div>
        )}
        {/* Read-only profile info */}
        {!isEditing && (
          <div className={`mx-4 mb-4 rounded-2xl overflow-hidden shadow-sm ${isDarkMode ? 'bg-[#1c1c1d] border border-[#2c2c2e]' : 'bg-white'}`}>
            <InfoRow label="Имя пользователя" value={userProfile.username || '—'} isDarkMode={isDarkMode} />
            <InfoRow label="О себе" value={userProfile.bio || 'Не указано'} isDarkMode={isDarkMode} border />
          </div>
        )}

        {/* Account Stats — спокойный блок, без плавающих шаров и вращательных
            иконок. По стилю близко к Telegram Premium бэннеру. */}
        {!isEditing && (
          <div
            className={`px-4 py-3 mx-4 my-3 rounded-2xl ${isDarkMode ? 'bg-[#1c1c1d] border border-[#2c2c2e]' : 'bg-gray-50'}`}
          >
            <div className={`text-[12px] font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Статистика</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-[22px] font-semibold tabular-nums" style={{ color: themeColor }}>{accountStats.chats}</div>
                <div className={`text-[11px] font-medium mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Чатов</div>
              </div>
              <div className="text-center">
                <div className="text-[22px] font-semibold tabular-nums" style={{ color: themeColor }}>{accountStats.days}</div>
                <div className={`text-[11px] font-medium mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Дней</div>
              </div>
              <div className="text-center">
                <div className="text-[22px] font-semibold tabular-nums" style={{ color: themeColor }}>{userProfile.giftsSent || 0}</div>
                <div className={`text-[11px] font-medium mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Подарков</div>
              </div>
            </div>
            <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-[#2c2c2e]' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[12px] font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>ИИ запросы сегодня</span>
                <span
                  className={`text-[13px] font-semibold tabular-nums ${aiRequestsToday >= maxAiRequests ? 'text-red-500' : isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
                >
                  {aiRequestsToday}/{maxAiRequests}
                </span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#2c2c2e]' : 'bg-gray-200'}`}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: aiRequestsToday >= maxAiRequests ? '#ef4444' : themeColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((aiRequestsToday / maxAiRequests) * 100, 100)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              {!isPremium && aiRequestsToday >= maxAiRequests && (
                <p className={`text-[11px] mt-1.5 ${isDarkMode ? 'text-red-400' : 'text-red-600'} font-medium`}>
                  Лимит исчерпан. Premium: 5 запросов/день.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Chat Settings Feature Card ── */}
        {!isEditing && (
          <div className="px-4 pt-2">
            <SLabel text="Настройки чата" dark={isDarkMode} />
            <motion.div
              className={`rounded-2xl overflow-hidden shadow-sm cursor-pointer active:opacity-80 ${isDarkMode ? 'bg-[#1c1c1d] border border-[#2c2c2e]' : 'bg-white'}`}
              onClick={() => setView('chat-settings')}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.005 }}
            >
              {/* Live wallpaper preview with fake bubbles */}
              <div
                className="h-[80px] relative overflow-hidden flex items-end px-3 pb-2.5"
                style={{
                  background: wallpaper
                    ? wallpaper.startsWith('http') ? `url(${wallpaper}) center/cover` : wallpaper
                    : `linear-gradient(135deg, ${themeColor}30 0%, ${themeColor}18 100%)`,
                }}
              >
                <div className="absolute inset-0 bg-black/5" />
                <div className="flex flex-col gap-1.5 w-full relative z-10">
                  <div className="self-start bg-white/90 dark:bg-white/80 rounded-2xl rounded-bl-sm px-2.5 py-1 max-w-[55%] shadow">
                    <div className="text-[11px] text-gray-800 font-medium">Привет! 👋</div>
                  </div>
                  <div className="self-end px-2.5 py-1 max-w-[55%] rounded-2xl rounded-br-sm shadow" style={{ backgroundColor: themeColor }}>
                    <div className="text-[11px] text-white font-medium">Как дела? 😊</div>
                  </div>
                </div>
                {/* Change background badge */}
                <div className="absolute top-2 right-2 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                  <span className="text-[10px] text-white font-medium">Оформление</span>
                </div>
              </div>
              {/* Action row */}
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: '#6366f1' }}>
                  <MessageCircle size={18} className="text-white" />
                </div>
                <div className="flex-grow">
                  <div className={`text-[15px] font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Фон, обои и тема</div>
                  <div className={`text-[13px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Обои, цвета, пузыри, ночной режим</div>
                </div>
                <ChevronRight size={18} className={isDarkMode ? 'text-gray-600' : 'text-gray-300'} />
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Settings ── */}
        <div className="px-4 pt-2 pb-6">
          <SLabel text="Персонализация" dark={isDarkMode} />
          <SGroup dark={isDarkMode}>
            <div
              className={`flex items-center px-4 py-3 gap-3 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
              onClick={() => setShowThemeSelector(!showThemeSelector)}
            >
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: themeColor }}>
                <Palette size={18} className="text-white" />
              </div>
              <div className="flex-grow">
                <div className={`text-[15px] font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Цветовая тема</div>
                <div className={`text-[13px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{colorThemes.find(t => t.color === themeColor)?.name || 'Синий'}</div>
              </div>
              <motion.div animate={{ rotate: showThemeSelector ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight size={16} className={isDarkMode ? 'text-gray-600' : 'text-gray-300'} />
              </motion.div>
            </div>
            
            {/* Color Theme Selector */}
            <AnimatePresence>
              {showThemeSelector && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`overflow-hidden border-t ${isDarkMode ? 'border-[#2c2c2e]' : 'border-gray-100'}`}
                >
                  <div className="px-4 py-4 grid grid-cols-4 gap-3">
                    {colorThemes.map((theme) => (
                      <motion.button
                        key={theme.id}
                        onClick={() => { setThemeColor(theme.color); if (auth.currentUser) updateDoc(doc(db,'users',auth.currentUser.uid),{themeColor:theme.color}).catch(console.error); }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.94 }}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div
                          className={`w-11 h-11 rounded-xl ${theme.bg} flex items-center justify-center shadow-md transition-all ${themeColor === theme.color ? 'ring-2 ring-offset-2' : ''}`}
                          style={themeColor === theme.color ? { '--tw-ring-color': theme.color } as React.CSSProperties : {}}
                        >
                          {themeColor === theme.color && <Check size={20} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className={`text-[10px] font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{theme.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <SItemD dark={isDarkMode} />
            <div
              onClick={() => setView('premium')}
              className={`flex items-center px-4 py-3 gap-3 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
            >
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)' }}>
                <Crown size={18} className="text-white" />
              </div>
              <div className="flex-grow">
                <div className={`text-[15px] font-medium flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  HouseGram Premium
                  {isPremium && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}>Активен</span>}
                </div>
                <div className={`text-[13px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isPremium && premiumExpiry ? `До ${premiumExpiry.toLocaleDateString('ru-RU')}` : 'Эксклюзивные возможности'}
                </div>
              </div>
              <ChevronRight size={16} className={isDarkMode ? 'text-gray-600' : 'text-gray-300'} />
            </div>
            
            <SItemD dark={isDarkMode} />
            <SI dark={isDarkMode} iconBg="#f59e0b" icon={<Zap size={18} className="text-white" />} text="Молнии" sub="Баланс и подарки" onClick={() => setView('stars')} />
            <SItemD dark={isDarkMode} />
            <SI dark={isDarkMode} iconBg="#ec4899" icon={<Gift size={18} className="text-white" />} text="Мои подарки" sub="Полученные подарки" onClick={() => setView('my-gifts')} />
            <SItemD dark={isDarkMode} />
            <SI dark={isDarkMode} iconBg="#8b5cf6" icon={<Calendar size={18} className="text-white" />} text="Мои истории" sub="Просмотр и управление" onClick={() => setView('my-stories')} />
          </SGroup>

          <SLabel text="Приватность" dark={isDarkMode} />
          <SGroup dark={isDarkMode}>
            <SI dark={isDarkMode} iconBg="#ef4444" icon={<Bell size={18} className="text-white" />} text="Уведомления и звуки" onClick={() => setView('notifications')} />
            <SItemD dark={isDarkMode} />
            <SI dark={isDarkMode} iconBg="#6366f1" icon={<Lock size={18} className="text-white" />} text="Конфиденциальность" onClick={() => setView('privacy-settings')} />
            <SItemD dark={isDarkMode} />
            <SI dark={isDarkMode} iconBg="#22c55e" icon={<ShieldCheck size={18} className="text-white" />} text="Безопасность" onClick={() => setView('security')} />
          </SGroup>

          <SLabel text="Данные" dark={isDarkMode} />
          <SGroup dark={isDarkMode}>
            <SI dark={isDarkMode} iconBg="#475569" icon={<Database size={18} className="text-white" />} text="Данные и память" sub={`Кэш: ${storageSize}`} onClick={() => setShowDataModal(true)} />
            <SItemD dark={isDarkMode} />
            <SI dark={isDarkMode} iconBg="#6366f1" icon={<MessageCircle size={18} className="text-white" />} text="Настройки чата" onClick={() => setView('chat-settings')} />
          </SGroup>

          <SLabel text="Подключение" dark={isDarkMode} />
          <SGroup dark={isDarkMode}>
            <SI dark={isDarkMode} iconBg="#3b82f6" icon={<Globe size={18} className="text-white" />} text="Прокси" sub="Обход блокировок" onClick={() => setView('proxy')} />
          </SGroup>

          <SLabel text="Информация" dark={isDarkMode} />
          <SGroup dark={isDarkMode}>
            <SI dark={isDarkMode} iconBg="#06b6d4" icon={<Server size={18} className="text-white" />} text="Статус сервера" onClick={() => setView('server-status')} />
            <SItemD dark={isDarkMode} />
            <SI dark={isDarkMode} iconBg="#f97316" icon={<Info size={18} className="text-white" />} text="Правила и политика" onClick={() => setView('privacy')} />
            <SItemD dark={isDarkMode} />
            <SI dark={isDarkMode} iconBg="#14b8a6" icon={<Info size={18} className="text-white" />} text="О приложении" onClick={() => setView('info')} />
          </SGroup>


          <SLabel text="Интерфейс" dark={isDarkMode} />
          <SGroup dark={isDarkMode}>
            <div className={`flex items-center px-4 py-3 gap-3 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`} onClick={() => setIsDarkMode(!isDarkMode)}>
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: isDarkMode ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#fbbf24,#f97316)' }}>
                <AnimatePresence mode="wait">
                  {isDarkMode
                    ? <motion.div key="moon" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Moon size={18} className="text-white" fill="white" /></motion.div>
                    : <motion.div key="sun" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Sun size={18} className="text-white" /></motion.div>
                  }
                </AnimatePresence>
              </div>
              <div className="flex-grow">
                <div className={`text-[15px] font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{isDarkMode ? 'Тёмная тема' : 'Светлая тема'}</div>
                <div className={`text-[13px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{isDarkMode ? 'Комфорт для глаз' : 'Яркий интерфейс'}</div>
              </div>
              <div className={`relative w-12 h-7 rounded-full transition-colors duration-300 shrink-0 ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all duration-300 ${isDarkMode ? 'left-[calc(100%-26px)]' : 'left-0.5'}`} />
              </div>
            </div>
            <SItemD dark={isDarkMode} />
            <div className={`flex items-center px-4 py-3 gap-3 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`} onClick={() => setIsGlassEnabled(!isGlassEnabled)}>
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}>
                <Layers size={18} className="text-white" />
              </div>
              <div className="flex-grow">
                <div className={`text-[15px] font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Стеклянный дизайн</div>
                <div className={`text-[13px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{isGlassEnabled ? 'Эффект размытия включен' : 'Классический стиль'}</div>
              </div>
              <div className={`relative w-12 h-7 rounded-full transition-colors duration-300 shrink-0 ${isGlassEnabled ? 'bg-cyan-500' : 'bg-gray-200'}`}>
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all duration-300 ${isGlassEnabled ? 'left-[calc(100%-26px)]' : 'left-0.5'}`} />
              </div>
            </div>
          </SGroup>

        </div>
        </div>
      </div>
      {/* ── Data & Storage Modal ── */}
      <AnimatePresence>
        {showDataModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-end z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowDataModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className={`w-full rounded-t-3xl p-6 ${isDarkMode ? 'bg-[#141418]' : 'bg-white'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }} />
              <h3 className={`text-[20px] font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>💾 Данные и память</h3>
              <div className={`rounded-2xl overflow-hidden mb-4 ${isDarkMode ? 'bg-[#1c1c1d]' : 'bg-gray-50'}`}>
                <div className="px-4 py-3.5 flex items-center justify-between">
                  <span className={`text-[15px] ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Кэш приложения</span>
                  <span className="text-[15px] font-semibold" style={{ color: themeColor }}>{storageSize}</span>
                </div>
                <div className={`px-4 py-3.5 flex items-center justify-between border-t ${isDarkMode ? 'border-[#2c2c2e]' : 'border-gray-100'}`}>
                  <span className={`text-[15px] ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Хранилище сессии</span>
                  <span className={`text-[15px] font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{sessionSize}</span>
                </div>
                <div className={`px-4 py-3.5 flex items-center justify-between border-t ${isDarkMode ? 'border-[#2c2c2e]' : 'border-gray-100'}`}>
                  <span className={`text-[15px] ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Автозагрузка медиа</span>
                  <span className={`text-[13px] font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Wi-Fi и данные</span>
                </div>
              </div>
              <motion.button onClick={clearCache} whileTap={{ scale: 0.97 }} className="w-full py-3.5 rounded-2xl font-semibold text-[16px] text-white mb-3 flex items-center justify-center gap-2" style={{ backgroundColor: '#ef4444' }}>
                <Trash2 size={18} /> Очистить кэш
              </motion.button>
              <button onClick={() => setShowDataModal(false)} className={`w-full py-3 rounded-2xl text-[15px] font-medium transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                Закрыть
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InfoRow({ label, value, isDarkMode, border }: { label: string; value: string; isDarkMode?: boolean; border?: boolean }) {
  const dark = isDarkMode || false;
  return (
    <div className={`px-4 py-3 ${border ? `border-t ${dark ? 'border-[#2c2c2e]' : 'border-gray-100'}` : ''}`}>
      <div className={`text-[13px] mb-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</div>
      <div className={`text-[15px] font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{value}</div>
    </div>
  );
}

function SLabel({ text, dark }: { text: string; dark: boolean }) {
  return <div className={`text-[11px] font-bold uppercase tracking-widest px-1 pt-4 pb-1.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{text}</div>;
}

function SGroup({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  return <div className={`${dark ? 'bg-[#1c1c1d] border border-[#2c2c2e]' : 'bg-white'} rounded-2xl overflow-hidden mb-1 shadow-sm`}>{children}</div>;
}

function SItemD({ dark }: { dark: boolean }) {
  return <div className={`mx-4 h-px ${dark ? 'bg-[#2c2c2e]' : 'bg-gray-100'}`} />;
}

function SI({ dark, iconBg, icon, text, sub, onClick }: { dark: boolean; iconBg: string; icon: React.ReactNode; text: string; sub?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center px-4 py-3 gap-3 cursor-pointer transition-colors active:opacity-70 ${dark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
    >
      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="flex-grow min-w-0">
        <div className={`text-[15px] font-medium truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{text}</div>
        {sub && <div className={`text-[13px] truncate mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{sub}</div>}
      </div>
      <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor" className={`shrink-0 ${dark ? 'text-gray-600' : 'text-gray-300'}`}>
        <path d="M7.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z" />
      </svg>
    </div>
  );
}
