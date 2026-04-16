'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Paperclip, Send, Mic, MoreVertical, Check, CheckCheck, Clock, Smile, Image as ImageIcon, Music, File as FileIcon, Square, Bookmark, CheckCircle, BadgeCheck, Edit3, Trash2, Repeat2, Reply, Download, Plus, Search, X, Sticker, Eye, Info } from 'lucide-react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import NextImage from 'next/image';
import { auth, db } from '@/lib/firebase';
import { uploadFile } from '@/lib/supabase';
import { doc, getDoc } from 'firebase/firestore';
import { stickerPacks, gifCollection } from '@/lib/stickers';

const isOnlyEmojis = (str: string) => {
  const noSpace = str.replace(/\s/g, '');
  if (!noSpace) return false;
  return /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D\p{Emoji_Modifier}]+$/u.test(noSpace);
};

type PickerTab = 'emoji' | 'stickers' | 'gifs' | 'my-stickers';

export default function ChatView() {
  const { contacts, activeChatId, setView, sendMessage, editMessage, deleteMessage, forwardMessage, saveSticker, removeSavedSticker, savedStickers, themeColor, wallpaper, isGlassEnabled, clearHistory, deleteChat, user, setTypingStatus } = useChat();
  const [inputText, setInputText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<PickerTab>('emoji');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const stickerFileInputRef = useRef<HTMLInputElement>(null);

  const [contextMenu, setContextMenu] = useState<{ msgId: string; x: number; y: number } | null>(null);
  const [showForwardPicker, setShowForwardPicker] = useState(false);
  const [editingMsg, setEditingMsg] = useState<{ id: string; text: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ messageId: string; senderName: string; text: string } | null>(null);
  const [selectedStickerPack, setSelectedStickerPack] = useState<string | null>(null);
  const [gifSearch, setGifSearch] = useState('');
  const [isUploadingSticker, setIsUploadingSticker] = useState(false);
  const [showStickerCreator, setShowStickerCreator] = useState(false);
  const [stickerPreview, setStickerPreview] = useState<string | null>(null);
  const [stickerName, setStickerName] = useState('');
  const [stickerFile, setStickerFile] = useState<File | null>(null);
  const [channelOwnerId, setChannelOwnerId] = useState<string | null>(null);

  const contact = activeChatId ? contacts[activeChatId] : null;
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const wasAtBottomRef = useRef(true);

  const scrollToBottom = useCallback((force = false, smooth = false) => {
    if (force || wasAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
    }
  }, []);

  // Отслеживаем позицию скролла
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    wasAtBottomRef.current = isAtBottom;
  }, []);

  // Скроллим только при новых сообщениях
  const prevMessagesLengthRef = useRef(0);
  useEffect(() => { 
    const currentLength = contact?.messages?.length || 0;
    if (currentLength > prevMessagesLengthRef.current) {
      // Новое сообщение - скроллим
      scrollToBottom(true);
    }
    prevMessagesLengthRef.current = currentLength;
  }, [contact?.messages?.length, scrollToBottom]);

  // Обработка статуса печати
  const handleInputChange = useCallback((text: string) => {
    setInputText(text);
    
    if (!activeChatId || !setTypingStatus) return;
    
    // Если текст не пустой, отправляем статус "печатает"
    if (text.trim()) {
      setTypingStatus(activeChatId, true);
      
      // Сбрасываем предыдущий таймер
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      
      // Через 2 секунды после остановки печати убираем статус
      typingTimerRef.current = setTimeout(() => {
        setTypingStatus(activeChatId, false);
      }, 2000);
    } else {
      // Если текст пустой, сразу убираем статус
      setTypingStatus(activeChatId, false);
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    }
  }, [activeChatId, setTypingStatus]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      // Убираем статус печати при выходе из чата
      if (activeChatId && setTypingStatus) {
        setTypingStatus(activeChatId, false);
      }
    };
  }, [activeChatId, setTypingStatus]);

  // Загрузка информации о владельце канала
  useEffect(() => {
    const loadChannelOwner = async () => {
      if (!activeChatId || !contact?.isChannel) {
        setChannelOwnerId(null);
        return;
      }

      try {
        const channelDoc = await getDoc(doc(db, 'channels', activeChatId));
        if (channelDoc.exists()) {
          setChannelOwnerId(channelDoc.data().createdBy);
        }
      } catch (error) {
        console.error('Failed to load channel owner:', error);
      }
    };

    loadChannelOwner();
  }, [activeChatId, contact?.isChannel]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop();
    };
  }, []);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (!contact) return (
    <div className="absolute inset-0 bg-tg-bg-light flex items-center justify-center z-10">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const handleSend = () => {
    if (inputText.trim() && !contact.isBlocked) {
      if (editingMsg) {
        editMessage(editingMsg.id, inputText.trim());
        setEditingMsg(null);
      } else {
        sendMessage(inputText.trim(), replyingTo ? { replyTo: replyingTo } : undefined);
      }
      setInputText('');
      setShowPicker(false);
      setReplyingTo(null);
      
      // Убираем статус печати после отправки
      if (activeChatId && setTypingStatus) {
        setTypingStatus(activeChatId, false);
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
        }
      }
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  const sendSticker = (stickerUrl: string, width: number, height: number) => {
    sendMessage('', { stickerUrl, stickerWidth: width, stickerHeight: height });
    setShowPicker(false);
  };

  const sendGif = (gifUrl: string, width: number, height: number) => {
    sendMessage('', { gifUrl, gifWidth: width, gifHeight: height });
    setShowPicker(false);
  };

  // Быстрое сжатие изображения с помощью Canvas API
  const resizeImageFast = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: true });
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        try {
          // Целевой размер для стикера
          const MAX_SIZE = 512;
          let width = img.width;
          let height = img.height;

          // Вычисляем новые размеры с сохранением пропорций
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Используем высококачественный алгоритм масштабирования
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Рисуем изображение
          ctx.drawImage(img, 0, 0, width, height);

          // Пробуем WebP, если не поддерживается - используем PNG
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Освобождаем память
                URL.revokeObjectURL(img.src);
                resolve(blob);
              } else {
                // Fallback на PNG если WebP не сработал
                canvas.toBlob(
                  (pngBlob) => {
                    URL.revokeObjectURL(img.src);
                    if (pngBlob) {
                      resolve(pngBlob);
                    } else {
                      reject(new Error('Failed to create blob'));
                    }
                  },
                  'image/png',
                  0.9
                );
              }
            },
            'image/webp',
            0.85
          );
        } catch (error) {
          URL.revokeObjectURL(img.src);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
      
      // Устанавливаем crossOrigin для избежания CORS проблем
      img.crossOrigin = 'anonymous';
      img.src = URL.createObjectURL(file);
    });
  };

  const handleCustomStickerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      e.target.value = '';
      return;
    }
    
    // Проверяем размер файла (максимум 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер: 10MB');
      e.target.value = '';
      return;
    }
    
    try {
      // Быстрое сжатие изображения
      const compressedBlob = await resizeImageFast(file);
      
      // Определяем тип файла из blob
      const fileType = compressedBlob.type || 'image/png';
      const extension = fileType.split('/')[1] || 'png';
      const fileName = file.name.replace(/\.[^/.]+$/, '') + '.' + extension;
      
      const compressedFile = new File([compressedBlob], fileName, { type: fileType });
      setStickerFile(compressedFile);
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          setStickerPreview(result);
          setStickerName(file.name.replace(/\.[^/.]+$/, ''));
          setShowStickerCreator(true);
          setShowPicker(false);
        }
      };
      reader.onerror = (err) => {
        console.error('FileReader error:', err);
        alert('Ошибка при чтении файла');
      };
      reader.readAsDataURL(compressedFile);
    } catch (error: any) {
      console.error('Error compressing image:', error);
      alert(`Ошибка при обработке изображения: ${error.message || 'Неизвестная ошибка'}`);
    }
    
    e.target.value = '';
  };

  const handleStickerCreate = async () => {
    if (!stickerFile || !stickerPreview) {
      alert('Пожалуйста, выберите изображение для стикера');
      return;
    }
    if (!stickerName.trim()) {
      alert('Пожалуйста, введите название стикера');
      return;
    }
    if (!auth.currentUser) {
      alert('Пожалуйста, войдите в систему');
      return;
    }
    
    setIsUploadingSticker(true);
    try {
      // Загружаем через Supabase Storage
      const result = await uploadFile(stickerFile, auth.currentUser.uid, 'sticker');
      
      // Сохраняем стикер и отправляем
      saveSticker(result.url);
      sendSticker(result.url, 256, 256);
      
      // Очищаем форму
      setShowStickerCreator(false);
      setStickerPreview(null);
      setStickerName('');
      setStickerFile(null);
    } catch (error: any) {
      console.error('Error creating sticker:', error);
      alert(error.message || 'Ошибка при создании стикера');
    } finally {
      setIsUploadingSticker(false);
    }
  };

  const handleStickerCancel = () => {
    setShowStickerCreator(false);
    setStickerPreview(null);
    setStickerName('');
    setStickerFile(null);
  };

  const startRecording = async () => {
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Проверяем поддерживаемые форматы
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => { 
        if (e.data.size > 0) audioChunksRef.current.push(e.data); 
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (stream) stream.getTracks().forEach(track => track.stop());
        
        // Проверяем размер записи
        if (audioBlob.size === 0) {
          alert('Запись пуста. Попробуйте еще раз.');
          return;
        }
        
        try {
          // Загружаем через Supabase Storage
          const extension = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'm4a' : 'ogg';
          const audioFile = new File([audioBlob], `audio_${Date.now()}.${extension}`, { type: mimeType });
          const result = await uploadFile(audioFile, auth.currentUser?.uid || '', 'audio');
          sendMessage('Голосовое сообщение', { audioUrl: result.url });
        } catch (error) { 
          console.error('Error uploading audio:', error); 
          alert('Ошибка при загрузке голосового сообщения. Проверьте подключение к интернету.'); 
        }
      };
      
      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        if (stream) stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
        alert('Ошибка записи. Попробуйте еще раз.');
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => { setRecordingTime(prev => prev + 1); }, 1000);
    } catch (err) {
      if (stream) stream.getTracks().forEach(track => track.stop());
      console.error('Error accessing microphone', err);
      alert('Нет доступа к микрофону. Разрешите доступ в настройках браузера.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setShowAttachMenu(false);
    
    try {
      if (!auth.currentUser) {
        alert('Пожалуйста, войдите в систему');
        return;
      }

      // Загружаем через Supabase Storage (автоматически определит тип и сожмёт если нужно)
      const result = await uploadFile(file, auth.currentUser.uid);
      
      const fileType = file.type;
      const isImage = fileType.startsWith('image/');
      const isVideo = fileType.startsWith('video/');
      const isAudio = fileType.startsWith('audio/');
      
      // Отправляем сообщение с правильным типом
      if (isImage) {
        sendMessage('', { fileUrl: result.url, fileName: file.name });
      } else if (isVideo) {
        sendMessage('', { fileUrl: result.url, fileName: file.name });
      } else if (isAudio) {
        sendMessage('', { audioUrl: result.url });
      } else {
        sendMessage(`Файл: ${file.name}`, { fileUrl: result.url, fileName: file.name });
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert(error.message || 'Ошибка при загрузке файла');
    }
    
    // Очищаем input для возможности загрузки того же файла снова
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleContextMenu = (e: React.MouseEvent, msgId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ msgId, x: e.clientX, y: e.clientY });
  };

  // Поддержка долгого нажатия для мобильных устройств (useRef для избежания лишних ре-рендеров)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent, msgId: string) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });

    const timer = setTimeout(() => {
      // Вибрация при долгом нажатии (если поддерживается)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setContextMenu({
        msgId,
        x: touch.clientX,
        y: touch.clientY
      });
    }, 500); // 500ms для долгого нажатия

    longPressTimer.current = timer;
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setTouchStart(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart && longPressTimer.current) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStart.x);
      const deltaY = Math.abs(touch.clientY - touchStart.y);

      // Если палец сдвинулся больше чем на 10px, отменяем долгое нажатие
      if (deltaX > 10 || deltaY > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handleEdit = (msgId: string, text: string) => {
    setEditingMsg({ id: msgId, text });
    setInputText(text);
    setContextMenu(null);
  };

  const handleDelete = (msgId: string) => {
    deleteMessage(msgId);
    setContextMenu(null);
  };

  const handleForward = (msgId: string) => {
    setShowForwardPicker(true);
    setContextMenu(null);
  };

  const handleReply = (msgId: string, senderName: string, text: string) => {
    setReplyingTo({ messageId: msgId, senderName, text: text.substring(0, 80) });
    setContextMenu(null);
  };

  const handleForwardTo = (targetChatId: string) => {
    const msg = contact.messages.find(m => m.id === contextMenu?.msgId);
    if (msg) forwardMessage(msg, targetChatId);
    setShowForwardPicker(false);
  };

  const cancelEdit = () => { setEditingMsg(null); setInputText(''); };
  const cancelReply = () => { setReplyingTo(null); };

  const forwardableContacts = useMemo(() =>
    Object.values(contacts).filter(c => c.id !== activeChatId && c.id !== 'saved_messages'),
    [contacts, activeChatId]
  );

  const filteredGifs = useMemo(() => {
    if (!gifSearch.trim()) return gifCollection.slice(0, 20); // Показываем первые 20 GIF без поиска
    const search = gifSearch.toLowerCase();
    return gifCollection.filter(gif =>
      gif.url.toLowerCase().includes(search) ||
      gif.previewUrl.toLowerCase().includes(search)
    ).slice(0, 30); // Ограничиваем результаты поиска
  }, [gifSearch]);

  const currentPack = selectedStickerPack ? stickerPacks.find(p => p.id === selectedStickerPack) : null;

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-tg-bg-light flex flex-col z-10"
    >
      {/* Header */}
      <div
        className={`text-tg-header-text px-2.5 h-12 flex items-center gap-2.5 shrink-0 transition-colors fixed top-0 left-0 right-0 z-30 ${isGlassEnabled ? 'backdrop-blur-md border-b border-black/10' : ''}`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'CC' : themeColor }}
      >
        <button onClick={(e) => { e.stopPropagation(); setView('menu'); }} className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors mr-1">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2.5 cursor-pointer hover:bg-white/5 p-1 rounded-md transition-colors" onClick={() => setView('profile')}>
          {contact.id === 'saved_messages' ? (
            <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor: contact.avatarColor }}>
              <Bookmark size={20} fill="currentColor" />
            </div>
          ) : contact.avatarUrl ? (
            <NextImage src={contact.avatarUrl} alt={contact.name} width={38} height={38} className="rounded-full object-cover shrink-0" referrerPolicy="no-referrer" unoptimized />
          ) : (
            <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-white font-medium text-[16px] shrink-0" style={{ backgroundColor: contact.avatarColor }}>
              {contact.initial}
            </div>
          )}
          <div className="flex-grow leading-tight pointer-events-none">
            <div className="font-medium text-[16px] flex items-center gap-1">{contact.name}{contact.isOfficial && <BadgeCheck size={16} className="text-blue-500 fill-blue-500 text-white" />}</div>
            <div className="text-[13px] text-[#d1e0ec]">{contact.isChannel ? contact.statusOnline : (contact.isTyping ? 'печатает...' : contact.statusOffline)}</div>
          </div>
        </div>
        <div className="flex-grow"></div>
        {contact.isChannel ? (
          <button 
            onClick={() => setView('channel-info')} 
            className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
          >
            <Info size={24} />
          </button>
        ) : (
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors">
              <MoreVertical size={24} />
            </button>
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-2 top-full mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50 text-black">
                  <button onClick={() => { setShowClearModal(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-[15px]">Очистить историю</button>
                  <button onClick={() => { setShowDeleteModal(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-[15px] text-red-500">Удалить чат</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-grow overflow-y-auto p-2.5 pt-14 flex flex-col no-scrollbar relative z-10"
        style={{
          backgroundImage: wallpaper && !wallpaper.startsWith('linear') ? `url('${wallpaper}')` : 'none',
          background: wallpaper || 'var(--tg-bg-dark)',
          backgroundSize: wallpaper && !wallpaper.startsWith('linear') ? 'cover' : undefined,
          backgroundPosition: wallpaper && !wallpaper.startsWith('linear') ? 'center' : undefined,
        }}
        onClick={() => { setShowPicker(false); setShowAttachMenu(false); setContextMenu(null); }}
      >
        {contact.id === 'saved_messages' && contact.messages.length === 0 && (
          <div className="flex-grow flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 max-w-sm text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-500 mx-auto flex items-center justify-center mb-4"><Bookmark size={32} fill="currentColor" /></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Избранное</h3>
              <p className="text-[15px] text-gray-600 leading-relaxed">Здесь можно сохранять сообщения, медиа и другие файлы.</p>
            </div>
          </div>
        )}
        {contact.isChannel && contact.messages.length === 0 && (
          <div className="flex-grow flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 max-w-sm text-center shadow-sm">
              <p className="text-[15px] text-gray-600 leading-relaxed">Постов пока нет.</p>
            </div>
          </div>
        )}

        {contact.messages.map((msg) => {
          const onlyEmojis = isOnlyEmojis(msg.text);
          const emojiCount = Array.from(msg.text.replace(/\s/g, '')).length;
          const isJumbo = onlyEmojis && emojiCount <= 5 && !msg.audioUrl && !msg.fileUrl && !msg.stickerUrl && !msg.gifUrl;
          const isOwn = msg.type === 'sent';
          const isSticker = !!msg.stickerUrl;
          const isGif = !!msg.gifUrl;

          return (
            <div
              key={msg.id}
              onContextMenu={(e) => handleContextMenu(e, msg.id)}
              onTouchStart={(e) => handleTouchStart(e, msg.id)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              className={`message max-w-[75%] px-3 py-2 mb-2 rounded-[20px] relative break-words flex flex-col cursor-pointer select-none transition-all hover:scale-[1.02] ${
                isSticker || isGif
                  ? `bg-transparent ${isOwn ? 'self-end' : 'self-start'}`
                  : isJumbo
                    ? `bg-transparent ${isOwn ? 'self-end' : 'self-start'}`
                    : isOwn
                      ? 'bg-tg-sent-bubble self-end rounded-br-[6px] message-tail-sent shadow-md text-[15px] leading-relaxed'
                      : 'bg-tg-received-bubble self-start rounded-bl-[6px] message-tail-received shadow-md text-[15px] leading-relaxed'
              }`}
            >
              {msg.forwardedFrom && (
                <div className="text-[13px] font-medium mb-1 italic" style={{ color: themeColor }}>
                  Переслано от {msg.forwardedFrom.senderName}
                </div>
              )}
              {msg.replyTo && (
                <div className="mb-1 pl-2 border-l-2 rounded text-[13px] opacity-70" style={{ borderColor: themeColor }}>
                  <div className="font-medium" style={{ color: themeColor }}>{msg.replyTo.senderName}</div>
                  <div className="truncate max-w-[200px]">{msg.replyTo.text}</div>
                </div>
              )}
              {msg.audioUrl ? (
                <div className="mb-1">
                  <audio 
                    controls 
                    src={msg.audioUrl} 
                    className="h-10 w-full max-w-[280px]"
                    preload="metadata"
                    onError={(e) => {
                      console.error('Audio load error:', e);
                      const target = e.target as HTMLAudioElement;
                      target.style.display = 'none';
                      const errorDiv = document.createElement('div');
                      errorDiv.textContent = 'Ошибка загрузки аудио';
                      errorDiv.className = 'text-red-500 text-sm';
                      target.parentElement?.appendChild(errorDiv);
                    }}
                  />
                </div>
              ) : msg.fileUrl ? (
                <div className="flex items-center gap-2 mb-1 bg-black/5 p-2 rounded-lg">
                  <div className="p-2 bg-blue-500 text-white rounded-full"><FileIcon size={16} /></div>
                  <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate max-w-[150px]">{msg.fileName}</a>
                </div>
              ) : msg.gift ? (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className={`rounded-2xl p-4 text-white text-center min-w-[200px] relative overflow-hidden ${
                    msg.gift.id === 'cosmonaut'
                      ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-black'
                      : msg.gift.id === 'easter_bunny' 
                      ? 'bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400' 
                      : 'bg-gradient-to-br from-purple-500 to-pink-500'
                  }`}
                >
                  {/* Космический фон для космонавта */}
                  {msg.gift.id === 'cosmonaut' && (
                    <div className="absolute inset-0">
                      {[...Array(20)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute text-white"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            fontSize: `${6 + Math.random() * 6}px`
                          }}
                          animate={{
                            opacity: [0.3, 1, 0.3],
                            scale: [0.8, 1.2, 0.8]
                          }}
                          transition={{
                            duration: 2 + Math.random() * 2,
                            repeat: Infinity,
                            delay: i * 0.1
                          }}
                        >
                          ⭐
                        </motion.div>
                      ))}
                      <motion.div 
                        className="absolute top-2 right-2 text-[25px]"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      >
                        🪐
                      </motion.div>
                      <motion.div 
                        className="absolute bottom-2 left-2 text-[20px]"
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        🌍
                      </motion.div>
                    </div>
                  )}
                  
                  {/* Пасхальный фон для зайца */}
                  {msg.gift.id === 'easter_bunny' && (
                    <div className="absolute inset-0 opacity-20">
                      <motion.div 
                        className="absolute top-2 left-2 text-[25px]"
                        animate={{ rotate: [0, 10, -10, 0], y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        🌸
                      </motion.div>
                      <motion.div 
                        className="absolute top-2 right-2 text-[25px]"
                        animate={{ rotate: [0, -10, 10, 0], y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      >
                        🌷
                      </motion.div>
                      <motion.div 
                        className="absolute bottom-2 left-2 text-[25px]"
                        animate={{ rotate: [0, 10, -10, 0], y: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                      >
                        🌼
                      </motion.div>
                      <motion.div 
                        className="absolute bottom-2 right-2 text-[25px]"
                        animate={{ rotate: [0, -10, 10, 0], y: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                      >
                        🌺
                      </motion.div>
                    </div>
                  )}
                  
                  <motion.div
                    animate={
                      msg.gift.id === 'cosmonaut'
                        ? {
                            y: [0, -20, 0],
                            rotate: [0, 10, -10, 0]
                          }
                        : msg.gift.id === 'easter_bunny'
                        ? {
                            scale: [1, 1.1, 1],
                            rotate: [0, -5, 5, -3, 3, 0],
                            y: [0, -15, 0, -8, 0]
                          }
                        : {
                            scale: [1, 1.15, 1],
                            rotate: [0, -15, 15, -10, 10, -5, 5, 0],
                            y: [0, -10, 0, -5, 0]
                          }
                    }
                    transition={{ 
                      duration: msg.gift.id === 'cosmonaut' ? 3 : msg.gift.id === 'easter_bunny' ? 2 : 1.5,
                      times: [0, 0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 1],
                      ease: "easeInOut",
                      repeat: (msg.gift.id === 'easter_bunny' || msg.gift.id === 'cosmonaut') ? Infinity : 0
                    }}
                    className="text-[80px] mb-2 relative z-10"
                  >
                    {msg.gift.emoji}
                  </motion.div>
                  <div className="text-[16px] font-bold mb-1 relative z-10">{msg.gift.name}</div>
                  <div className="text-[13px] text-white/90 flex items-center justify-center gap-1 relative z-10">
                    Подарок от {isOwn ? 'вас' : contact.name}
                  </div>
                  {msg.gift.id === 'cosmonaut' && (
                    <div className="text-[11px] text-cyan-300 mt-1 relative z-10">
                      🚀 День космонавтики! 🚀
                    </div>
                  )}
                  {msg.gift.id === 'easter_bunny' && (
                    <div className="text-[11px] text-white/80 mt-1 relative z-10">
                      ✨ Эксклюзивный пасхальный подарок ✨
                    </div>
                  )}
                </motion.div>
              ) : isSticker ? (
                <div className="relative group">
                  <img
                    src={msg.stickerUrl}
                    alt="Sticker"
                    className="w-32 h-32 object-contain cursor-pointer"
                    onClick={() => saveSticker(msg.stickerUrl!)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Download size={20} className="text-white drop-shadow-lg" />
                  </div>
                </div>
              ) : isGif ? (
                <img src={msg.gifUrl} alt="GIF" className="w-48 h-auto rounded-lg object-contain" />
              ) : isJumbo ? (
                <span className="text-[64px] leading-none">{msg.text}</span>
              ) : (
                <span className="mb-0.5 text-tg-text-primary">{msg.text}</span>
              )}
              <div className={`text-[11px] select-none relative z-10 pl-2 self-end mt-auto -mb-0.5 flex items-center gap-1 ${
                isSticker || isGif || isJumbo ? 'bg-black/20 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm mt-1' :
                isOwn ? 'text-[#70a050]' : 'text-tg-secondary-text'
              }`}>
                {msg.editedAt && <span className="italic mr-0.5">ред.</span>}
                <span>{msg.time}</span>
                {contact.isChannel && msg.views !== undefined && (
                  <>
                    <Eye size={12} />
                    <span>{msg.views}</span>
                  </>
                )}
                {isOwn && !contact.isChannel && (
                  msg.status === 'sending' ? <Clock size={12} /> :
                  msg.status === 'read' ? <CheckCheck size={14} /> : <Check size={14} />
                )}
              </div>
            </div>
          );
        })}

        {/* Индикатор печати - всегда в DOM, но скрыт через opacity */}
        <div 
          className={`flex items-center px-3 py-2 bg-tg-received-bubble self-start rounded-[18px] rounded-bl-[5px] message-tail-received relative shadow-sm transition-all duration-200 ${
            contact.isTyping && !contact.isBlocked 
              ? 'opacity-100 mb-1.5 min-h-[44px]' 
              : 'opacity-0 pointer-events-none h-0 mb-0 overflow-hidden'
          }`}
        >
          <div className="dot-flashing"></div>
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (() => {
          const msg = contact.messages.find(m => m.id === contextMenu.msgId);
          if (!msg) return null;
          const isOwn = msg.type === 'sent';
          const canEdit = isOwn && !msg.audioUrl && !msg.fileUrl && !msg.stickerUrl && !msg.gifUrl;

          return (
            <>
              <div className="fixed inset-0 z-[55]" onClick={() => setContextMenu(null)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed z-[60] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-1.5 min-w-[200px] overflow-hidden"
                style={{
                  left: Math.min(contextMenu.x, window.innerWidth - 210),
                  top: Math.min(contextMenu.y, window.innerHeight - 300),
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {canEdit && (
                  <button onClick={() => handleEdit(msg.id, msg.text)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50/80 text-left text-[15px] text-gray-700 transition-colors">
                    <Edit3 size={18} className="text-blue-500" /> 
                    <span>Редактировать</span>
                  </button>
                )}
                <button onClick={() => handleReply(msg.id, isOwn ? 'Вы' : contact.name, msg.text)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50/80 text-left text-[15px] text-gray-700 transition-colors">
                  <Reply size={18} className="text-green-500" /> 
                  <span>Ответить</span>
                </button>
                <button onClick={() => handleForward(msg.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50/80 text-left text-[15px] text-gray-700 transition-colors">
                  <Repeat2 size={18} className="text-purple-500" /> 
                  <span>Переслать</span>
                </button>
                {msg.stickerUrl && !savedStickers.includes(msg.stickerUrl) && (
                  <>
                    <div className="h-px bg-gray-100/50 mx-4 my-1" />
                    <button onClick={() => { saveSticker(msg.stickerUrl!); setContextMenu(null); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50/80 text-left text-[15px] text-gray-700 transition-colors">
                      <Download size={18} className="text-orange-500" /> 
                      <span>Сохранить стикер</span>
                    </button>
                  </>
                )}
                {isOwn && (
                  <>
                    <div className="h-px bg-red-100/50 mx-4 my-1" />
                    <button onClick={() => handleDelete(msg.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-left text-[15px] text-red-500 font-medium transition-colors">
                      <Trash2 size={18} /> 
                      <span>Удалить</span>
                    </button>
                  </>
                )}
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* Forward Picker */}
      <AnimatePresence>
        {showForwardPicker && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setShowForwardPicker(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden z-10">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-[18px] font-medium text-black">Переслать в</h3>
                <button onClick={() => setShowForwardPicker(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="overflow-y-auto max-h-[50vh]">
                {forwardableContacts.map(c => (
                  <div key={c.id} onClick={() => handleForwardTo(c.id)} className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 gap-3">
                    {c.avatarUrl ? (
                      <NextImage src={c.avatarUrl} alt={c.name} width={40} height={40} className="rounded-full object-cover shrink-0" referrerPolicy="no-referrer" unoptimized />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shrink-0" style={{ backgroundColor: c.avatarColor }}>{c.initial}</div>
                    )}
                    <div className="flex-grow"><div className="font-medium text-[16px] text-gray-900">{c.name}</div></div>
                  </div>
                ))}
                {forwardableContacts.length === 0 && <div className="p-6 text-center text-gray-400">Нет доступных чатов</div>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sticker/GIF/Emoji Picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 380, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="z-20 bg-white border-t border-gray-200 overflow-hidden flex flex-col shrink-0"
          >
            {/* Tab Bar */}
            <div className="flex items-center border-b border-gray-100 bg-gray-50">
              <button
                onClick={() => { setPickerTab('emoji'); setSelectedStickerPack(null); }}
                className={`flex-1 py-2.5 text-[13px] font-medium text-center transition-colors ${pickerTab === 'emoji' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
              >
                😊 Улыбки
              </button>
              <button
                onClick={() => { setPickerTab('stickers'); setSelectedStickerPack(null); }}
                className={`flex-1 py-2.5 text-[13px] font-medium text-center transition-colors ${pickerTab === 'stickers' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Sticker size={16} className="inline mr-1" />Стикеры
              </button>
              <button
                onClick={() => { setPickerTab('gifs'); setSelectedStickerPack(null); }}
                className={`flex-1 py-2.5 text-[13px] font-medium text-center transition-colors ${pickerTab === 'gifs' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
              >
                GIF
              </button>
              <button
                onClick={() => { setPickerTab('my-stickers'); setSelectedStickerPack(null); }}
                className={`flex-1 py-2.5 text-[13px] font-medium text-center transition-colors ${pickerTab === 'my-stickers' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Download size={16} className="inline mr-1" />Мои
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto">
              {pickerTab === 'emoji' && (
                <div className="p-3">
                  <div className="mb-3">
                    <div className="text-[12px] font-medium text-gray-500 uppercase mb-2">Часто используемые</div>
                    <div className="flex flex-wrap gap-1">
                      {['😀','😂','🥰','','🤔','','❤️','','🎉','','🤣','','🙏','💪','👏','🤝','✨','💯','','🥳','😇','🤗','😏','🤩','😋','🤪','😜','🤑','😈','','💀','🤖','👽','','🌈','⭐','🌙','️','🍕','','','🍩','','☕','🎵','🎸','⚽','','🎮','',''].filter(Boolean).map(e => (
                        <button key={e} onClick={() => handleEmojiClick(e)} className="text-2xl hover:scale-125 transition-transform p-1">{e}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] font-medium text-gray-500 uppercase mb-2">Смайлы</div>
                    <div className="flex flex-wrap gap-1">
                      {['😀','😃','😄','😁','😆','😅','','😂','🙂','🙃','😉','😊','😇','','😍','','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','','🤔','','🤐','','😐','😑','😶','🫥','😏','😒','🙄','','🤥','','😔','😪','🤤','','😷','','🤕','','🤮','','🥶','','😵','🤯','','🥳','','😎','','🧐'].filter(Boolean).map(e => (
                        <button key={e} onClick={() => handleEmojiClick(e)} className="text-2xl hover:scale-125 transition-transform p-1">{e}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {pickerTab === 'stickers' && !selectedStickerPack && (
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[14px] font-medium text-gray-700">Наборы стикеров</div>
                    <button
                      onClick={() => stickerFileInputRef.current?.click()}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-full text-[13px] hover:bg-blue-600 transition-colors"
                    >
                      <Plus size={14} /> Создать
                    </button>
                    <input type="file" ref={stickerFileInputRef} className="hidden" accept="image/*" onChange={handleCustomStickerUpload} />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {stickerPacks.map(pack => (
                      <button
                        key={pack.id}
                        onClick={() => setSelectedStickerPack(pack.id)}
                        className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <img src={pack.stickers[0].imageUrl} alt={pack.name} className="w-12 h-12 object-contain" />
                        <span className="text-[11px] text-gray-600 mt-1">{pack.emoji} {pack.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {pickerTab === 'stickers' && selectedStickerPack && currentPack && (
                <div>
                  <div className="flex items-center gap-2 p-3 border-b border-gray-100">
                    <button onClick={() => setSelectedStickerPack(null)} className="text-gray-500 hover:text-gray-700"><ArrowLeft size={18} /></button>
                    <span className="text-[14px] font-medium text-gray-700">{currentPack.emoji} {currentPack.name}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 p-2">
                    {currentPack.stickers.map(sticker => (
                      <button
                        key={sticker.id}
                        onClick={() => sendSticker(sticker.imageUrl, sticker.width, sticker.height)}
                        className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <img src={sticker.imageUrl} alt={sticker.emoji} className="w-16 h-16 object-contain mx-auto" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {pickerTab === 'gifs' && (
                <div>
                  <div className="p-2 border-b border-gray-100">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
                      <Search size={16} className="text-gray-400" />
                      <input
                        type="text"
                        value={gifSearch}
                        onChange={(e) => setGifSearch(e.target.value)}
                        placeholder="Поиск GIF..."
                        className="flex-grow bg-transparent outline-none text-[14px] text-gray-700 placeholder-gray-400"
                      />
                      {gifSearch && (
                        <button onClick={() => setGifSearch('')} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-1">
                    {filteredGifs.map(gif => (
                      <button
                        key={gif.id}
                        onClick={() => sendGif(gif.url, gif.width, gif.height)}
                        className="overflow-hidden rounded-lg hover:opacity-80 transition-opacity"
                      >
                        <img src={gif.previewUrl} alt="GIF" className="w-full h-24 object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {pickerTab === 'my-stickers' && (
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[14px] font-medium text-gray-700">Мои стикеры ({savedStickers.length})</div>
                    <button
                      onClick={() => stickerFileInputRef.current?.click()}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-full text-[13px] hover:bg-blue-600 transition-colors"
                    >
                      <Plus size={14} /> Загрузить
                    </button>
                    <input type="file" ref={stickerFileInputRef} className="hidden" accept="image/*" onChange={handleCustomStickerUpload} />
                  </div>
                  {savedStickers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Sticker size={48} className="mb-3 opacity-30" />
                      <p className="text-[14px]">У вас пока нет сохранённых стикеров</p>
                      <p className="text-[12px] mt-1">Нажмите на стикер в чате чтобы сохранить</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-1">
                      {savedStickers.map((url, i) => (
                        <div key={i} className="relative group">
                          <button
                            onClick={() => sendSticker(url, 256, 256)}
                            className="p-2 hover:bg-gray-50 rounded-lg transition-colors w-full"
                          >
                            <img src={url} alt="Saved sticker" className="w-16 h-16 object-contain mx-auto" />
                          </button>
                          <button
                            onClick={() => removeSavedSticker(url)}
                            className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      {contact.isBlocked ? (
        <div className={`flex items-center justify-center px-2.5 py-3 border-t border-tg-divider shrink-0 gap-1.5 z-20 transition-colors ${isGlassEnabled ? 'backdrop-blur-xl bg-white/60' : 'bg-tg-input-bg'}`}>
          <span className="text-tg-secondary-text text-[15px]">Вы заблокировали этого пользователя</span>
        </div>
      ) : contact.isChannel && channelOwnerId && user?.uid !== channelOwnerId ? (
        <div className={`flex items-center justify-center px-2.5 py-3 border-t border-tg-divider shrink-0 gap-1.5 z-20 transition-colors ${isGlassEnabled ? 'backdrop-blur-xl bg-white/60' : 'bg-tg-input-bg'}`}>
          <span className="text-tg-secondary-text text-[15px]">Только владелец канала может отправлять сообщения</span>
        </div>
      ) : (
        <div className={`flex items-end px-2.5 py-2 border-t border-tg-divider shrink-0 gap-1.5 z-30 transition-colors relative ${isGlassEnabled ? 'backdrop-blur-xl bg-white/60' : 'bg-tg-input-bg'}`}>
          <AnimatePresence>
            {showAttachMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-14 left-2 bg-white rounded-xl shadow-lg border border-gray-100 p-2 flex flex-col gap-1 z-50 min-w-[160px]"
              >
                <input type="file" ref={imageInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={handleFileUpload} />
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                
                <button onClick={() => imageInputRef.current?.click()} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left text-[15px]">
                  <div className="text-blue-500"><ImageIcon size={20} /></div><span>Фото / Видео</span>
                </button>
                <button onClick={() => audioInputRef.current?.click()} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left text-[15px]">
                  <div className="text-orange-500"><Music size={20} /></div><span>Музыка</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left text-[15px]">
                  <div className="text-green-500"><FileIcon size={20} /></div><span>Файл</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={() => setShowAttachMenu(!showAttachMenu)} className="p-1.5 mb-0.5 text-tg-secondary-text hover:text-gray-600 transition-colors">
            <Paperclip size={24} />
          </button>

          <div className="flex-grow flex flex-col relative">
            {replyingTo && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/80 backdrop-blur-sm rounded-t-xl border-l-2 mb-1" style={{ borderColor: themeColor }}>
                <div className="flex-grow min-w-0">
                  <div className="text-[13px] font-medium" style={{ color: themeColor }}>{replyingTo.senderName}</div>
                  <div className="text-[13px] text-gray-500 truncate">{replyingTo.text}</div>
                </div>
                <button onClick={cancelReply} className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors"><X size={16} /></button>
              </div>
            )}
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all duration-200 bg-white/90 backdrop-blur-md shadow-sm ${showPicker ? 'ring-2 ring-blue-400/50 border-transparent' : 'border-gray-200 hover:border-gray-300 focus-within:ring-2 focus-within:ring-blue-400/50 focus-within:border-transparent'}`}>
              <input
                type="text"
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isRecording ? "Запись..." : editingMsg ? "Редактировать..." : "Сообщение"}
                disabled={isRecording}
                className="flex-grow border-none outline-none py-1 px-1 text-[15px] bg-transparent resize-none max-h-[80px] leading-snug m-0 placeholder-gray-400 text-gray-900 disabled:opacity-50 font-normal"
              />
              {!isRecording && (
                <button onClick={() => { setShowPicker(!showPicker); setPickerTab('emoji'); }} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all active:scale-90">
                  <Smile size={22} />
                </button>
              )}
            </div>
          </div>

          {isRecording ? (
            <div className="flex items-center gap-2 mb-0.5">
              <div className="flex items-center gap-1.5 px-3 py-2.5 text-red-500 font-medium bg-red-50 rounded-2xl">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />{formatTime(recordingTime)}
              </div>
              <button onClick={stopRecording} className="w-11 h-11 p-2.5 rounded-full flex items-center justify-center text-white bg-red-500 hover:bg-red-600 active:scale-90 transition-all shadow-lg shadow-red-500/30">
                <Square size={18} fill="currentColor" />
              </button>
            </div>
          ) : inputText.trim() || editingMsg ? (
            <button onClick={handleSend} className="w-11 h-11 p-2.5 rounded-full mb-0.5 flex items-center justify-center text-white hover:brightness-110 active:scale-90 transition-all shadow-lg" style={{ backgroundColor: themeColor, boxShadow: `0 4px 12px ${themeColor}40` }}>
              {editingMsg ? <Check size={22} strokeWidth={2.5} /> : <Send size={20} className="ml-0.5" />}
            </button>
          ) : (
            <button onClick={startRecording} className="p-2.5 mb-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all active:scale-90">
              <Mic size={22} />
            </button>
          )}
        </div>
      )}

      {/* Sticker Creator Modal */}
      <AnimatePresence>
        {showStickerCreator && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={handleStickerCancel} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden z-10 relative">
              <div className="p-5">
                <h3 className="text-[18px] font-medium text-black mb-4">Создать стикер</h3>
                {stickerPreview && (
                  <div className="mb-4 flex justify-center">
                    <img src={stickerPreview} alt="Sticker preview" className="w-32 h-32 object-contain rounded-lg border border-gray-200" />
                  </div>
                )}
                <div className="mb-4">
                  <label className="text-[14px] text-gray-600 mb-1 block">Название стикера</label>
                  <input
                    type="text"
                    value={stickerName}
                    onChange={(e) => setStickerName(e.target.value)}
                    placeholder="Введите название..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-[15px]"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleStickerCreate()}
                  />
                </div>
              </div>
              <div className="flex border-t border-gray-200">
                <button onClick={handleStickerCancel} className="flex-1 py-3 text-[16px] font-medium text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-200">Отмена</button>
                <button 
                  onClick={handleStickerCreate} 
                  disabled={isUploadingSticker}
                  className="flex-1 py-3 text-[16px] font-medium text-white hover:brightness-110 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: isUploadingSticker ? '#9ca3af' : '#3b82f6' }}
                >
                  {isUploadingSticker ? 'Загрузка...' : 'Создать'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear History Modal */}
      <AnimatePresence>
        {showClearModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setShowClearModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden z-10">
              <div className="p-5">
                <h3 className="text-[18px] font-medium text-black mb-2">Очистить историю</h3>
                <p className="text-[15px] text-gray-600">Вы уверены, что хотите удалить все сообщения?</p>
              </div>
              <div className="flex border-t border-gray-200">
                <button onClick={() => setShowClearModal(false)} className="flex-1 py-3 text-[16px] font-medium text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-200">Отмена</button>
                <button onClick={() => { if (activeChatId) clearHistory(activeChatId); setShowClearModal(false); }} className="flex-1 py-3 text-[16px] font-medium text-red-500 hover:bg-gray-50 transition-colors">Очистить</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Chat Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden z-10">
              <div className="p-5">
                <h3 className="text-[18px] font-medium text-black mb-2">Удалить чат</h3>
                <p className="text-[15px] text-gray-600">Вы уверены, что хотите удалить чат с {contact.name}?</p>
              </div>
              <div className="flex border-t border-gray-200">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 text-[16px] font-medium text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-200">Отмена</button>
                <button onClick={() => { if (activeChatId) deleteChat(activeChatId); setShowDeleteModal(false); }} className="flex-1 py-3 text-[16px] font-medium text-red-500 hover:bg-gray-50 transition-colors">Удалить</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
