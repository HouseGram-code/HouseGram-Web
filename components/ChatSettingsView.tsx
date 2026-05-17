'use client';

/**
 * Настройки чата — переработанный экран. Главные изменения:
 *  - Один источник правды для dark mode: контекст ChatContext (раньше
 *    компонент сам рулил `documentElement.classList`, что конфликтовало
 *    с глобальной темой и приводило к "мерцанию").
 *  - Glass / звуки сообщений / уведомления теперь тоже регулируются
 *    отсюда — раньше про них приходилось искать другую страницу.
 *  - Размер шрифта чата (Compact / Normal / Large) сохраняется в
 *    localStorage и применяется через CSS-переменную --tg-font-scale.
 *  - Превью пузырей с реальными цветами темы и обоями — видно сразу
 *    что получится, без ухода в чат.
 *  - Загрузка пользовательских обоев теперь идёт через /api/upload (тот
 *    же путь, что и остальные файлы), а не напрямую в Firebase Storage,
 *    которое после hardened-rules уже блокирует прямые записи без
 *    проверок. Таким образом фича снова работает.
 *  - Цветовые пресеты темы — клик ставит цвет одной кнопкой.
 */

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Eye,
  Maximize,
  Upload,
  Moon,
  Sun,
  Sparkles,
  Volume2,
  Bell,
  Palette,
  Type as TypeIcon,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { uploadFile } from '@/lib/api-storage';

// Список пресетов обоев — пустая строка == "По умолчанию".
const WALLPAPERS: Array<{ id: string; value: string; label: string }> = [
  { id: 'default', value: '', label: 'Без обоев' },
  { id: 'twilight', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: 'Сумерки' },
  { id: 'sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', label: 'Закат' },
  { id: 'ocean', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', label: 'Океан' },
  { id: 'mint', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', label: 'Мята' },
  { id: 'peach', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', label: 'Персик' },
  { id: 'ink', value: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', label: 'Чернила' },
  { id: 'sky', value: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', label: 'Небо' },
];

const COLOR_PRESETS = [
  '#517da2', // tg classic
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#ec4899',
  '#0ea5e9',
];

type FontScale = 'compact' | 'normal' | 'large';

const FONT_SCALE_VALUES: Record<FontScale, string> = {
  compact: '0.92',
  normal: '1',
  large: '1.12',
};

function applyFontScale(scale: FontScale) {
  const root = document.documentElement;
  root.style.setProperty('--tg-font-scale', FONT_SCALE_VALUES[scale]);
}

export default function ChatSettingsView() {
  const {
    setView,
    themeColor,
    setThemeColor,
    wallpaper,
    setWallpaper,
    isGlassEnabled,
    setIsGlassEnabled,
    isDarkMode,
    setIsDarkMode,
    soundEnabled,
    setSoundEnabled,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useChat();

  const [eyeProtection, setEyeProtection] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fontScale, setFontScale] = useState<FontScale>('normal');
  const [toast, setToast] = useState<string | null>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  // Загрузка локальных предпочтений.
  useEffect(() => {
    const eye = localStorage.getItem('housegram_eye_protection');
    if (eye) setEyeProtection(eye === 'true');

    const font = (localStorage.getItem('housegram_font_scale') as FontScale | null) || 'normal';
    setFontScale(font);
    applyFontScale(font);

    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  // Защита зрения переключает CSS-фильтр.
  useEffect(() => {
    if (eyeProtection) {
      document.documentElement.style.filter = 'sepia(0.1) saturate(0.9)';
    } else {
      document.documentElement.style.filter = '';
    }
  }, [eyeProtection]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const toggleEye = () => {
    const v = !eyeProtection;
    setEyeProtection(v);
    localStorage.setItem('housegram_eye_protection', String(v));
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen error', e);
    }
  };

  const onChangeFont = (scale: FontScale) => {
    setFontScale(scale);
    localStorage.setItem('housegram_font_scale', scale);
    applyFontScale(scale);
  };

  const onPickWallpaper = (value: string) => {
    setWallpaper(value);
    showToast(value ? 'Обои применены' : 'Обои сброшены');
  };

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) {
      // Сбрасываем input на случай повторного выбора того же файла.
      if (wallpaperInputRef.current) wallpaperInputRef.current.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      showToast('Только картинки');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Файл больше 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadFile(file, auth.currentUser.uid, 'image');
      // Используем data: или https: ссылку как background-image.
      const url = result.url;
      setWallpaper(`url(${url})`);
      showToast('Обои применены');
    } catch (err) {
      console.error('Wallpaper upload error', err);
      showToast('Не удалось загрузить');
    } finally {
      setIsUploading(false);
      if (wallpaperInputRef.current) wallpaperInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`absolute inset-0 flex flex-col z-30 ${
        isDarkMode ? 'bg-[#0f0f0f] text-white' : 'bg-tg-profile-bg text-gray-900'
      }`}
    >
      {/* Header */}
      <div
        className={`text-tg-header-text px-2.5 h-14 flex items-center gap-3 shrink-0 absolute top-0 left-0 w-full z-40 transition-colors ${
          isGlassEnabled ? 'backdrop-blur-md border-b border-white/15 shadow-sm' : 'shadow-sm'
        }`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'CC' : themeColor }}
      >
        <button
          onClick={() => setView('settings')}
          className="p-1.5 rounded-full hover:bg-white/15 active:bg-white/25 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-[18px] font-semibold flex-grow tracking-tight">Настройки чата</div>
      </div>

      <div className="flex-grow overflow-y-auto pt-16 pb-10 no-scrollbar">
        {/* Live preview chat bubbles */}
        <div className="px-4 mb-5">
          <div
            className={`relative rounded-2xl overflow-hidden border ${
              isDarkMode ? 'border-white/10' : 'border-black/10'
            } shadow-sm`}
            style={{
              minHeight: 150,
              background: wallpaper && !wallpaper.startsWith('linear')
                ? wallpaper.startsWith('url')
                  ? wallpaper
                  : `url(${wallpaper})`
                : wallpaper || (isDarkMode ? '#181818' : '#ebebeb'),
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/0 dark:bg-black/20" />
            <div className="relative p-4 flex flex-col gap-2.5">
              <div className="self-start max-w-[80%] px-3.5 py-2 rounded-2xl rounded-bl-md bg-white text-gray-900 text-[14px] shadow">
                Привет 👋 Как тебе новые обои?
              </div>
              <div
                className="self-end max-w-[80%] px-3.5 py-2 rounded-2xl rounded-br-md text-white text-[14px] shadow"
                style={{ backgroundColor: themeColor }}
              >
                Очень круто! ✨
              </div>
            </div>
          </div>
          <div className={`text-[12px] mt-2 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Превью чата — настройки применяются мгновенно
          </div>
        </div>

        {/* Внешний вид */}
        <SectionTitle isDarkMode={isDarkMode} title="Внешний вид" />
        <Group isDarkMode={isDarkMode}>
          <Row
            isDarkMode={isDarkMode}
            icon={<Moon size={20} />}
            iconBg="#6366f1"
            title="Тёмная тема"
            subtitle={isDarkMode ? 'Включена' : 'Выключена'}
            right={<Toggle on={isDarkMode} color={themeColor} onClick={() => setIsDarkMode(!isDarkMode)} />}
            onClick={() => setIsDarkMode(!isDarkMode)}
            divider
          />
          <Row
            isDarkMode={isDarkMode}
            icon={<Sparkles size={20} />}
            iconBg="#8b5cf6"
            title="Полупрозрачный хедер"
            subtitle="Glass-эффект на заголовках"
            right={<Toggle on={isGlassEnabled} color={themeColor} onClick={() => setIsGlassEnabled(!isGlassEnabled)} />}
            onClick={() => setIsGlassEnabled(!isGlassEnabled)}
            divider
          />
          <Row
            isDarkMode={isDarkMode}
            icon={<Eye size={20} />}
            iconBg="#22c55e"
            title="Защита зрения"
            subtitle="Лёгкий тёплый фильтр"
            right={<Toggle on={eyeProtection} color={themeColor} onClick={toggleEye} />}
            onClick={toggleEye}
            divider
          />
          <Row
            isDarkMode={isDarkMode}
            icon={<Maximize size={20} />}
            iconBg="#0ea5e9"
            title="Полноэкранный режим"
            subtitle={isFullscreen ? 'Включен' : 'Выключен'}
            right={<Toggle on={isFullscreen} color={themeColor} onClick={toggleFullscreen} />}
            onClick={toggleFullscreen}
          />
        </Group>

        {/* Размер шрифта */}
        <SectionTitle isDarkMode={isDarkMode} title="Размер шрифта" icon={<TypeIcon size={14} />} />
        <Group isDarkMode={isDarkMode}>
          <div className="px-4 py-3 grid grid-cols-3 gap-2.5">
            {(['compact', 'normal', 'large'] as FontScale[]).map((s) => {
              const active = fontScale === s;
              return (
                <button
                  key={s}
                  onClick={() => onChangeFont(s)}
                  className={`relative rounded-2xl py-3 transition-all ${
                    active
                      ? 'text-white shadow-md'
                      : isDarkMode
                      ? 'bg-white/5 text-gray-200 hover:bg-white/10'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={active ? { backgroundColor: themeColor } : undefined}
                >
                  <div
                    className="font-semibold"
                    style={{
                      fontSize:
                        s === 'compact' ? '13px' : s === 'normal' ? '15px' : '17px',
                    }}
                  >
                    Aa
                  </div>
                  <div className="text-[11px] mt-0.5 opacity-80">
                    {s === 'compact' ? 'Компактно' : s === 'normal' ? 'Обычно' : 'Крупно'}
                  </div>
                  {active && (
                    <motion.div
                      layoutId="font-active"
                      className="absolute inset-0 rounded-2xl ring-2 ring-white/40 pointer-events-none"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </Group>

        {/* Цвет темы */}
        <SectionTitle isDarkMode={isDarkMode} title="Цвет темы" icon={<Palette size={14} />} />
        <Group isDarkMode={isDarkMode}>
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => {
                const selected = c.toLowerCase() === themeColor.toLowerCase();
                return (
                  <motion.button
                    key={c}
                    onClick={() => setThemeColor(c)}
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.06 }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm border-2 transition-all ${
                      selected
                        ? 'border-white'
                        : isDarkMode
                        ? 'border-transparent'
                        : 'border-transparent'
                    }`}
                    style={{
                      backgroundColor: c,
                      boxShadow: selected ? `0 0 0 3px ${c}55` : undefined,
                    }}
                    aria-label={c}
                  >
                    {selected && <Check size={16} className="text-white drop-shadow" />}
                  </motion.button>
                );
              })}
              {/* Кастомный colorpicker */}
              <label
                className={`w-9 h-9 rounded-full relative overflow-hidden cursor-pointer flex items-center justify-center text-[10px] font-semibold border-2 ${
                  isDarkMode ? 'border-white/15 text-gray-200' : 'border-black/10 text-gray-700'
                }`}
                title="Свой цвет"
                style={{
                  background:
                    'conic-gradient(from 180deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                }}
              >
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <span className="bg-white/85 rounded-full px-1.5 py-0.5 text-[10px] text-gray-900 z-10">
                  +
                </span>
              </label>
            </div>
            <div className={`text-[12px] mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Текущий: <span className="font-mono uppercase">{themeColor}</span>
            </div>
          </div>
        </Group>

        {/* Звук и уведомления */}
        <SectionTitle isDarkMode={isDarkMode} title="Звук и уведомления" />
        <Group isDarkMode={isDarkMode}>
          <Row
            isDarkMode={isDarkMode}
            icon={<Bell size={20} />}
            iconBg="#ef4444"
            title="Уведомления"
            subtitle="Push в браузере и системе"
            right={
              <Toggle
                on={notificationsEnabled}
                color={themeColor}
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              />
            }
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            divider
          />
          <Row
            isDarkMode={isDarkMode}
            icon={<Volume2 size={20} />}
            iconBg="#10b981"
            title="Звуки сообщений"
            subtitle="Тихий звук при отправке/получении"
            right={
              <Toggle
                on={soundEnabled}
                color={themeColor}
                onClick={() => setSoundEnabled(!soundEnabled)}
              />
            }
            onClick={() => setSoundEnabled(!soundEnabled)}
          />
        </Group>

        {/* Обои */}
        <SectionTitle isDarkMode={isDarkMode} title="Обои чата" icon={<ImageIcon size={14} />} />
        <Group isDarkMode={isDarkMode} padding>
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
            className="w-full mb-4 px-4 py-3 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 shadow-md"
            style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}aa)` }}
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Загрузка...</span>
              </>
            ) : (
              <>
                <Upload size={18} />
                <span>Загрузить свои обои</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-3 gap-3">
            {WALLPAPERS.map((bg) => {
              const selected = wallpaper === bg.value;
              return (
                <motion.button
                  key={bg.id}
                  onClick={() => onPickWallpaper(bg.value)}
                  whileHover={{ scale: 0.98 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                    selected
                      ? 'border-white shadow-lg'
                      : isDarkMode
                      ? 'border-white/10'
                      : 'border-transparent'
                  }`}
                  style={{
                    background: bg.value || (isDarkMode ? '#1f1f1f' : '#ebebeb'),
                    boxShadow: selected ? `0 0 0 3px ${themeColor}55` : undefined,
                  }}
                  aria-label={bg.label}
                >
                  {!bg.value && (
                    <div
                      className={`absolute inset-0 flex items-center justify-center text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      Без обоев
                    </div>
                  )}
                  {selected && (
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div
                        className="rounded-full p-1.5 text-white shadow-md"
                        style={{ backgroundColor: themeColor }}
                      >
                        <Check size={16} />
                      </div>
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 right-1 text-[10.5px] font-medium text-white drop-shadow text-center">
                    {bg.label}
                  </span>
                </motion.button>
              );
            })}

            {/* Превью кастомного обоев, если задан url(...) */}
            {wallpaper && wallpaper.startsWith('url') && (
              <div
                className="relative aspect-[9/16] rounded-2xl overflow-hidden border-2 shadow-lg"
                style={{
                  borderColor: 'white',
                  boxShadow: `0 0 0 3px ${themeColor}55`,
                  backgroundImage: wallpaper,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <button
                  onClick={() => onPickWallpaper('')}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center"
                  aria-label="Сбросить"
                >
                  <X size={14} />
                </button>
                <span className="absolute bottom-1 left-1 right-1 text-[10.5px] font-medium text-white drop-shadow text-center">
                  Свои
                </span>
              </div>
            )}
          </div>
        </Group>
      </div>

      {/* Mini toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-6 px-4 py-2 rounded-full text-[13px] font-medium shadow-lg z-50"
            style={{
              background: isDarkMode ? '#222' : 'rgba(0,0,0,0.85)',
              color: 'white',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =====================================================================
// Маленькие переиспользуемые блоки. Не выносим отдельным файлом — пока
// они нужны только тут.
// =====================================================================

function SectionTitle({
  isDarkMode,
  title,
  icon,
}: {
  isDarkMode: boolean;
  title: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`px-5 mt-2 mb-1.5 text-[12px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
        isDarkMode ? 'text-gray-400' : 'text-gray-500'
      }`}
    >
      {icon}
      {title}
    </div>
  );
}

function Group({
  isDarkMode,
  children,
  padding,
}: {
  isDarkMode: boolean;
  children: React.ReactNode;
  padding?: boolean;
}) {
  return (
    <div
      className={`mx-3 mb-5 rounded-2xl overflow-hidden shadow-sm ${
        isDarkMode ? 'bg-[#1a1a1a] border border-white/5' : 'bg-white'
      } ${padding ? 'p-4' : ''}`}
    >
      {children}
    </div>
  );
}

function Row({
  isDarkMode,
  icon,
  iconBg,
  title,
  subtitle,
  right,
  onClick,
  divider,
}: {
  isDarkMode: boolean;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  divider?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isDarkMode
          ? 'hover:bg-white/5 active:bg-white/10'
          : 'hover:bg-gray-50 active:bg-gray-100'
      } ${
        divider
          ? isDarkMode
            ? 'border-b border-white/5'
            : 'border-b border-gray-100'
          : ''
      }`}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <div className="flex-grow min-w-0">
        <div className={`text-[15.5px] font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </div>
        {subtitle && (
          <div className={`text-[12.5px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {subtitle}
          </div>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </button>
  );
}

function Toggle({
  on,
  color,
  onClick,
}: {
  on: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <span
      role="switch"
      aria-checked={on}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="relative inline-block w-11 h-6 rounded-full transition-colors cursor-pointer"
      style={{ backgroundColor: on ? color : '#cbd5e1' }}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow"
        animate={{ x: on ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </span>
  );
}
