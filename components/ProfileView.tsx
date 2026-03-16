'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, MoreVertical, Search, Bell, Ban, Trash2 } from 'lucide-react';
import Image from 'next/image';

export default function ProfileView() {
  const { setView, contacts, activeChatId, themeColor, isGlassEnabled, blockContact, toggleMute, deleteChat } = useChat();
  const contact = activeChatId ? contacts[activeChatId] : null;

  if (!contact) return null;

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-gray-100 z-40 flex flex-col"
    >
      <div 
        className={`text-white px-2.5 h-12 flex items-center gap-4 shrink-0 absolute top-0 left-0 w-full z-10 transition-colors ${isGlassEnabled ? 'backdrop-blur-md border-b border-black/10' : ''}`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'CC' : themeColor }}
      >
        <button onClick={() => setView('chat')} className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="text-[17px] font-medium flex-grow">Профиль</div>
        <button className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors">
          <MoreVertical size={24} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto pt-12 no-scrollbar">
        <div className="relative h-64 bg-gray-300 flex items-center justify-center overflow-hidden">
          {contact.avatarUrl ? (
            <Image src={contact.avatarUrl} alt={contact.name} fill className="object-cover" referrerPolicy="no-referrer" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-[80px] font-medium" style={{ backgroundColor: contact.avatarColor }}>
              {contact.initial}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          <div className="absolute bottom-4 left-4 text-white font-medium text-[24px] z-10">{contact.name}</div>
        </div>

        <div className="bg-white p-4 mb-4">
          <div className="text-[14px] text-gray-500 mb-1">О себе</div>
          <div className="text-[16px] text-gray-900">{contact.bio || 'Нет информации'}</div>
        </div>

        <div className="bg-white p-2 mb-4">
          <ProfileAction icon={Search} label="Поиск" />
        </div>

        <div className="bg-white p-2">
          <ProfileAction 
            icon={Bell} 
            label={contact.isMuted ? "Включить уведомления" : "Выключить уведомления"} 
            onClick={() => toggleMute(contact.id)}
            className={contact.isMuted ? "text-gray-500" : ""}
          />
          {contact.id !== 'saved_messages' && !contact.isChannel && (
            <ProfileAction 
              icon={Ban} 
              label={contact.isBlocked ? "Разблокировать" : "Заблокировать"} 
              onClick={() => blockContact(contact.id)}
              className={contact.isBlocked ? "text-blue-500" : "text-red-500"}
            />
          )}
          <ProfileAction 
            icon={Trash2} 
            label="Удалить чат" 
            className="text-red-500" 
            onClick={() => {
              deleteChat(contact.id);
              setView('menu');
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ProfileAction({ icon: Icon, label, onClick, className = "" }: { icon: any, label: string, onClick?: () => void, className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-6 px-4 py-3 hover:bg-gray-50 transition-colors text-[16px] ${className}`}
    >
      <Icon size={24} className={className ? "" : "text-gray-400"} />
      {label}
    </button>
  );
}
