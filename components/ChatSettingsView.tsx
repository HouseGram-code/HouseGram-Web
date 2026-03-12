'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Check } from 'lucide-react';
import Image from 'next/image';

const WALLPAPERS = [
  '', // Default
  'https://picsum.photos/seed/hg1/800/1200',
  'https://picsum.photos/seed/hg2/800/1200',
  'https://picsum.photos/seed/hg3/800/1200',
  'https://picsum.photos/seed/hg4/800/1200',
  'https://picsum.photos/seed/hg5/800/1200',
];

export default function ChatSettingsView() {
  const { setView, themeColor, setThemeColor, wallpaper, setWallpaper, isGlassEnabled } = useChat();

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-tg-profile-bg flex flex-col z-30"
    >
      <div 
        className={`text-tg-header-text px-2.5 h-12 flex items-center gap-4 shrink-0 absolute top-0 left-0 w-full z-40 transition-colors ${isGlassEnabled ? 'backdrop-blur-md border-b border-black/10' : ''}`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'CC' : themeColor }}
      >
        <button onClick={() => setView('settings')} className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="text-[17px] font-medium flex-grow">Настройки чата</div>
      </div>

      <div className="flex-grow overflow-y-auto pt-14 no-scrollbar pb-10">
        <div className="px-4 py-2 text-[13px] text-tg-secondary-text uppercase font-medium">Цвет темы</div>
        <div className="bg-tg-bg-light border-y border-tg-divider mb-6 p-4 flex items-center justify-between">
          <span className="text-[16px]">Основной цвет</span>
          <div className="flex items-center gap-3">
            <span className="text-[14px] text-tg-secondary-text uppercase">{themeColor}</span>
            <input 
              type="color" 
              value={themeColor} 
              onChange={(e) => setThemeColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border-0 p-0"
            />
          </div>
        </div>

        <div className="px-4 py-2 text-[13px] text-tg-secondary-text uppercase font-medium">Обои чата</div>
        <div className="bg-tg-bg-light border-y border-tg-divider p-4 grid grid-cols-3 gap-3">
          {WALLPAPERS.map((bg, idx) => (
            <div 
              key={idx} 
              onClick={() => setWallpaper(bg)}
              className={`relative aspect-[9/16] rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${wallpaper === bg ? 'border-blue-500 scale-95' : 'border-transparent hover:scale-95'}`}
              style={{ backgroundColor: bg ? 'transparent' : '#ebebeb' }}
            >
              {bg && <Image src={bg} alt={`Wallpaper ${idx}`} fill className="object-cover" referrerPolicy="no-referrer" />}
              {!bg && <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">По умолч.</div>}
              {wallpaper === bg && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="bg-blue-500 rounded-full p-1 text-white"><Check size={16} /></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
