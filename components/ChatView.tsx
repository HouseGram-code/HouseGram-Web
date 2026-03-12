'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Paperclip, Send, Mic, MoreVertical, Check, CheckCheck, Clock, Smile, Image as ImageIcon, Music, File, Square, Bookmark, CheckCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';

const isOnlyEmojis = (str: string) => {
  const noSpace = str.replace(/\s/g, '');
  if (!noSpace) return false;
  return /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D\p{Emoji_Modifier}]+$/u.test(noSpace);
};

export default function ChatView() {
  const { contacts, activeChatId, setView, sendMessage, themeColor, wallpaper, isGlassEnabled, clearHistory, deleteChat } = useChat();
  const [inputText, setInputText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contact = activeChatId ? contacts[activeChatId] : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [contact?.messages, contact?.isTyping]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  if (!contact) return null;

  const handleSend = () => {
    if (inputText.trim() && !contact.isBlocked) {
      sendMessage(inputText.trim());
      setInputText('');
      setShowEmojiPicker(false);
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setInputText(prev => prev + emojiData.emoji);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        sendMessage('Голосовое сообщение', { audioUrl });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone', err);
      alert('Нет доступа к микрофону');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      sendMessage(`Файл: ${file.name}`, { fileUrl, fileName: file.name });
    }
    setShowAttachMenu(false);
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-tg-bg-light flex flex-col z-10"
    >
      <div 
        className={`text-tg-header-text px-2.5 h-12 flex items-center gap-2.5 shrink-0 transition-colors absolute top-0 left-0 w-full z-30 ${isGlassEnabled ? 'backdrop-blur-md border-b border-black/10' : ''}`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'CC' : themeColor }}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setView('menu'); }} 
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors mr-1"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div 
          className="flex items-center gap-2.5 cursor-pointer hover:bg-white/5 p-1 rounded-md transition-colors"
          onClick={() => setView('profile')}
        >
          {contact.id === 'saved_messages' ? (
            <div 
              className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: contact.avatarColor }}
            >
              <Bookmark size={20} fill="currentColor" />
            </div>
          ) : contact.avatarUrl ? (
            <Image 
              src={contact.avatarUrl} 
              alt={contact.name} 
              width={38} 
              height={38} 
              className="rounded-full object-cover shrink-0" 
              referrerPolicy="no-referrer"
              unoptimized
            />
          ) : (
            <div 
              className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-white font-medium text-[16px] shrink-0"
              style={{ backgroundColor: contact.avatarColor }}
            >
              {contact.initial}
            </div>
          )}
          <div className="flex-grow leading-tight pointer-events-none">
            <div className="font-medium text-[16px] flex items-center gap-1">
              {contact.name}
              {contact.isChannel && <CheckCircle size={14} className="text-blue-500 fill-blue-500 text-white" />}
            </div>
            <div className="text-[13px] text-[#d1e0ec]">
              {contact.isChannel ? contact.statusOffline : (contact.isTyping ? 'печатает...' : contact.statusOffline)}
            </div>
          </div>
        </div>

        <div className="flex-grow"></div>

        {!contact.isChannel && (
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <MoreVertical size={24} />
            </button>
            
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-2 top-full mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50 text-black">
                  <button 
                    onClick={() => { setShowClearModal(true); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-[15px]"
                  >
                    Очистить историю
                  </button>
                  <button 
                    onClick={() => { setShowDeleteModal(true); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-[15px] text-red-500"
                  >
                    Удалить чат
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div 
        className="flex-grow overflow-y-auto p-2.5 pt-14 flex flex-col no-scrollbar relative z-10"
        style={{ 
          backgroundImage: wallpaper ? `url('${wallpaper}')` : 'none',
          backgroundColor: wallpaper ? 'transparent' : 'var(--tg-bg-dark)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        onClick={() => { setShowEmojiPicker(false); setShowAttachMenu(false); }}
      >
        {contact.id === 'saved_messages' && contact.messages.length === 0 && (
          <div className="flex-grow flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 max-w-sm text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-500 mx-auto flex items-center justify-center mb-4">
                <Bookmark size={32} fill="currentColor" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Избранное</h3>
              <p className="text-[15px] text-gray-600 leading-relaxed">
                Здесь можно сохранять сообщения, медиа и другие файлы.<br/><br/>
                Отправьте сюда текст, фото или видео, чтобы сохранить их. Они будут доступны на всех ваших устройствах.
              </p>
            </div>
          </div>
        )}

        {contact.isChannel && contact.messages.length === 0 && (
          <div className="flex-grow flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 max-w-sm text-center shadow-sm">
              <p className="text-[15px] text-gray-600 leading-relaxed">
                Постов пока нет.
              </p>
            </div>
          </div>
        )}

        {contact.messages.map((msg) => {
          const onlyEmojis = isOnlyEmojis(msg.text);
          const emojiCount = Array.from(msg.text.replace(/\s/g, '')).length;
          const isJumbo = onlyEmojis && emojiCount <= 5 && !msg.audioUrl && !msg.fileUrl;

          return (
            <div 
              key={msg.id} 
              className={`message max-w-[75%] px-3 py-1.5 mb-1.5 rounded-[18px] relative break-words flex flex-col ${
                isJumbo 
                  ? `bg-transparent ${msg.type === 'sent' ? 'self-end' : 'self-start'}`
                  : msg.type === 'sent' 
                    ? 'bg-tg-sent-bubble self-end rounded-br-[5px] message-tail-sent shadow-sm text-[15px] leading-snug' 
                    : 'bg-tg-received-bubble self-start rounded-bl-[5px] message-tail-received shadow-sm text-[15px] leading-snug'
              }`}
            >
              {msg.audioUrl ? (
                <div className="mb-1">
                  <audio controls src={msg.audioUrl} className="h-8 w-48" />
                </div>
              ) : msg.fileUrl ? (
                <div className="flex items-center gap-2 mb-1 bg-black/5 p-2 rounded-lg">
                  <div className="p-2 bg-blue-500 text-white rounded-full"><File size={16} /></div>
                  <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate max-w-[150px]">{msg.fileName}</a>
                </div>
              ) : isJumbo ? (
                <div className={`flex flex-wrap gap-1 items-center ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                  {Array.from(new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(msg.text)).map((segment, i) => (
                    <AppleEmoji key={i} emoji={segment.segment} />
                  ))}
                </div>
              ) : (
                <span className="mb-0.5 text-tg-text-primary">
                  {msg.text}
                </span>
              )}
              
              <div className={`text-[11px] select-none relative z-10 pl-2 self-end mt-auto -mb-0.5 flex items-center gap-1 ${
                isJumbo ? 'bg-black/20 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm mt-1' :
                msg.type === 'sent' ? 'text-[#70a050]' : 'text-tg-secondary-text'
              }`}>
                <span>{msg.time}</span>
                {msg.type === 'sent' && (
                  msg.status === 'sending' ? <Clock size={12} /> :
                  msg.status === 'read' ? <CheckCheck size={14} /> : <Check size={14} />
                )}
              </div>
            </div>
          );
        })}
        
        {contact.isTyping && !contact.isBlocked && (
          <div className="flex items-center px-3 py-2 bg-tg-received-bubble self-start rounded-[18px] rounded-bl-[5px] message-tail-received relative shadow-sm mb-1.5">
            <div className="dot-flashing"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 350, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="z-20 bg-white border-t border-gray-200 overflow-hidden flex flex-col"
          >
            <div className="flex items-center gap-4 p-2 border-b border-gray-100 bg-gray-50 overflow-x-auto no-scrollbar">
              <span className="text-xs font-medium text-gray-500 uppercase shrink-0">Анимированные:</span>
              <button onClick={() => setInputText(prev => prev + '🔥')} className="text-2xl hover:scale-110 transition-transform">🔥</button>
              <button onClick={() => setInputText(prev => prev + '❤️')} className="text-2xl hover:scale-110 transition-transform">❤️</button>
              <button onClick={() => setInputText(prev => prev + '👍')} className="text-2xl hover:scale-110 transition-transform">👍</button>
              <button onClick={() => setInputText(prev => prev + '🎉')} className="text-2xl hover:scale-110 transition-transform">🎉</button>
              <button onClick={() => setInputText(prev => prev + '😂')} className="text-2xl hover:scale-110 transition-transform">😂</button>
            </div>
            <div className="flex-grow">
              <EmojiPicker onEmojiClick={handleEmojiClick} width="100%" height={300} searchDisabled={false} skinTonesDisabled emojiStyle={EmojiStyle.APPLE} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {contact.isBlocked || contact.isChannel ? (
        <div className={`flex items-center justify-center px-2.5 py-3 border-t border-tg-divider shrink-0 gap-1.5 z-20 transition-colors ${isGlassEnabled ? 'backdrop-blur-xl bg-white/60' : 'bg-tg-input-bg'}`}>
          <span className="text-tg-secondary-text text-[15px]">
            {contact.isBlocked ? 'Вы заблокировали этого пользователя' : 'Только администраторы могут отправлять сообщения'}
          </span>
        </div>
      ) : (
        <div className={`flex items-end px-2.5 py-2 border-t border-tg-divider shrink-0 gap-1.5 z-30 transition-colors relative ${isGlassEnabled ? 'backdrop-blur-xl bg-white/60' : 'bg-tg-input-bg'}`}>
          
          {/* Attachment Menu */}
          <AnimatePresence>
            {showAttachMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-14 left-2 bg-white rounded-xl shadow-lg border border-gray-100 p-2 flex flex-col gap-1 z-50 min-w-[160px]"
              >
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left text-[15px]">
                  <div className="text-blue-500"><ImageIcon size={20} /></div>
                  <span>Фото / Видео</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left text-[15px]">
                  <div className="text-orange-500"><Music size={20} /></div>
                  <span>Музыка</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left text-[15px]">
                  <div className="text-green-500"><File size={20} /></div>
                  <span>Файл</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-1.5 mb-0.5 text-tg-secondary-text hover:text-gray-600 transition-colors"
          >
            <Paperclip size={24} />
          </button>
          
          <div className="flex-grow flex items-center bg-transparent relative">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isRecording ? "Запись..." : "Сообщение"}
              disabled={isRecording}
              className="flex-grow border-none outline-none py-2 px-1 text-[16px] bg-transparent resize-none max-h-[100px] leading-snug m-0 self-stretch placeholder-tg-placeholder-text text-tg-text-primary disabled:opacity-50"
            />
            {!isRecording && (
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 text-tg-secondary-text hover:text-gray-600 transition-colors"
              >
                <Smile size={24} />
              </button>
            )}
          </div>

          {isRecording ? (
            <div className="flex items-center gap-2 mb-0.5">
              <div className="flex items-center gap-1.5 px-2 text-red-500 font-medium">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {formatTime(recordingTime)}
              </div>
              <button 
                onClick={stopRecording}
                className="w-10 h-10 p-2 rounded-full flex items-center justify-center text-white bg-red-500 hover:brightness-110 active:scale-90 transition-all"
              >
                <Square size={16} fill="currentColor" />
              </button>
            </div>
          ) : inputText.trim() ? (
            <button 
              onClick={handleSend}
              className="w-10 h-10 p-2 rounded-full mb-0.5 flex items-center justify-center text-white hover:brightness-110 active:scale-90 transition-all"
              style={{ backgroundColor: themeColor }}
            >
              <Send size={20} className="ml-0.5" />
            </button>
          ) : (
            <button 
              onClick={startRecording}
              className="p-1.5 mb-0.5 text-tg-secondary-text hover:text-gray-600 transition-colors"
            >
              <Mic size={24} />
            </button>
          )}
        </div>
      )}

      {/* Clear History Modal */}
      <AnimatePresence>
        {showClearModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50" onClick={() => setShowClearModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden z-10"
            >
              <div className="p-5">
                <h3 className="text-[18px] font-medium text-black mb-2">Очистить историю</h3>
                <p className="text-[15px] text-gray-600">Вы уверены, что хотите удалить все сообщения в этом чате? Это действие нельзя отменить.</p>
              </div>
              <div className="flex border-t border-gray-200">
                <button 
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 py-3 text-[16px] font-medium text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-200"
                >
                  Отмена
                </button>
                <button 
                  onClick={() => { if(activeChatId) clearHistory(activeChatId); setShowClearModal(false); }}
                  className="flex-1 py-3 text-[16px] font-medium text-red-500 hover:bg-gray-50 transition-colors"
                >
                  Очистить
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Chat Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden z-10"
            >
              <div className="p-5">
                <h3 className="text-[18px] font-medium text-black mb-2">Удалить чат</h3>
                <p className="text-[15px] text-gray-600">Вы уверены, что хотите удалить чат с {contact.name}? Это действие нельзя отменить.</p>
              </div>
              <div className="flex border-t border-gray-200">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 text-[16px] font-medium text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-200"
                >
                  Отмена
                </button>
                <button 
                  onClick={() => { if(activeChatId) deleteChat(activeChatId); setShowDeleteModal(false); }}
                  className="flex-1 py-3 text-[16px] font-medium text-red-500 hover:bg-gray-50 transition-colors"
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AppleEmoji({ emoji }: { emoji: string }) {
  const [error, setError] = useState(false);
  const unified = Array.from(emoji)
    .map(char => char.codePointAt(0)?.toString(16))
    .filter(code => code !== 'fe0f')
    .join('-');

  if (error) {
    return <span className="text-[64px] leading-none">{emoji}</span>;
  }

  return (
    <img
      src={`https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${unified}.png`}
      alt={emoji}
      className="w-16 h-16 object-contain"
      onError={() => setError(true)}
    />
  );
}
