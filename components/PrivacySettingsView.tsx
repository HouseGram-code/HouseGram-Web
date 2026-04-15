'use client';

import { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Eye, EyeOff, Clock, MessageCircle, User } from 'lucide-react';

type PrivacyOption = 'everyone' | 'contacts' | 'nobody';

export default function PrivacySettingsView() {
  const { setView, themeColor, isGlassEnabled } = useChat();
  const [lastSeenPrivacy, setLastSeenPrivacy] = useState<PrivacyOption>('everyone');
  const [profilePhotoPrivacy, setProfilePhotoPrivacy] = useState<PrivacyOption>('everyone');
  const [aboutPrivacy, setAboutPrivacy] = useState<PrivacyOption>('everyone');

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-white flex flex-col z-20"
    >
      <div 
        className={`text-white px-2.5 h-14 flex items-center gap-4 shrink-0 relative z-30 transition-colors ${isGlassEnabled ? 'backdrop-blur-md border-b border-black/10' : ''}`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'CC' : themeColor }}
      >
        <button onClick={() => setView('settings')} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow text-[18px] font-medium">Конфиденциальность</div>
      </div>

      <div className="flex-grow overflow-y-auto pt-4 pb-10 no-scrollbar bg-gray-50">
        <div className="bg-white border-y border-gray-100 mb-4">
          <div className="px-4 py-2 text-[14px] font-medium" style={{ color: themeColor }}>Кто может видеть мою информацию</div>
          
          <PrivacyItem 
            icon={<Clock size={24} />}
            title="Время последнего посещения"
            value={lastSeenPrivacy}
            onChange={setLastSeenPrivacy}
          />
          
          <PrivacyItem 
            icon={<User size={24} />}
            title="Фото профиля"
            value={profilePhotoPrivacy}
            onChange={setProfilePhotoPrivacy}
          />
          
          <PrivacyItem 
            icon={<MessageCircle size={24} />}
            title="О себе"
            value={aboutPrivacy}
            onChange={setAboutPrivacy}
          />
        </div>

        <div className="px-4 py-3 text-[13px] text-gray-500 bg-gray-50">
          Настройки конфиденциальности позволяют контролировать, кто может видеть вашу личную информацию.
        </div>
      </div>
    </motion.div>
  );
}

function PrivacyItem({ 
  icon, 
  title, 
  value, 
  onChange 
}: { 
  icon: React.ReactNode; 
  title: string; 
  value: PrivacyOption;
  onChange: (value: PrivacyOption) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const getLabel = (val: PrivacyOption) => {
    switch (val) {
      case 'everyone': return 'Все';
      case 'contacts': return 'Мои контакты';
      case 'nobody': return 'Никто';
    }
  };

  return (
    <>
      <div 
        className="flex items-center px-4 py-3 gap-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="text-gray-500">{icon}</div>
        <div className="flex flex-col flex-grow">
          <span className="text-[16px] text-black">{title}</span>
          <span className="text-[13px] text-gray-500">{getLabel(value)}</span>
        </div>
      </div>
      
      {isOpen && (
        <div className="bg-gray-50 border-b border-gray-100">
          {(['everyone', 'contacts', 'nobody'] as PrivacyOption[]).map(option => (
            <div
              key={option}
              className="flex items-center px-12 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => { onChange(option); setIsOpen(false); }}
            >
              <span className={`text-[15px] ${value === option ? 'text-blue-500 font-medium' : 'text-black'}`}>
                {getLabel(option)}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
