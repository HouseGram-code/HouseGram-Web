'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Bookmark, BadgeCheck, CheckCircle, Gift, Phone, Mail, Calendar, MessageCircle, User, Shield, Clock, MapPin, Camera, MoreVertical, Edit } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadFile } from '@/lib/storage-wrapper';
import FounderBadge from './FounderBadge';

export default function ProfileView() {
  const { contacts, activeChatId, setView, themeColor, isGlassEnabled, sendMessage, blockContact, user } = useChat();
  const contact = activeChatId ? contacts[activeChatId] : null;

  const [showShareModal, setShowShareModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
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
  const isOwnProfile = auth.currentUser?.uid === contact?.id || (!contact && auth.currentUser);

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
    unread: 0
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
      <div 
        className={`text-tg-header-text px-2.5 h-12 flex items-center gap-4 shrink-0 absolute top-0 left-0 w-full z-30 transition-colors ${isGlassEnabled ? 'backdrop-blur-md border-b border-black/10' : ''}`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'CC' : themeColor }}
      >
        <button 
          onClick={() => setView('chat')} 
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-[17px] font-medium flex-grow">Инфо</div>
      </div>

      <div className="flex-grow overflow-y-auto pt-14 no-scrollbar bg-gray-50">
        {/* Header Card with Banner and Avatar */}
        <div className="relative">
          {/* Banner */}
          <div className="relative h-32 overflow-hidden">
            {userStats.bannerUrl ? (
              <Image
                src={userStats.bannerUrl}
                alt="Banner"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600">
                {/* Decorative Background */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
                </div>
              </div>
            )}
            
            {/* Edit Button - только для своего профиля */}
            {(isOwnProfile || true) && (
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Edit button clicked, isOwnProfile:', isOwnProfile);
                    console.log('auth.currentUser?.uid:', auth.currentUser?.uid);
                    console.log('displayContact.id:', displayContact.id);
                    setShowEditMenu(!showEditMenu);
                  }}
                  className="p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
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
          <div className="relative px-6 pb-6 bg-gradient-to-b from-transparent to-gray-50">
            <div className="flex flex-col items-center text-center -mt-12">
              {contact.id === 'saved_messages' ? (
                <div 
                  className="w-[90px] h-[90px] rounded-full flex items-center justify-center text-white shrink-0 shadow-xl mb-3 border-4 border-white"
                  style={{ backgroundColor: contact.avatarColor }}
                >
                  <Bookmark size={40} fill="currentColor" />
                </div>
              ) : contact.avatarUrl ? (
                <div className="relative mb-3">
                  <Image 
                    src={contact.avatarUrl} 
                    alt={contact.name} 
                    width={90} 
                    height={90} 
                    className="rounded-full object-cover shrink-0 shadow-xl border-4 border-white" 
                    referrerPolicy="no-referrer"
                    unoptimized
                  />
                  {contact.statusOffline === 'в сети' && (
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-white"></div>
                  )}
                </div>
              ) : (
                <div 
                  className="w-[90px] h-[90px] rounded-full flex items-center justify-center text-white font-medium text-[36px] shrink-0 shadow-xl mb-3 border-4 border-white"
                  style={{ backgroundColor: contact.avatarColor }}
                >
                  {contact.initial}
                </div>
              )}
              
              <div className="text-[24px] font-bold text-gray-900 mb-1 flex items-center gap-2">
                {contact.name}
                {userStats.isFounder && <FounderBadge size={28} />}
                {contact.isOfficial && !userStats.isFounder && <BadgeCheck size={24} className="text-blue-500 fill-blue-500" />}
              </div>
              
              <div className="flex items-center gap-2 text-gray-600 text-[14px] mb-2">
                <Clock size={14} />
                {contact.statusOffline}
              </div>
              
              {contact.username && (
                <div className="text-gray-500 text-[14px]">{contact.username}</div>
              )}
            </div>
          </div>
        </div>

        {/* Founder Badge Section */}
        {userStats.isFounder && (
          <div className="mx-4 mt-4 bg-gradient-to-r from-red-50 via-gray-50 to-black/5 rounded-xl p-4 border border-red-200 relative overflow-hidden">
            {/* Декоративный фон */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-600 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-black rounded-full translate-y-1/2 -translate-x-1/2"></div>
            </div>
            
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-black flex items-center justify-center shrink-0 shadow-lg">
                <FounderBadge size={32} />
              </div>
              <div className="flex-grow">
                <div className="text-[16px] font-bold text-gray-900 mb-1">Основатель HouseGram</div>
                <div className="text-[13px] text-gray-600 leading-relaxed">
                  Создатель и разработчик платформы HouseGram. Спасибо за использование нашего мессенджера! 🚀
                </div>
              </div>
            </div>
            
            {/* Дополнительная информация */}
            <div className="mt-3 pt-3 border-t border-red-200/50">
              <div className="flex items-center gap-4 text-[12px] text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="text-red-600">🏗️</span>
                  <span>Архитектор системы</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-800">💡</span>
                  <span>Идейный вдохновитель</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-700">⚡</span>
                  <span>Основатель</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Badges Section */}
        {contact.isOfficial && !userStats.isFounder && (
          <div className="mx-4 mt-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                <BadgeCheck size={24} className="text-white" />
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900">Официальный аккаунт</div>
                <div className="text-[13px] text-gray-600">Подтверждено администрацией HouseGram</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Security Warning for Bots */}
        {contact.id === 'test_bot' && (
          <div className="mx-4 mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center shrink-0 text-white text-xl">
                🤖
              </div>
              <div>
                <div className="text-[15px] font-semibold text-gray-900 mb-1">Это бот</div>
                <div className="text-[13px] text-gray-600 leading-relaxed">
                  Будьте осторожны при отправке конфиденциальной информации. Боты могут иметь доступ к вашим сообщениям.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Stats - только для обычных пользователей */}
        {!contact.isChannel && contact.id !== 'saved_messages' && contact.id !== 'test_bot' && (
          <div className="mx-4 mt-4 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-[15px] font-semibold text-gray-900">Статистика</h3>
            </div>
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              <div className="p-4 text-center">
                <div className="text-[24px] font-bold text-blue-600">{userStats.stars}</div>
                <div className="text-[12px] text-gray-500 mt-1">⚡ Молний</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-[24px] font-bold text-purple-600">{userStats.giftsSent}</div>
                <div className="text-[12px] text-gray-500 mt-1">🎁 Отправлено</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-[24px] font-bold text-pink-600">{userStats.giftsReceived}</div>
                <div className="text-[12px] text-gray-500 mt-1">🎁 Получено</div>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mx-4 mt-4 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-[15px] font-semibold text-gray-900">Информация</h3>
          </div>
          
          {contact.bio && (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <User size={20} className="text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[13px] text-gray-500 mb-1">О себе</div>
                  <div className="text-[15px] text-gray-900 leading-relaxed">{contact.bio}</div>
                </div>
              </div>
            </div>
          )}
          
          {contact.username && !contact.isChannel && (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <MessageCircle size={20} className="text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[13px] text-gray-500 mb-1">Имя пользователя</div>
                  <div className="text-[15px] font-medium" style={{ color: themeColor }}>{contact.username}</div>
                </div>
              </div>
            </div>
          )}
          
          {contact.phone && contact.phone !== '+7 9XX XXX XX XX' && (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <Phone size={20} className="text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[13px] text-gray-500 mb-1">Телефон</div>
                  <div className="text-[15px] text-gray-900">{contact.phone}</div>
                </div>
              </div>
            </div>
          )}
          
          {userStats.joinedDate && (
            <div className="px-4 py-3">
              <div className="flex items-start gap-3">
                <Calendar size={20} className="text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[13px] text-gray-500 mb-1">Дата регистрации</div>
                  <div className="text-[15px] text-gray-900">
                    {userStats.joinedDate.toLocaleDateString('ru-RU', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="mx-4 mt-4 mb-6 bg-white rounded-xl shadow-sm overflow-hidden">
          {!contact.isChannel && (
            <ActionButton 
              text="Отправить сообщение" 
              icon={<MessageCircle size={20} />}
              onClick={() => setView('chat')} 
              color={themeColor} 
            />
          )}
          {!contact.isChannel && contact.id !== 'saved_messages' && contact.id !== 'test_bot' && (
            <ActionButton 
              text="Посмотреть подарки" 
              icon={<Gift size={20} />}
              onClick={() => setView('user-gifts')} 
              color={themeColor} 
            />
          )}
          {!contact.isChannel && contact.id !== 'saved_messages' && (
            <>
              <ActionButton 
                text="Поделиться контактом" 
                icon={<User size={20} />}
                onClick={() => setShowShareModal(true)} 
                color={themeColor} 
              />
              <ActionButton 
                text="Заблокировать пользователя" 
                icon={<Shield size={20} />}
                onClick={() => setShowBlockModal(true)} 
                isDestructive 
              />
            </>
          )}
        </div>
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
                  {contact.id === 'test_bot' 
                    ? `Отправить бота ${contact.name}? Будет отправлен его юзернейм.` 
                    : `Отправить контакт ${contact.name} в текущий чат?`}
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
                <p className="text-[15px] text-gray-600">Вы уверены, что хотите заблокировать пользователя {contact.name}? Он больше не сможет писать вам.</p>
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
    </motion.div>
  );
}

function ActionButton({ text, isDestructive, onClick, color, icon }: { text: string; isDestructive?: boolean; onClick?: () => void; color?: string; icon?: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`block w-full px-4 py-3.5 text-left text-[15px] border-b border-gray-100 last:border-b-0 transition-all hover:bg-gray-50 active:bg-gray-100 ${
        isDestructive ? 'text-red-500' : ''
      } flex items-center gap-3 font-medium`}
      style={!isDestructive && color ? { color } : {}}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-grow">{text}</span>
      <span className="text-gray-400">›</span>
    </button>
  );
}
