'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Eye, Maximize, Upload, Moon, Sun, Palette } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '@/lib/firebase';

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
  const [darkMode, setDarkMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('housegram_eye_protection');
    if (saved) setEyeProtection(saved === 'true');
    
    const savedDarkMode = localStorage.getItem('housegram_dark_mode');
    if (savedDarkMode) {
      const isDark = savedDarkMode === 'true';
      setDarkMode(isDark);
      applyDarkMode(isDark);
    }
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const applyDarkMode = (enabled: boolean) => {
    if (enabled) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#1a1a1a';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#ffffff';
    }
  };

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('housegram_dark_mode', String(newValue));
    applyDarkMode(newValue);
  };

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `wallpapers/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setWallpaper(`url(${url})`);
    } catch (error) {
      console.error('Error uploading wallpaper:', error);
      alert('Ошибка при загрузке обоев');
    } finally {
      setIsUploading(false);
    }
  };

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
            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors border-b border-tg-divider"
          >
            <div className="flex items-center gap-3">
              <Eye size={24} className="text-green-500" />
              <div>
                <div className="text-[16px] text-tg-text-primary">Защита зрения</div>
                <div className="text-[13px] text-tg-secondary-text">Снижает нагрузку на глаза</div>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full transition-colors relative ${eyeProtection ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${eyeProtection ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </div>
          
          <div 
            onClick={toggleFullscreen}
            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors"
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
        <div className="bg-tg-bg-light border-y border-tg-divider p-4">
          <input 
            type="file" 
            ref={wallpaperInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleWallpaperUpload} 
          />
          
          <button
            onClick={() => wallpaperInputRef.current?.click()}
            disabled={isUploading}
            className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Загрузка...</span>
              </>
            ) : (
              <>
                <Upload size={20} />
                <span>Загрузить свои обои</span>
              </>
            )}
          </button>
          
          <div className="grid grid-cols-3 gap-3">
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
      </div>
    </motion.div>
  );
}
