'use client';

import { memo, useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Paperclip, Send, Mic, Smile, Square, X, Image as ImageIcon, File as FileIcon } from 'lucide-react';

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
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            className="w-11 h-11 rounded-full text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow shrink-0"
            style={{ backgroundColor: themeColor }}
          >
            <Send size={20} className="ml-0.5" />
          </motion.button>
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
    </div>
  );
});

export default ChatInput;
