'use client';

import { memo, useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Paperclip, Send, Mic, Smile, Square, X } from 'lucide-react';

interface ChatInputProps {
  isRecording: boolean;
  recordingTime: number;
  isBlocked: boolean;
  editingMsg: { id: string; text: string } | null;
  replyingTo: { messageId: string; senderName: string; text: string } | null;
  themeColor: string;
  isGlassEnabled: boolean;
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

  const handleChange = useCallback((text: string) => {
    setInputText(text);
    onInputChange(text);
  }, [onInputChange]);

  const handleSend = useCallback(() => {
    if (inputText.trim()) {
      onSend(inputText.trim());
      setInputText('');
    }
  }, [inputText, onSend]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isBlocked) {
    return (
      <div className={`flex items-center justify-center px-2.5 py-3 border-t border-tg-divider shrink-0 gap-1.5 z-20 transition-colors ${isGlassEnabled ? 'backdrop-blur-xl bg-white/60' : 'bg-tg-input-bg'}`}>
        <span className="text-tg-secondary-text text-[15px]">Вы заблокировали этого пользователя</span>
      </div>
    );
  }

  return (
    <div className={`flex items-end px-2.5 py-2 border-t border-tg-divider shrink-0 gap-1.5 z-30 transition-colors relative ${isGlassEnabled ? 'backdrop-blur-xl bg-white/60' : 'bg-tg-input-bg'}`}>
      <button 
        onClick={onShowAttachMenu} 
        className="p-1.5 mb-0.5 text-tg-secondary-text hover:text-gray-600 transition-colors"
      >
        <Paperclip size={24} />
      </button>

      <div className="flex-grow flex flex-col bg-transparent relative">
        {replyingTo && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-t-lg border-l-2" style={{ borderColor: themeColor }}>
            <div className="flex-grow min-w-0">
              <div className="text-[13px] font-medium" style={{ color: themeColor }}>{replyingTo.senderName}</div>
              <div className="text-[13px] text-gray-500 truncate">{replyingTo.text}</div>
            </div>
            <button onClick={onCancelReply} className="text-gray-400 hover:text-gray-600 shrink-0"><X size={16} /></button>
          </div>
        )}
        <div className="flex items-center">
          <input
            id="message-input"
            name="message"
            type="text"
            value={inputText}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isRecording ? "Запись..." : editingMsg ? "Редактировать..." : "Сообщение"}
            disabled={isRecording}
            autoComplete="off"
            className="flex-grow border-none outline-none py-2 px-1 text-[16px] bg-transparent resize-none max-h-[100px] leading-snug m-0 self-stretch placeholder-tg-placeholder-text text-tg-text-primary disabled:opacity-50 focus:placeholder-opacity-50 transition-all"
          />
          {!isRecording && (
            <button onClick={onShowPicker} className="p-1.5 text-tg-secondary-text hover:text-gray-600 transition-colors">
              <Smile size={24} />
            </button>
          )}
        </div>
      </div>

      {isRecording ? (
        <div className="flex items-center gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 px-2 text-red-500 font-medium">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />{formatTime(recordingTime)}
          </div>
          <button onClick={onStopRecording} className="w-10 h-10 p-2 rounded-full flex items-center justify-center text-white bg-red-500 hover:brightness-110 active:scale-90 transition-all">
            <Square size={16} fill="currentColor" />
          </button>
        </div>
      ) : inputText.trim() ? (
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSend} 
          className="w-10 h-10 p-2 rounded-full mb-0.5 flex items-center justify-center text-white hover:brightness-110 active:scale-90 transition-all shadow-lg" 
          style={{ backgroundColor: themeColor }}
        >
          <Send size={20} className="ml-0.5" />
        </motion.button>
      ) : (
        <button onClick={onStartRecording} className="p-1.5 mb-0.5 text-tg-secondary-text hover:text-gray-600 transition-colors">
          <Mic size={24} />
        </button>
      )}
    </div>
  );
});

export default ChatInput;
