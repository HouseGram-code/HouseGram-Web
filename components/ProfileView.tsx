'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Bookmark, BadgeCheck, Gift, Phone, Mail, Calendar, MessageCircle, User, Shield, Camera, MoreVertical, Lock, Crown } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadFile } from '@/lib/storage-wrapper';
import FounderBadge from './FounderBadge';
import CopyProtectionModal from './CopyProtectionModal';

export default function ProfileView() {
  const { contacts, activeChatId, setView, themeColor, isGlassEnabled, sendMessage, blockContact, user, isPremium } = useChat();
  const contact = activeChatId ? contacts[activeChatId] : null;

  const [showShareModal, setShowShareModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showOtherMenu, setShowOtherMenu] = useState(false);
  const [showCopyProtectionModal, setShowCopyProtectionModal] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [userStats, setUserStats] = useState({
    giftsSent: 0,
    giftsReceived: 0,
    stars: 0,
    joinedDate: null as Date | null,
    isFounder: false,
    bannerUrl: null as string | null
  });

  // Определяем, это свой профиль или нет
  // Проверяем либо по contact.id, либо если мы смотрим профиль из настроек (activeChatId === user?.uid)
  const isOwnProfile = auth.currentUser?.uid === contact?.id || 
                       auth.currentUser?.uid === activeChatId ||
                       (!contact && auth.currentUser);

  // Загрузка статистики пользователя
  useEffect(() => {
    const loadUserStats = async () => {
      // Определяем ID пользователя для загрузки
      const userId = contact?.id || auth.currentUser?.uid;
      
      if (!userId || userId === 'saved_messages' || userId === 'test_bot') return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserStats({
            giftsSent: data.giftsSent || 0,
            giftsReceived: data.giftsReceived || 0,
            stars: data.stars || 0,
            joinedDate: data.createdAt?.toDate() || null,
            isFounder: data.isFounder === true || data.email === 'goh@gmail.com',
            bannerUrl: data.bannerUrl || null
          });
        }
      } catch (error) {
        console.error('Failed to load user stats:', error);
      }
    };

    loadUserStats();
  }, [contact, auth.currentUser]);

  // Загрузка баннера
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 10MB');
      return;
    }

    setIsUploadingBanner(true);
    try {
      const result = await uploadFile(file, auth.currentUser.uid, 'image');
      
      // Обновляем в Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        bannerUrl: result.url
      });

      // Обновляем локальное состояние
      setUserStats(prev => ({ ...prev, bannerUrl: result.url }));
      setShowEditMenu(false);
    } catch (error: any) {
      console.error('Error uploading banner:', error);
      alert(error.message || 'Ошибка при загрузке баннера');
    } finally {
      setIsUploadingBanner(false);
      if (e.target) e.target.value = '';
    }
  };

  // Удаление баннера
  const handleRemoveBanner = async () => {
    if (!auth.currentUser) return;

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        bannerUrl: null
      });

      setUserStats(prev => ({ ...prev, bannerUrl: null }));
      setShowEditMenu(false);
    } catch (error) {
      console.error('Error removing banner:', error);
      alert('Ошибка при удалении баннера');
    }
  };

  if (!contact && !auth.currentUser) return (
    <div className="absolute inset-0 bg-tg-profile-bg flex items-center justify-center z-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // Если contact не установлен, используем данные текущего пользователя
  const displayContact = contact || {
    id: auth.currentUser?.uid || '',
    name: auth.currentUser?.displayName || 'Мой профиль',
    initial: auth.currentUser?.displayName?.charAt(0) || 'М',
    avatarColor: '#517da2',
    avatarUrl: auth.currentUser?.photoURL || undefined,
    statusOnline: 'в сети',
    statusOffline: 'недавно',
    phone: auth.currentUser?.phoneNumber || '',
    bio: '',
    username: auth.currentUser?.email?.split('@')[0] || '',
    messages: [],
    isTyping: false,
    unread: 0,
    isOfficial: false,
    isFounder: false,
    isChannel: false,
    isBot: false,
    premium: false
  };

  const handleShare = () => {
    if (displayContact.id === 'test_bot') {
      sendMessage(`Юзернейм бота: ${displayContact.username}`);
    } else {
      sendMessage(`Контакт: ${displayContact.name} (${displayContact.username})`);
    }
    setShowShareModal(false);
    setView('chat');
  };

  const handleBlock = () => {
    blockContact(displayContact.id);
    setShowBlockModal(false);
    setView('chat');
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-tg-profile-bg flex flex-col z-20"
    >
      {/* Gradient overlay header — floats over banner */}
      <div 
        className="text-white px-3 h-14 flex items-center gap-3 shrink-0 absolute top-0 left-0 w-full z-30"
        style={{ background: `linear-gradient(180deg, ${themeColor}EE 0%, ${themeColor}66 65%, transparent 100%)` }}
      >
        <button 
          onClick={() => setView(contact ? 'chat' : 'menu')} 
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 active:bg-white/25 transition-all"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="text-[18px] font-semibold flex-grow">Инфо</div>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar bg-[#f2f2f7] dark:bg-[#0f0f0f]">
        {/* Header Card with Banner and Avatar */}
        <div className="relative">
          {/* Banner */}
          <div className="relative h-44 overflow-hidden">
            {userStats.bannerUrl ? (
              <Image
                src={userStats.bannerUrl}
                alt="Banner"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{ backgroundColor: themeColor }}
              />
            )}
            
            {/* Menu Button для чужого профиля: запретить копирование и т.д. */}
            {!isOwnProfile && contact && contact.id !== 'saved_messages' && contact.id !== 'test_bot' && !contact.isChannel && (
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOtherMenu(!showOtherMenu);
                  }}
                  className="p-2 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors"
                  aria-label="Ещё"
                >
                  <MoreVertical size={20} />
                </button>

                <AnimatePresence>
                  {showOtherMenu && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() => setShowOtherMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-12 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl py-1 z-50 min-w-[240px] overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            setShowOtherMenu(false);
                            setShowCopyProtectionModal(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-left text-[15px] text-gray-700 dark:text-gray-200 transition-colors"
                        >
                          <Lock size={18} className="text-gray-500 dark:text-gray-400" />
                          <span className="flex-1">
                            {contact.copyProtectedBy?.[user?.uid || ''] ? 'Отключить защиту от копирования' : 'Запретить копирование'}
                          </span>
                          {!isPremium && (
                            <Crown size={16} className="text-amber-500" />
                          )}
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Edit Button — баннер можно менять только в своём профиле */}
            {isOwnProfile && (
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditMenu(!showEditMenu);
                  }}
                  className="p-2 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors"
                >
                  <MoreVertical size={20} />
                </button>
                
                {/* Edit Menu */}
                <AnimatePresence>
                  {showEditMenu && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() => setShowEditMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-12 bg-white rounded-xl shadow-2xl py-1 z-50 min-w-[200px] overflow-hidden"
                      >
                        <input
                          ref={bannerInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => bannerInputRef.current?.click()}
                          disabled={isUploadingBanner}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left text-[15px] text-gray-700 transition-colors disabled:opacity-50"
                        >
                          <Camera size={18} className="text-gray-500" />
                          {isUploadingBanner ? 'Загрузка...' : userStats.bannerUrl ? 'Изменить баннер' : 'Установить баннер'}
                        </button>
                        {userStats.bannerUrl && (
                          <button
                            onClick={handleRemoveBanner}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-left text-[15px] text-red-500 transition-colors"
                          >
                            <ArrowLeft size={18} />
                            Удалить баннер
                          </button>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
          
          {/* Avatar Section */}
          <div className="relative px-6 pb-6">
            <div className="flex flex-col items-center text-center -mt-16 pb-2">
              {displayContact.id === 'saved_messages' ? (
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center text-white shrink-0 mb-4 ring-[5px] ring-white/70 shadow-2xl"
                  style={{ backgroundColor: displayContact.avatarColor }}
                >
                  <Bookmark size={44} fill="currentColor" />
                </div>
              ) : displayContact.avatarUrl ? (
                <div className="relative mb-3">
                  <Image
                    src={displayContact.avatarUrl}
                    alt={displayContact.name}
                    width={112}
                    height={112}
                    className="rounded-full object-cover ring-[5px] ring-white/70 shadow-2xl"
                    referrerPolicy="no-referrer"
                    unoptimized
                  />
                  {displayContact.statusOffline === 'в сети' && (
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-[3px] border-white dark:border-[#0f0f0f]" />
                  )}
                </div>
              ) : (
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center text-white font-bold text-[44px] shrink-0 mb-4 ring-[5px] ring-white/70 shadow-2xl"
                  style={{ backgroundColor: displayContact.avatarColor }}
                >
                  {displayContact.initial}
                </div>
              )}
              
              <h1 className="text-[24px] font-bold text-gray-900 dark:text-white mb-0.5 flex items-center gap-1.5">
                <span>{displayContact.name}</span>
                {userStats.isFounder && <FounderBadge size={26} />}
                {displayContact.isOfficial && !userStats.isFounder && <BadgeCheck size={22} className="text-blue-500 fill-blue-500" />}
              </h1>

              <div className="text-[14px] text-gray-500 dark:text-gray-400">{displayContact.statusOffline}</div>

              {displayContact.username && (
                <div className="text-[14px] font-semibold mt-1" style={{ color: themeColor }}>
                  {displayContact.username.startsWith('@') ? displayContact.username : `@${displayContact.username}`}
                </div>
              )}

              {/* Quick action buttons */}
              {!displayContact.isChannel && displayContact.id !== 'saved_messages' && (
                <div className="flex gap-4 mt-6">
                  <QuickBtn color={themeColor} icon={<MessageCircle size={22} />} label="Написать" onClick={() => setView('chat')} />
                  {displayContact.id !== 'test_bot' && (
                    <QuickBtn color={themeColor} icon={<Gift size={22} />} label="Подарок" onClick={() => { localStorage.setItem('sendGiftToUser', displayContact.id); setView('send-gift'); }} />
                  )}
                  <QuickBtn color={themeColor} icon={<User size={22} />} label="Поделиться" onClick={() => setShowShareModal(true)} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Founder Badge Section */}
        {userStats.isFounder && (
          <div className="mx-4 mt-4 bg-white dark:bg-[#1c1c1d] dark:border dark:border-[#2c2c2e] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-600 to-black flex items-center justify-center shrink-0">
                <FounderBadge size={28} />
              </div>
              <div className="flex-grow min-w-0">
                <div className="text-[15px] font-semibold text-gray-900 dark:text-white">Основатель HouseGram</div>
                <div className="text-[13px] text-gray-500 dark:text-gray-400 leading-snug">
                  Создатель и разработчик платформы HouseGram.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Badges Section */}
        {displayContact.isOfficial && !userStats.isFounder && (
          <div className="mx-4 mt-4 bg-white dark:bg-[#1c1c1d] dark:border dark:border-[#2c2c2e] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                <BadgeCheck size={22} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-gray-900 dark:text-white">Официальный аккаунт</div>
                <div className="text-[13px] text-gray-500 dark:text-gray-400">Подтверждено администрацией HouseGram</div>
              </div>
            </div>
          </div>
        )}

        {/* Security Warning for Bots */}
        {displayContact.id === 'test_bot' && (
          <div className="mx-4 mt-4 bg-white dark:bg-[#1c1c1d] dark:border dark:border-[#2c2c2e] rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center shrink-0 text-white text-xl">
                🤖
              </div>
              <div>
                <div className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Это бот</div>
                <div className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  Будьте осторожны при отправке конфиденциальной информации. Боты могут иметь доступ к вашим сообщениям.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Stats — спокойный блок, все числа цветом темы.
            Баланс молний ⚡ это приватная финансовая информация, показываем
            его ТОЛЬКО на собственном профиле. Для чужих пользователей
            выводим только публичную статистику подарков (отправлено/получено). */}
        {!displayContact.isChannel && displayContact.id !== 'saved_messages' && displayContact.id !== 'test_bot' && (
          <div className="mx-4 mt-4 bg-white dark:bg-[#1c1c1d] dark:border dark:border-[#2c2c2e] rounded-xl overflow-hidden">
            <div className={`grid divide-x divide-gray-100 dark:divide-[#2c2c2e] ${isOwnProfile ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {isOwnProfile && (
                <div className="py-4 text-center">
                  <div className="text-[26px] font-bold tabular-nums" style={{ color: themeColor }}>{userStats.stars}</div>
                  <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">⚡ Молний</div>
                </div>
              )}
              <div className="py-4 text-center">
                <div className="text-[26px] font-bold tabular-nums" style={{ color: themeColor }}>{userStats.giftsSent}</div>
                <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">🎁 Отправил</div>
              </div>
              <div className="py-4 text-center">
                <div className="text-[26px] font-bold tabular-nums" style={{ color: themeColor }}>{userStats.giftsReceived}</div>
                <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">🎁 Получил</div>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mx-4 mt-4 bg-white dark:bg-[#1c1c1d] dark:border dark:border-[#2c2c2e] rounded-xl overflow-hidden">
          <div className="px-4 pt-3 pb-1 text-[12px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Информация</div>
          
          {displayContact.bio && (
            <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2c2c2e] flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-blue-50 dark:bg-blue-500/15">
                <User size={18} className="text-blue-500" />
              </div>
              <div className="flex-grow min-w-0">
                <div className="text-[12px] text-gray-400 dark:text-gray-500 mb-0.5">О себе</div>
                <div className="text-[15px] text-gray-900 dark:text-white leading-relaxed">{displayContact.bio}</div>
              </div>
            </div>
          )}
          
          {displayContact.username && !displayContact.isChannel && (
            <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2c2c2e] flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-green-50 dark:bg-green-500/15">
                <MessageCircle size={18} className="text-green-500" />
              </div>
              <div className="flex-grow min-w-0">
                <div className="text-[12px] text-gray-400 dark:text-gray-500 mb-0.5">Имя пользователя</div>
                <div className="text-[15px] font-semibold" style={{ color: themeColor }}>
                  {displayContact.username.startsWith('@') ? displayContact.username : `@${displayContact.username}`}
                </div>
              </div>
            </div>
          )}
          
          {displayContact.phone && displayContact.phone !== '+7 9XX XXX XX XX' && (
            <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2c2c2e] flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-green-50 dark:bg-green-500/15">
                <Phone size={18} className="text-green-500" />
              </div>
              <div className="flex-grow min-w-0">
                <div className="text-[12px] text-gray-400 dark:text-gray-500 mb-0.5">Телефон</div>
                <div className="text-[15px] text-gray-900 dark:text-white">{displayContact.phone}</div>
              </div>
            </div>
          )}
          
          {userStats.joinedDate && (
            <div className="px-4 py-3 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-purple-50 dark:bg-purple-500/15">
                <Calendar size={18} className="text-purple-500" />
              </div>
              <div className="flex-grow min-w-0">
                <div className="text-[12px] text-gray-400 dark:text-gray-500 mb-0.5">Дата регистрации</div>
                <div className="text-[15px] text-gray-900 dark:text-white">
                  {userStats.joinedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Section */}
        {!displayContact.isChannel && displayContact.id !== 'saved_messages' && (
          <div className="mx-4 mt-4 mb-8 bg-white dark:bg-[#1c1c1d] dark:border dark:border-[#2c2c2e] rounded-2xl overflow-hidden shadow-sm">
            {displayContact.id !== 'test_bot' && (
              <ActionButton 
                text="Посмотреть подарки" 
                icon={<Gift size={20} className="text-pink-500" />}
                onClick={() => setView('user-gifts')} 
                color={themeColor} 
              />
            )}
            <ActionButton 
              text="Заблокировать пользователя" 
              icon={<Shield size={20} />}
              onClick={() => setShowBlockModal(true)} 
              isDestructive 
            />
          </div>
        )}
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50" onClick={() => setShowShareModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden z-10"
            >
              <div className="p-5">
                <h3 className="text-[18px] font-medium text-black mb-2">Поделиться контактом</h3>
                <p className="text-[15px] text-gray-600">
                  {displayContact.id === 'test_bot' 
                    ? `Отправить бота ${displayContact.name}? Будет отправлен его юзернейм.` 
                    : `Отправить контакт ${displayContact.name} в текущий чат?`}
                </p>
              </div>
              <div className="flex border-t border-gray-200">
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 py-3 text-[16px] font-medium text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-200"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleShare}
                  className="flex-1 py-3 text-[16px] font-medium hover:bg-gray-50 transition-colors"
                  style={{ color: themeColor }}
                >
                  Отправить
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Block Modal */}
      <AnimatePresence>
        {showBlockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50" onClick={() => setShowBlockModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden z-10"
            >
              <div className="p-5">
                <h3 className="text-[18px] font-medium text-black mb-2">Заблокировать</h3>
                <p className="text-[15px] text-gray-600">Вы уверены, что хотите заблокировать пользователя {displayContact.name}? Он больше не сможет писать вам.</p>
              </div>
              <div className="flex border-t border-gray-200">
                <button 
                  onClick={() => setShowBlockModal(false)}
                  className="flex-1 py-3 text-[16px] font-medium text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-200"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleBlock}
                  className="flex-1 py-3 text-[16px] font-medium text-red-500 hover:bg-gray-50 transition-colors"
                >
                  Заблокировать
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {contact && (
        <CopyProtectionModal
          open={showCopyProtectionModal}
          contactId={contact.id}
          contactName={contact.name}
          isEnabled={Boolean(user?.uid && contact.copyProtectedBy?.[user.uid])}
          onClose={() => setShowCopyProtectionModal(false)}
        />
      )}
    </motion.div>
  );
}

function QuickBtn({ color, icon, label, onClick }: { color: string; icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 w-16 active:opacity-70 transition-opacity">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">{label}</span>
    </button>
  );
}

function ActionButton({ text, isDestructive, onClick, color, icon }: { text: string; isDestructive?: boolean; onClick?: () => void; color?: string; icon?: React.ReactNode }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center px-4 py-3.5 gap-3 cursor-pointer border-b border-gray-100 dark:border-[#2c2c2e] last:border-b-0 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10 ${
        isDestructive ? 'text-red-500' : ''
      }`}
      style={!isDestructive && color ? { color } : {}}
    >
      {icon && <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={isDestructive ? { backgroundColor: 'rgba(239,68,68,0.1)' } : { backgroundColor: color ? color + '18' : '#f0f0f0' }}>{icon}</div>}
      <span className="flex-grow text-[15px] font-medium">{text}</span>
      <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor" className="shrink-0 text-gray-300 dark:text-gray-600">
        <path d="M7.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z" />
      </svg>
    </div>
  );
}
