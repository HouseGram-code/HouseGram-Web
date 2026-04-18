'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Bookmark, BadgeCheck, CheckCircle, Gift } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export default function ProfileView() {
  const { contacts, activeChatId, setView, themeColor, isGlassEnabled, sendMessage, blockContact } = useChat();
  const contact = activeChatId ? contacts[activeChatId] : null;

  const [showShareModal, setShowShareModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  if (!contact) return (
    <div className="absolute inset-0 bg-tg-profile-bg flex items-center justify-center z-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const handleShare = () => {
    if (contact.isBot) {
      sendMessage(`Юзернейм бота: ${contact.username}`);
    } else {
      sendMessage(`Контакт: ${contact.name} (${contact.username})`);
    }
    setShowShareModal(false);
    setView('chat');
  };

  const handleBlock = () => {
    blockContact(contact.id);
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

      <div className="flex-grow overflow-y-auto pt-14 no-scrollbar">
        <div className="bg-tg-bg-light p-5 flex items-center gap-5 border-b border-tg-divider mb-2.5">
          {contact.id === 'saved_messages' ? (
            <div 
              className="w-[70px] h-[70px] rounded-full flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: contact.avatarColor }}
            >
              <Bookmark size={32} fill="currentColor" />
            </div>
          ) : contact.avatarUrl ? (
            <Image 
              src={contact.avatarUrl} 
              alt={contact.name} 
              width={70} 
              height={70} 
              className="rounded-full object-cover shrink-0" 
              referrerPolicy="no-referrer"
              unoptimized
            />
          ) : (
            <div 
              className="w-[70px] h-[70px] rounded-full flex items-center justify-center text-white font-medium text-[30px] shrink-0"
              style={{ backgroundColor: contact.avatarColor }}
            >
              {contact.initial}
            </div>
          )}
          <div className="flex flex-col">
            <div className="text-[20px] font-medium text-tg-text-primary mb-1 flex items-center gap-1">
              {contact.name}
              {contact.isOfficial && <BadgeCheck size={20} className="text-blue-500 fill-blue-500 text-white" />}
            </div>
            <div className="text-[14px] text-tg-secondary-text">{contact.statusOffline}</div>
          </div>
        </div>

        <div className="bg-tg-bg-light border-y border-tg-divider mb-2.5">
          {contact.isOfficial && (
            <div className="px-4 py-3 flex items-center gap-3 border-b border-tg-divider">
              <BadgeCheck size={24} className="text-blue-500 fill-blue-500 text-white shrink-0" />
              <div>
                <div className="text-[16px] text-tg-text-primary">Официальный аккаунт</div>
                <div className="text-[13px] text-tg-secondary-text">Подтверждено администрацией</div>
              </div>
            </div>
          )}
          
          {/* Security Warning for Bots */}
          {contact.isBot && (
            <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 shrink-0 mt-0.5">⚠️</div>
                <div>
                  <div className="text-[14px] text-gray-700 leading-relaxed">
                    Это бот. Будьте осторожны при отправке конфиденциальной информации.
                  </div>
                  <div className="text-[13px] text-gray-500 mt-1">
                    Тест
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <InfoItem label="О себе" value={contact.bio} />
          {!contact.isChannel && contact.username && <InfoItem label="Имя пользователя" value={contact.username} isLink color={themeColor} />}
        </div>

        <div className="bg-tg-bg-light border-y border-tg-divider mb-2.5">
          {!contact.isChannel && <ActionButton text="Отправить сообщение" onClick={() => setView('chat')} color={themeColor} />}
          {!contact.isChannel && contact.id !== 'saved_messages' && !contact.isBot && (
            <ActionButton 
              text="Подарки" 
              icon={<Gift size={20} />}
              onClick={() => setView('user-gifts')} 
              color={themeColor} 
            />
          )}
          {!contact.isChannel && contact.id !== 'saved_messages' && (
            <>
              <ActionButton text="Поделиться контактом" onClick={() => setShowShareModal(true)} color={themeColor} />
              <ActionButton text="Заблокировать" onClick={() => setShowBlockModal(true)} isDestructive />
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
                  {contact.isBot
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

function InfoItem({ label, value, isLink, color }: { label: string; value: string; isLink?: boolean; color?: string }) {
  return (
    <div className="px-4 py-3 border-b border-tg-divider last:border-b-0 flex flex-col text-[15px]">
      <span className="text-[13px] text-tg-secondary-text mb-1">{label}</span>
      <span 
        className={`leading-snug ${isLink ? 'cursor-pointer' : 'text-tg-text-primary'}`}
        style={isLink && color ? { color } : {}}
      >
        {value}
      </span>
    </div>
  );
}

function ActionButton({ text, isDestructive, onClick, color, icon }: { text: string; isDestructive?: boolean; onClick?: () => void; color?: string; icon?: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`block w-full px-4 py-3 text-left text-[16px] border-b border-tg-divider last:border-b-0 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-700/50 ${
        isDestructive ? 'text-tg-red' : ''
      } flex items-center gap-3`}
      style={!isDestructive && color ? { color } : {}}
    >
      {icon && <span>{icon}</span>}
      <span>{text}</span>
    </button>
  );
}
