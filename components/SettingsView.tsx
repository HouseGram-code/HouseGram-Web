'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, MoreVertical, Camera, Bell, Lock, Database, MessageCircle, Layers, User, Check, ShieldCheck, BadgeCheck, Info, Server, Zap, Gift, TrendingUp, Calendar, MessageSquare, Moon, Sun, Palette, Globe } from 'lucide-react';
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
  const { setView, themeColor, isGlassEnabled, setIsGlassEnabled, userProfile, setUserProfile, user, isDarkMode, setIsDarkMode, setThemeColor, isPremium, premiumExpiry, aiRequestsToday, maxAiRequests } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState(userProfile);
  const [isUploading, setIsUploading] = useState(false);
  const [accountStats, setAccountStats] = useState({ messages: 0, chats: 0, days: 0 });
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
                  <div className={`absolute right-0 top-full mt-1 w-48 rounded-md shadow-lg py-1 z-50 ${isDarkMode ? 'bg-[#1c1c1d]' : 'bg-white'}`}>
                    <button 
                      onClick={() => { setIsEditing(true); setIsMenuOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-[15px] ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-black'}`}
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
      <div className={`flex-grow overflow-y-auto no-scrollbar ${isDarkMode ? 'bg-[#0f0f0f]' : 'bg-white'}`}>
        {/* Profile Info Area */}
        <div 
          className="text-white px-6 pb-6 pt-2 relative"
          style={{ backgroundColor: themeColor }}
        >
          <div className="flex items-center gap-4">
            <div className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-3xl font-medium overflow-hidden relative ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-500'}`}>
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
                  {userProfile.isFounder && <FounderBadge size={28} />}
                  {userProfile.isOfficial && !userProfile.isFounder && <BadgeCheck size={24} className="text-white fill-blue-500" />}
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

        <div className={`pt-4 pb-10 ${isDarkMode ? 'bg-[#0f0f0f]' : 'bg-white'}`}>
        {/* Account Section */}
        <div className="px-4 py-2">
          <div className="text-[15px] font-medium mb-2" style={{ color: themeColor }}>Аккаунт</div>
          
          <div className={`py-2.5 border-b ${isDarkMode ? 'border-[#2c2c2e]' : 'border-gray-100'}`}>
            {isEditing ? (
              <div>
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
                  className={`w-full text-[16px] outline-none border-b pb-1 ${isDarkMode ? 'text-white border-[#2c2c2e] bg-[#0f0f0f]' : 'text-black border-blue-300'}`}
                  placeholder="@username"
                />
                <div className="flex justify-between items-center mt-1">
                  <div className={`text-[12px] ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Только английские буквы, цифры и _</div>
                  <div className={`text-[11px] ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>{editProfile.username.length}/16</div>
                </div>
              </div>
            ) : (
              <div className={`text-[16px] ${isDarkMode ? 'text-white' : 'text-black'}`}>{userProfile.username}</div>
            )}
            <div className={`text-[13px] mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Имя пользователя</div>
          </div>
          
          <div className={`py-2.5 border-b ${isDarkMode ? 'border-[#2c2c2e]' : 'border-gray-100'}`}>
            {isEditing ? (
              <div>
                <textarea 
                  value={editProfile.bio}
                  onChange={e => setEditProfile({...editProfile, bio: e.target.value})}
                  maxLength={70}
                  rows={2}
                  className={`w-full text-[16px] outline-none border-b pb-1 resize-none ${isDarkMode ? 'text-white border-[#2c2c2e] bg-[#0f0f0f]' : 'text-black border-blue-300'}`}
                  placeholder="О себе"
                />
                <div className="flex justify-between items-center mt-1">
                  <div className={`text-[12px] ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Расскажите о себе</div>
                  <div className={`text-[11px] ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>{editProfile.bio.length}/70</div>
                </div>
              </div>
            ) : (
              <div className={`text-[16px] ${isDarkMode ? 'text-white' : 'text-black'}`}>{userProfile.bio || 'Не указано'}</div>
            )}
            <div className={`text-[13px] mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>О себе</div>
          </div>
        </div>

        {/* Account Stats */}
        {!isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-4 py-4 mx-4 my-3 rounded-3xl relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}
          >
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-20 h-20 rounded-full ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-200/30'}`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.6, 0.3],
                    x: [0, Math.random() * 50 - 25, 0],
                    y: [0, Math.random() * 50 - 25, 0],
                  }}
                  transition={{
                    duration: 3 + i,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <TrendingUp size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                </motion.div>
                <span className={`text-[14px] font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Статистика аккаунта</span>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-3">
                <motion.div 
                  className={`text-center p-3 rounded-2xl ${isDarkMode ? 'bg-blue-500/10' : 'bg-white/60'} backdrop-blur-sm`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <motion.div 
                    className={`text-[24px] font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  >
                    {accountStats.chats}
                  </motion.div>
                  <div className={`text-[11px] font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Чатов</div>
                </motion.div>
                
                <motion.div 
                  className={`text-center p-3 rounded-2xl ${isDarkMode ? 'bg-purple-500/10' : 'bg-white/60'} backdrop-blur-sm`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <motion.div 
                    className={`text-[24px] font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  >
                    {accountStats.days}
                  </motion.div>
                  <div className={`text-[11px] font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Дней</div>
                </motion.div>
                
                <motion.div 
                  className={`text-center p-3 rounded-2xl ${isDarkMode ? 'bg-pink-500/10' : 'bg-white/60'} backdrop-blur-sm`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <motion.div 
                    className={`text-[24px] font-bold ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                  >
                    {userProfile.giftsSent || 0}
                  </motion.div>
                  <div className={`text-[11px] font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Подарков</div>
                </motion.div>
              </div>
              
              {/* AI Usage */}
              <motion.div 
                className={`pt-3 border-t ${isDarkMode ? 'border-gray-700/50' : 'border-blue-200/50'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[12px] font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>ИИ запросы сегодня:</span>
                  <motion.span 
                    className={`text-[15px] font-bold ${aiRequestsToday >= maxAiRequests ? 'text-red-500' : isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                    key={aiRequestsToday}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {aiRequestsToday}/{maxAiRequests}
                  </motion.span>
                </div>
                <div className={`w-full h-2.5 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'} overflow-hidden`}>
                  <motion.div 
                    className={`h-2.5 rounded-full ${aiRequestsToday >= maxAiRequests ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((aiRequestsToday / maxAiRequests) * 100, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                {!isPremium && aiRequestsToday >= maxAiRequests && (
                  <motion.p 
                    className={`text-[10px] mt-1.5 ${isDarkMode ? 'text-red-400' : 'text-red-600'} font-medium`}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    ⚠️ Лимит исчерпан. Premium: 5 запросов/день
                  </motion.p>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}

        <div className={`h-2 ${isDarkMode ? 'bg-tg-divider' : 'bg-gray-100'} w-full my-2`}></div>

        {/* Settings Section */}
        <div className="px-4 py-2">
          <div className={`text-[15px] font-medium mb-3 uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Настройки</div>
          
          {/* Группа: Персонализация */}
          <div className={`${isDarkMode ? 'bg-[#1c1c1d] border border-[#2c2c2e]' : 'bg-white'} rounded-2xl overflow-hidden mb-3 shadow-sm`}>
            {/* Цветовая тема */}
            <div
              className={`flex items-center px-4 py-3.5 gap-4 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-gray-50 active:bg-gray-100'}`}
              onClick={() => setShowThemeSelector(!showThemeSelector)}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor }}>
                <Palette size={18} className="text-white" />
              </div>
              <div className="flex-grow">
                <div className={`text-[16px] font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Цветовая тема</div>
                <div className={`text-[13px] mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {colorThemes.find(t => t.color === themeColor)?.name || 'Синий'}
                </div>
              </div>
              <motion.div
                animate={{ rotate: showThemeSelector ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
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
                  <div className="px-4 py-3 grid grid-cols-4 gap-3">
                    {colorThemes.map((theme) => (
                      <motion.button
                        key={theme.id}
                        onClick={() => {
                          setThemeColor(theme.color);
                          if (auth.currentUser) {
                            updateDoc(doc(db, 'users', auth.currentUser.uid), {
                              themeColor: theme.color
                            }).catch(console.error);
                          }
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative"
                      >
                        <div
                          className={`w-full aspect-square rounded-full ${theme.bg} shadow-lg transition-all ${
                            themeColor === theme.color ? 'ring-4 ring-offset-2 ring-offset-white' : ''
                          }`}
                          style={{ 
                            '--tw-ring-color': theme.color,
                          } as React.CSSProperties}
                        >
                          {themeColor === theme.color && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <Check size={20} className="text-white" strokeWidth={3} />
                            </motion.div>
                          )}
                        </div>
                        <div className={`text-[11px] mt-1 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {theme.name}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className={`border-t ${isDarkMode ? 'border-[#2c2c2e]' : 'border-gray-100'}`}>
              {/* HouseGram Premium */}
              <div 
                onClick={() => setView('premium')}
                className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${isDarkMode ? 'active:bg-white/5' : 'active:bg-gray-50'}`}
              >
                <div className="relative">
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2L14.09 8.26L20 10L14.09 11.74L12 18L9.91 11.74L4 10L9.91 8.26L12 2Z"
                        fill="url(#premium-gradient)"
                      />
                      <defs>
                        <linearGradient id="premium-gradient" x1="4" y1="2" x2="20" y2="18">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="50%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#06B6D4" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </motion.div>
                </div>
                <div className="flex-grow">
                  <div className={`text-[16px] font-normal ${isDarkMode ? 'text-white' : 'text-black'} flex items-center gap-2`}>
                    HouseGram Premium
                    {isPremium && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full">
                        Активен
                      </span>
                    )}
                  </div>
                  <div className={`text-[13px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isPremium && premiumExpiry 
                      ? `До ${premiumExpiry.toLocaleDateString('ru-RU')}`
                      : 'Эксклюзивные возможности'
                    }
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`border-t ${isDarkMode ? 'border-[#2c2c2e]' : 'border-gray-100'}`}>
              <SettingsItem 
                icon={<Zap size={22} className="text-yellow-500" fill="currentColor" />} 
                text="Молнии" 
                subtitle="Баланс и подарки"
                onClick={() => setView('stars')}
                isDarkMode={isDarkMode}
              />
            </div>
            <div className={`border-t ${isDarkMode ? 'border-[#2c2c2e]' : 'border-gray-100'}`}>
              <SettingsItem 
                icon={<Gift size={22} className="text-pink-500" />} 
                text="Мои подарки" 
                subtitle="Полученные подарки"
                onClick={() => setView('my-gifts')} 
                isDarkMode={isDarkMode}
              />
            </div>
            <div className={`border-t ${isDarkMode ? 'border-[#2c2c2e]' : 'border-gray-100'}`}>
              <SettingsItem 
                icon={<Calendar size={22} className="text-purple-500" />} 
                text="Мои истории" 
                subtitle="Просмотр и управление"
                onClick={() => setView('my-stories')} 
                isDarkMode={isDarkMode}
              />
            </div>
          </div>

          {/* Группа: Приватность */}
          <div className={`${isDarkMode ? 'bg-[#1c1c1d] border border-[#2c2c2e]' : 'bg-white'} rounded-2xl overflow-hidden mb-3 shadow-sm`}>
            <SettingsItem 
              icon={<Bell size={22} className="text-blue-500" />} 
              text="Уведомления и звуки" 
              onClick={() => setView('notifications')}
              isDarkMode={isDarkMode}
            />
            <SettingsItem 
              icon={<Lock size={22} className="text-purple-500" />} 
              text="Конфиденциальность" 
              onClick={() => setView('privacy-settings')} 
              divider
              isDarkMode={isDarkMode}
            />
            <SettingsItem 
              icon={<ShieldCheck size={22} className="text-green-500" />} 
              text="Безопасность" 
              onClick={() => setView('security')} 
              divider
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Группа: Данные */}
          <div className={`${isDarkMode ? 'bg-[#1c1c1d] border border-[#2c2c2e]' : 'bg-white'} rounded-2xl overflow-hidden mb-3 shadow-sm`}>
            <SettingsItem 
              icon={<Database size={22} className="isDarkMode ? 'text-gray-400' : 'text-gray-500'" />} 
              text="Данные и память" 
              soon 
              isDarkMode={isDarkMode}
            />
            <SettingsItem 
              icon={<MessageCircle size={22} className="text-indigo-500" />} 
              text="Настройки чата" 
              onClick={() => setView('chat-settings')} 
              divider
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Группа: Подключение */}
          <div className={`${isDarkMode ? 'bg-[#1c1c1d] border border-[#2c2c2e]' : 'bg-white'} rounded-2xl overflow-hidden mb-3 shadow-sm`}>
            <SettingsItem 
              icon={<Globe size={22} className="text-blue-500" />} 
              text="Прокси" 
              subtitle="Обход блокировок"
              onClick={() => setView('proxy')} 
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Группа: Информация */}
          <div className={`${isDarkMode ? 'bg-[#1c1c1d] border border-[#2c2c2e]' : 'bg-white'} rounded-2xl overflow-hidden mb-3 shadow-sm`}>
            <SettingsItem 
              icon={<Server size={22} className="text-cyan-500" />} 
              text="Статус сервера" 
              onClick={() => setView('server-status')}
              isDarkMode={isDarkMode}
            />
            <SettingsItem 
              icon={<Info size={22} className="text-orange-500" />} 
              text="Правила и политика" 
              onClick={() => setView('privacy')} 
              divider
              isDarkMode={isDarkMode}
            />
            <SettingsItem 
              icon={<Info size={22} className="text-teal-500" />} 
              text="О приложении" 
              onClick={() => setView('info')} 
              divider
              isDarkMode={isDarkMode}
            />
          </div>


          {/* Темная тема */}
          <motion.div 
            className={`${isDarkMode ? 'bg-[#1c1c1d] border border-[#2c2c2e]' : 'bg-white'} rounded-2xl overflow-hidden shadow-sm mb-3`}
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div
              className={`flex items-center px-4 py-3.5 gap-4 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-gray-50 active:bg-gray-100'}`}
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              <motion.div 
                className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-yellow-400 to-orange-500'}`}
                animate={{ rotate: isDarkMode ? 0 : 360 }}
                transition={{ duration: 0.5 }}
              >
                <AnimatePresence mode="wait">
                  {isDarkMode ? (
                    <motion.div
                      key="moon"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Moon size={20} className="text-white" fill="white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="sun"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Sun size={20} className="text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <div className="flex-grow">
                <span className={`text-[16px] font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {isDarkMode ? 'Темная тема' : 'Светлая тема'}
                </span>
                <div className={`text-[13px] mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isDarkMode ? 'Комфорт для глаз' : 'Яркий интерфейс'}
                </div>
              </div>
              <motion.div 
                className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gray-300'}`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div 
                  className="w-6 h-6 rounded-full bg-white shadow-lg"
                  animate={{ x: isDarkMode ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Стеклянный дизайн */}
          <motion.div 
            className={`${isDarkMode ? 'bg-[#1c1c1d] border border-[#2c2c2e]' : 'bg-white'} rounded-2xl overflow-hidden shadow-sm`}
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div
              className={`flex items-center px-4 py-3.5 gap-4 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-gray-50 active:bg-gray-100'}`}
              onClick={() => setIsGlassEnabled(!isGlassEnabled)}
            >
              <motion.div 
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400 flex items-center justify-center"
                animate={{ 
                  boxShadow: isGlassEnabled 
                    ? ['0 0 0 0 rgba(59, 130, 246, 0.4)', '0 0 0 10px rgba(59, 130, 246, 0)', '0 0 0 0 rgba(59, 130, 246, 0)']
                    : '0 0 0 0 rgba(59, 130, 246, 0)'
                }}
                transition={{ duration: 1.5, repeat: isGlassEnabled ? Infinity : 0 }}
              >
                <Layers size={20} className="text-white" />
              </motion.div>
              <div className="flex-grow">
                <span className={`text-[16px] font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Стеклянный дизайн
                </span>
                <div className={`text-[13px] mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isGlassEnabled ? 'Эффект размытия включен' : 'Классический стиль'}
                </div>
              </div>
              <motion.div 
                className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${isGlassEnabled ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-300'}`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div 
                  className="w-6 h-6 rounded-full bg-white shadow-lg"
                  animate={{ x: isGlassEnabled ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
        </div>
      </div>
    </motion.div>
  );
}

function SettingsItem({ icon, text, subtitle, onClick, soon, divider, isDarkMode }: { icon: React.ReactNode; text: string; subtitle?: string; onClick?: () => void; soon?: boolean; divider?: boolean; isDarkMode?: boolean }) {
  const dark = isDarkMode || false;
  return (
    <div className={divider ? `border-t ${dark ? 'border-tg-divider' : 'border-gray-100'}` : ''}>
      <div 
        className={`flex items-center px-4 py-3.5 gap-4 transition-colors ${
          soon 
            ? 'opacity-50 cursor-not-allowed' 
            : `cursor-pointer ${dark ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-gray-50 active:bg-gray-100'}`
        }`}
        onClick={!soon ? onClick : undefined}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${dark ? 'bg-white/5' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
          {icon}
        </div>
        <div className="flex-grow">
          <div className={`text-[16px] font-medium ${dark ? 'text-tg-text-primary' : 'text-gray-900'}`}>{text}</div>
          {subtitle && <div className={`text-[13px] mt-0.5 ${dark ? 'text-tg-text-secondary' : 'text-gray-500'}`}>{subtitle}</div>}
        </div>
        {soon && (
          <div className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full ${dark ? 'text-tg-text-secondary bg-white/5' : 'text-gray-400 bg-gray-100'}`}>
            <span>soon!</span>
            <Lock size={10} />
          </div>
        )}
      </div>
    </div>
  );
}
