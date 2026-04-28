'use client';

import { memo, useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Paperclip, Send, Mic, Smile, Square, X, Image as ImageIcon, File as FileIcon, Clock } from 'lucide-react';

interface ChatInputProps {
  isRecording: boolean;
  recordingTime: number;
  isBlocked: boolean;
  editingMsg: { id: string; text: string } | null;
  replyingTo: { messageId: string; senderName: string; text: string } | null;
  themeColor: string;
  isGlassEnabled: boolean;
  isDarkMode?: boolean;
  onSend: (text: string) => void;
  onScheduleSend: (text: string, scheduledDate: Date) => void;
  onInputChange: (text: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelEdit: () => void;
  onCancelReply: () => void;
  onShowPicker: () => void;
  onShowAttachMenu: () => void;
  showAttachMenu: boolean;
}

const ChatInput = memo(function ChatInput({
  isRecording,
  recordingTime,
  isBlocked,
  editingMsg,
  replyingTo,
  themeColor,
  isGlassEnabled,
  isDarkMode = false,
  onSend,
  onScheduleSend,
  onInputChange,
  onStartRecording,
  onStopRecording,
  onCancelEdit,
  onCancelReply,
  onShowPicker,
  onShowAttachMenu,
  showAttachMenu
}: ChatInputProps) {
  const [inputText, setInputText] = useState(editingMsg?.text || '');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Синхронизация с editingMsg
  useEffect(() => {
    if (editingMsg) {
      setInputText(editingMsg.text);
    }
  }, [editingMsg]);

  const handleChange = useCallback((text: string) => {
    setInputText(text);
    onInputChange(text);
    
    // Автоматическая высота textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [onInputChange]);

  const handleSend = useCallback(() => {
    if (inputText.trim()) {
      onSend(inputText.trim());
      setInputText('');
      // Сброс высоты
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  }, [inputText, onSend]);

  const handleScheduleSend = useCallback((scheduledDate: Date) => {
    if (inputText.trim()) {
      onScheduleSend(inputText.trim(), scheduledDate);
      setInputText('');
      // Сброс высоты
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  }, [inputText, onScheduleSend]);

  // Обработка долгого нажатия для запланированных сообщений
  const handleSendMouseDown = useCallback(() => {
    if (!inputText.trim()) return;
    
    const timer = setTimeout(() => {
      setShowScheduleModal(true);
      // Вибрация при долгом нажатии (если поддерживается)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms для долгого нажатия
    
    setLongPressTimer(timer);
  }, [inputText]);

  const handleSendMouseUp = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const handleSendClick = useCallback(() => {
    // Если таймер еще активен, значит это обычный клик
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      handleSend();
    }
  }, [longPressTimer, handleSend]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isBlocked) {
    return (
      <div className={`flex items-center justify-center px-4 py-3 border-t border-gray-200 shrink-0 ${isGlassEnabled ? 'backdrop-blur-xl bg-white/80' : 'bg-white'}`}>
        <span className="text-gray-500 text-[15px]">Вы заблокировали этого пользователя</span>
      </div>
    );
  }

  return (
    <div className={`shrink-0 border-t border-gray-200 ${isGlassEnabled ? 'backdrop-blur-xl bg-white/80' : 'bg-white'}`}>
      {/* Reply Preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-gray-100"
          >
            <div className="flex items-start gap-2 px-4 py-2">
              <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: themeColor }}></div>
              <div className="flex-grow min-w-0">
                <div className="text-[13px] font-medium mb-0.5" style={{ color: themeColor }}>
                  {replyingTo.senderName}
                </div>
                <div className="text-[13px] text-gray-500 truncate">
                  {replyingTo.text || 'Медиа'}
                </div>
              </div>
              <button 
                onClick={onCancelReply} 
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 p-1"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Mode Banner */}
      <AnimatePresence>
        {editingMsg && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-blue-50 border-b border-blue-100"
          >
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="text-[13px] text-blue-600 font-medium">Редактирование сообщения</div>
              <div className="flex-grow"></div>
              <button 
                onClick={onCancelEdit} 
                className="text-blue-600 hover:text-blue-700 transition-colors text-[13px] font-medium"
              >
                Отмена
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Area */}
      <div className="flex items-end gap-2 px-3 py-3">
        {/* Attach Button */}
        {!isRecording && (
          <motion.button
            whileHover={{ scale: 1.1, rotate: 45 }}
            whileTap={{ scale: 0.9 }}
            onClick={onShowAttachMenu}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors shrink-0 mb-1"
          >
            <Paperclip size={24} />
          </motion.button>
        )}

        {/* Input Container */}
        <div className="flex-grow flex items-end bg-gray-100 rounded-[20px] px-3 py-2 min-h-[44px]">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isRecording ? "Запись..." : editingMsg ? "Редактировать сообщение..." : "Сообщение"}
            disabled={isRecording}
            rows={1}
            className="flex-grow bg-transparent border-none outline-none resize-none text-[16px] text-gray-900 placeholder-gray-400 leading-[22px] max-h-[120px] overflow-y-auto"
            style={{
              minHeight: '22px',
            }}
          />
          
          {/* Emoji Button */}
          {!isRecording && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onShowPicker}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors shrink-0 ml-1"
            >
              <Smile size={24} />
            </motion.button>
          )}
        </div>

        {/* Send/Mic Button */}
        {isRecording ? (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 rounded-full">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-500"
              />
              <span className="text-red-500 font-medium text-[14px]">{formatTime(recordingTime)}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onStopRecording}
              className="w-11 h-11 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
            >
              <Square size={18} fill="currentColor" />
            </motion.button>
          </div>
        ) : inputText.trim() ? (
          <div className="relative shrink-0">
            <motion.button
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onMouseDown={handleSendMouseDown}
              onMouseUp={handleSendMouseUp}
              onMouseLeave={handleSendMouseUp}
              onTouchStart={handleSendMouseDown}
              onTouchEnd={handleSendMouseUp}
              onClick={handleSendClick}
              className="w-11 h-11 rounded-full text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden"
              style={{ backgroundColor: themeColor }}
            >
              <Send size={20} className="ml-0.5 relative z-10" />
              
              {/* Long press indicator */}
              {longPressTimer && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 rounded-full"
                >
                  <div className="absolute inset-0 rounded-full border-2 border-white/30">
                    <motion.div
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.5, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-2 border-transparent border-t-white"
                    />
                  </div>
                </motion.div>
              )}
            </motion.button>
            
            {/* Tooltip */}
            <AnimatePresence>
              {longPressTimer && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  className={`absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                    isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'
                  } shadow-lg`}
                >
                  <Clock size={12} className="inline mr-1" />
                  Запланировать
                  <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onStartRecording}
            className="w-11 h-11 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
          >
            <Mic size={24} />
          </motion.button>
        )}
      </div>

      {/* Schedule Message Modal */}
      <ScheduleMessageModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={handleScheduleSend}
        themeColor={themeColor}
        isDarkMode={isDarkMode}
      />
    </div>
  );
});

// Импорт модального окна
import ScheduleMessageModal from './ScheduleMessageModal';

export default ChatInput;
