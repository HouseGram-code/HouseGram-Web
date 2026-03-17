'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Paperclip, Send, Mic, MoreVertical, Check, CheckCheck, Clock, Smile, Image as ImageIcon, Music, File, Square, Bookmark, CheckCircle, BadgeCheck, Phone, Video, PhoneOff } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import { auth, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ReactPlayer from 'react-player';
import { useDropzone } from 'react-dropzone';

const isOnlyEmojis = (str: string) => {
  const noSpace = str.replace(/\s/g, '');
  if (!noSpace) return false;
  return /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D\p{Emoji_Modifier}]+$/u.test(noSpace);
};

export default function ChatView() {
  const { contacts, activeChatId, setView, sendMessage, editMessage, deleteMessage, forwardMessage, themeColor, wallpaper, isGlassEnabled, clearHistory, deleteChat, addReaction } = useChat();
  const [inputText, setInputText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [callDuration, setCallDuration] = useState(0);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  
  // Message actions state
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCalling) {
      interval = setInterval(() => setCallDuration(p => p + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isCalling]);

  const startCall = (type: 'audio' | 'video') => {
    setCallType(type);
    setIsCalling(true);
  };

  const handleFileUpload = async (file: File) => {
    if (file) {
      setShowAttachMenu(false);
      setIsUploadingFile(true);
      try {
        let fileToUpload = file;
        if (file.type.startsWith('image/')) {
          const imageCompression = (await import('browser-image-compression')).default;
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          fileToUpload = await imageCompression(file, options);
        }

        const storageRef = ref(storage, `files/${auth.currentUser?.uid}/${Date.now()}_${fileToUpload.name}`);
        await uploadBytes(storageRef, fileToUpload);
        const fileUrl = await getDownloadURL(storageRef);
        
        let messageText = `Файл: ${fileToUpload.name}`;
        if (fileToUpload.type.startsWith('image/')) messageText = 'Фото';
        else if (fileToUpload.type.startsWith('video/')) messageText = 'Видео';
        else if (fileToUpload.type.startsWith('audio/')) messageText = 'Аудио';

        sendMessage(messageText, { fileUrl, fileName: fileToUpload.name, fileType: fileToUpload.type });
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Ошибка при загрузке файла');
      } finally {
        setIsUploadingFile(false);
      }
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileUpload(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    noClick: true,
    noKeyboard: true
  });

  if (!contact) return null;

  const handleSend = () => {
    if (inputText.trim() && !contact.isBlocked) {
      if (editingMessage) {
        editMessage(editingMessage.id, inputText.trim());
        setEditingMessage(null);
      } else {
        sendMessage(inputText.trim());
      }
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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        try {
          const storageRef = ref(storage, `audio/${auth.currentUser?.uid}/${Date.now()}.webm`);
          await uploadBytes(storageRef, audioBlob);
          const audioUrl = await getDownloadURL(storageRef);
          sendMessage('Голосовое сообщение', { audioUrl });
        } catch (error) {
          console.error('Error uploading audio:', error);
          alert('Ошибка при загрузке голосового сообщения');
        }
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
              {contact.isOfficial && <BadgeCheck size={16} className="text-blue-500 fill-blue-500 text-white" />}
            </div>
            <div className="text-[13px] text-[#d1e0ec]">
              {contact.isChannel ? contact.statusOffline : (contact.isTyping ? 'печатает...' : contact.statusOffline)}
            </div>
          </div>
        </div>

        <div className="flex-grow"></div>

        {!contact.isChannel && contact.id !== 'saved_messages' && (
          <div className="flex items-center gap-1 mr-1">
            <button onClick={() => startCall('audio')} className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors">
              <Phone size={20} />
            </button>
            <button onClick={() => startCall('video')} className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors">
              <Video size={20} />
            </button>
          </div>
        )}

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
                <div className="absolute right-2 top-full mt-1 w-48 bg-white dark:bg-tg-bg-light rounded-md shadow-lg py-1 z-50 text-black dark:text-tg-text-primary border border-tg-divider">
                  <button 
                    onClick={() => { setShowClearModal(true); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 text-[15px]"
                  >
                    Очистить историю
                  </button>
                  <button 
                    onClick={() => { setShowDeleteModal(true); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 text-[15px] text-red-500"
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
        {...getRootProps()}
        className="flex-grow overflow-y-auto p-2.5 pt-14 flex flex-col no-scrollbar relative z-10"
        style={{ 
          backgroundImage: wallpaper ? `url('${wallpaper}')` : 'none',
          backgroundColor: wallpaper ? 'transparent' : 'var(--tg-bg-dark)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        onClick={(e) => { 
          setShowEmojiPicker(false); 
          setShowAttachMenu(false); 
          const onClick = getRootProps().onClick;
          if (onClick) onClick(e as any);
        }}
      >
        <input {...getInputProps()} />
        {isDragActive && (
          <div className="absolute inset-0 z-50 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-blue-500 rounded-lg m-2">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-lg flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center">
                <File size={32} />
              </div>
              <p className="text-lg font-medium text-gray-900">Отпустите файлы здесь</p>
              <p className="text-sm text-gray-500">для отправки в чат</p>
            </div>
          </div>
        )}
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
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMessage(msg);
              }}
              className={`message max-w-[75%] px-3 py-1.5 mb-1.5 rounded-[18px] relative break-words flex flex-col cursor-pointer ${
                isJumbo 
                  ? `bg-transparent ${msg.type === 'sent' ? 'self-end' : 'self-start'}`
                  : msg.type === 'sent' 
                    ? 'bg-tg-sent-bubble self-end rounded-br-[5px] message-tail-sent shadow-sm text-[15px] leading-snug' 
                    : 'bg-tg-received-bubble self-start rounded-bl-[5px] message-tail-received shadow-sm text-[15px] leading-snug'
              }`}
            >
              {msg.forwardedFrom && (
                <div className="text-[12px] text-tg-secondary-text mb-1 italic">
                  Переслано от: {msg.forwardedFrom}
                </div>
              )}
              {msg.audioUrl ? (
                <div className="mb-1">
                  <audio controls src={msg.audioUrl} className="h-8 w-48" />
                </div>
              ) : msg.fileUrl ? (
                <div className="mb-1">
                  {msg.fileType?.startsWith('image/') ? (
                    <Image 
                      src={msg.fileUrl} 
                      alt={msg.fileName || 'Image'} 
                      width={300} 
                      height={300} 
                      className="max-w-full rounded-lg object-contain max-h-[300px]" 
                      style={{ width: 'auto', height: 'auto' }}
                      unoptimized
                    />
                  ) : msg.fileType?.startsWith('video/') || msg.fileType?.startsWith('audio/') ? (
                    <div className="rounded-lg overflow-hidden max-w-full">
                      <ReactPlayer 
                        src={msg.fileUrl} 
                        controls 
                        width="100%" 
                        height={msg.fileType?.startsWith('audio/') ? "50px" : "auto"}
                        style={{ maxWidth: '300px' }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-black/5 p-2 rounded-lg">
                      <div className="p-2 bg-blue-500 text-white rounded-full"><File size={16} /></div>
                      <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate max-w-[150px]">{msg.fileName}</a>
                    </div>
                  )}
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
                {msg.isEdited && <span className="mr-1 italic">изменено</span>}
                <span>{msg.time}</span>
                {msg.type === 'sent' && (
                  msg.status === 'sending' ? <Clock size={12} /> :
                  msg.status === 'read' ? <CheckCheck size={14} /> : <Check size={14} />
                )}
              </div>
              
              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                <div className={`absolute -bottom-3 flex gap-1 z-20 ${msg.type === 'sent' ? 'right-2' : 'left-2'}`}>
                  {Object.entries(msg.reactions).map(([emoji, count]) => (
                    <div key={emoji} className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-full px-1.5 py-0.5 text-[11px] flex items-center gap-1">
                      <span>{emoji}</span>
                      <span className="text-gray-500 font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              )}
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
        <div className="flex flex-col shrink-0 z-30">
          {editingMessage && (
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col overflow-hidden">
                <span className="text-blue-500 text-xs font-medium">Редактирование</span>
                <span className="text-sm text-gray-600 truncate">{editingMessage.text || 'Вложение'}</span>
              </div>
              <button 
                onClick={() => { setEditingMessage(null); setInputText(''); }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <Square size={16} />
              </button>
            </div>
          )}
          <div className={`flex items-end px-2.5 py-2 border-t border-tg-divider gap-1.5 transition-colors relative ${isGlassEnabled ? 'backdrop-blur-xl bg-white/60' : 'bg-tg-input-bg'}`}>
            
            {/* Attachment Menu */}
          <AnimatePresence>
            {showAttachMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-14 left-2 bg-white dark:bg-tg-bg-light rounded-xl shadow-lg border border-gray-100 dark:border-tg-divider p-2 flex flex-col gap-1 z-50 min-w-[160px]"
              >
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0]);
                  }
                }} />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-left text-[15px] text-tg-text-primary">
                  <div className="text-blue-500"><ImageIcon size={20} /></div>
                  <span>Фото / Видео</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-left text-[15px] text-tg-text-primary">
                  <div className="text-orange-500"><Music size={20} /></div>
                  <span>Музыка</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-left text-[15px] text-tg-text-primary">
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

          {isUploadingFile ? (
            <div className="w-10 h-10 p-2 rounded-full mb-0.5 flex items-center justify-center text-white" style={{ backgroundColor: themeColor }}>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : isRecording ? (
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
              className="bg-white dark:bg-tg-bg-light rounded-xl shadow-xl w-full max-w-sm overflow-hidden z-10 border border-tg-divider"
            >
              <div className="p-5">
                <h3 className="text-[18px] font-medium text-tg-text-primary mb-2">Очистить историю</h3>
                <p className="text-[15px] text-tg-secondary-text">Вы уверены, что хотите удалить все сообщения в этом чате? Это действие нельзя отменить.</p>
              </div>
              <div className="flex border-t border-tg-divider">
                <button 
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 py-3 text-[16px] font-medium text-tg-secondary-text hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-r border-tg-divider"
                >
                  Отмена
                </button>
                <button 
                  onClick={() => { if(activeChatId) clearHistory(activeChatId); setShowClearModal(false); }}
                  className="flex-1 py-3 text-[16px] font-medium text-red-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
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
              className="bg-white dark:bg-tg-bg-light rounded-xl shadow-xl w-full max-w-sm overflow-hidden z-10 border border-tg-divider"
            >
              <div className="p-5">
                <h3 className="text-[18px] font-medium text-tg-text-primary mb-2">Удалить чат</h3>
                <p className="text-[15px] text-tg-secondary-text">Вы уверены, что хотите удалить чат с {contact.name}? Это действие нельзя отменить.</p>
              </div>
              <div className="flex border-t border-tg-divider">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 text-[16px] font-medium text-tg-secondary-text hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-r border-tg-divider"
                >
                  Отмена
                </button>
                <button 
                  onClick={() => { if(activeChatId) deleteChat(activeChatId); setShowDeleteModal(false); }}
                  className="flex-1 py-3 text-[16px] font-medium text-red-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Message Context Menu */}
      <AnimatePresence>
        {selectedMessage && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50" onClick={() => setSelectedMessage(null)}
            />
            <motion.div 
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
              className="bg-white dark:bg-tg-bg-light rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-sm overflow-hidden z-10 pb-6 sm:pb-0 border-t border-tg-divider sm:border"
            >
              <div className="p-4 border-b border-tg-divider">
                <p className="text-tg-secondary-text text-sm truncate">{selectedMessage.text || 'Вложение'}</p>
              </div>
              <div className="flex items-center justify-around p-3 border-b border-tg-divider bg-gray-50 dark:bg-white/5">
                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => {
                      addReaction(selectedMessage.id, emoji);
                      setSelectedMessage(null);
                    }}
                    className="text-2xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="flex flex-col">
                {selectedMessage.type === 'sent' && (
                  <button 
                    onClick={() => {
                      setEditingMessage(selectedMessage);
                      setInputText(selectedMessage.text);
                      setSelectedMessage(null);
                    }}
                    className="w-full text-left px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 text-[16px] border-b border-tg-divider flex items-center gap-3 text-tg-text-primary"
                  >
                    <span className="text-blue-500">Изменить</span>
                  </button>
                )}
                <button 
                  onClick={() => {
                    setShowForwardModal(true);
                  }}
                  className="w-full text-left px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 text-[16px] border-b border-tg-divider flex items-center gap-3 text-tg-text-primary"
                >
                  <span className="text-tg-text-primary">Переслать</span>
                </button>
                {selectedMessage.type === 'sent' && (
                  <button 
                    onClick={() => {
                      deleteMessage(selectedMessage.id);
                      setSelectedMessage(null);
                    }}
                    className="w-full text-left px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 text-[16px] flex items-center gap-3 text-tg-text-primary"
                  >
                    <span className="text-red-500">Удалить</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Forward Modal */}
      <AnimatePresence>
        {showForwardModal && selectedMessage && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50" onClick={() => setShowForwardModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-tg-bg-light rounded-xl shadow-xl w-full max-w-sm overflow-hidden z-10 flex flex-col max-h-[80vh] border border-tg-divider"
            >
              <div className="p-4 border-b border-tg-divider">
                <h3 className="text-[18px] font-medium text-tg-text-primary">Переслать сообщение</h3>
              </div>
              <div className="overflow-y-auto flex-grow p-2">
                {Object.values(contacts).map(c => (
                  <div 
                    key={c.id}
                    onClick={() => {
                      forwardMessage(selectedMessage, c.id);
                      setShowForwardModal(false);
                      setSelectedMessage(null);
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                  >
                    {c.avatarUrl ? (
                      <Image src={c.avatarUrl} alt={c.name} width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium" style={{ backgroundColor: c.avatarColor }}>
                        {c.initial}
                      </div>
                    )}
                    <div className="font-medium text-tg-text-primary">{c.name}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-tg-divider">
                <button 
                  onClick={() => setShowForwardModal(false)}
                  className="w-full py-2.5 bg-gray-100 dark:bg-white/10 text-tg-text-primary rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Call Modal */}
      <AnimatePresence>
        {isCalling && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-[80] bg-gray-900 text-white flex flex-col items-center justify-between py-12"
          >
            <div className="flex flex-col items-center gap-4 mt-10">
              <div className="w-32 h-32 rounded-full bg-gray-800 overflow-hidden relative shadow-2xl">
                {contact.avatarUrl ? (
                  <Image src={contact.avatarUrl} alt={contact.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-medium" style={{ backgroundColor: contact.avatarColor }}>
                    {contact.initial}
                  </div>
                )}
              </div>
              <h2 className="text-3xl font-medium">{contact.name}</h2>
              <p className="text-gray-400 text-lg">
                {callDuration > 0 ? formatTime(callDuration) : `Звонок (${callType === 'video' ? 'видео' : 'аудио'})...`}
              </p>
            </div>
            
            <div className="flex items-center gap-8 mb-10">
              <button className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
                <Mic size={24} />
              </button>
              <button 
                onClick={() => setIsCalling(false)}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
              >
                <PhoneOff size={28} />
              </button>
              <button className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
                <Video size={24} />
              </button>
            </div>
          </motion.div>
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
    <Image
      src={`https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${unified}.png`}
      alt={emoji}
      width={64}
      height={64}
      className="w-16 h-16 object-contain"
      onError={() => setError(true)}
      unoptimized
    />
  );
}
