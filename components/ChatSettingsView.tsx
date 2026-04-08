'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Eye, Maximize } from 'lucide-react';
import { useState, useEffect } from 'react';

const WALLPAPERS = [
  '',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
];

export default function ChatSettingsView() {
  const { setView, themeColor, setThemeColor, wallpaper, setWallpaper, isGlassEnabled } = useChat();
  const [eyeProtection, setEyeProtection] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('housegram_eye_protection');
    if (saved) setEyeProtection(saved === 'true');
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleEyeProtection = () => {
    const newValue = !eyeProtection;
    setEyeProtection(newValue);
    localStorage.setItem('housegram_eye_protection', String(newValue));
    
    if (newValue) {
      document.documentElement.style.filter = 'sepia(0.1) saturate(0.9)';
    } else {
      document.documentElement.style.filter = '';
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  useEffect(() => {
    if (eyeProtection) {
      document.documentElement.style.filter = 'sepia(0.1) saturate(0.9)';
    }
    return () => {
      document.documentElement.style.filter = '';
    };
  }, [eyeProtection]);

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
        {/* Eye Protection */}
        <div className="px-4 py-2 text-[13px] text-tg-secondary-text uppercase font-medium">Комфорт</div>
        <div className="bg-tg-bg-light border-y border-tg-divider mb-6">
          <div 
            onClick={toggleEyeProtection}
            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-tg-divider"
          >
            <div className="flex items-center gap-3">
              <Eye size={24} className="text-green-500" />
              <div>
                <div className="text-[16px] text-tg-text-primary flex items-center gap-2">
                  Защита зрения
                  <span className="px-2 py-0.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[11px] font-bold rounded uppercase tracking-wide">
                    NEW
                  </span>
                </div>
                <div className="text-[13px] text-tg-secondary-text">Снижает нагрузку на глаза</div>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full transition-colors relative ${eyeProtection ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${eyeProtection ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </div>
          
          <div 
            onClick={toggleFullscreen}
            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Maximize size={24} className="text-blue-500" />
              <div>
                <div className="text-[16px] text-tg-text-primary">Полноэкранный режим</div>
                <div className="text-[13px] text-tg-secondary-text">
                  {isFullscreen ? 'Включен' : 'Выключен'}
                </div>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full transition-colors relative ${isFullscreen ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${isFullscreen ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </div>
        </div>

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
              style={{ background: bg || '#ebebeb' }}
            >
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
