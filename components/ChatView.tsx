'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Paperclip, Send, Mic, MoreVertical, Check, CheckCheck, Clock, Smile, Image as ImageIcon, Music, File as FileIcon, Square, Bookmark, CheckCircle, BadgeCheck, Edit3, Trash2, Repeat2, Reply, Download, Plus, Search, X, Sticker, Eye, Info, Sparkles, Lock } from 'lucide-react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import NextImage from 'next/image';
import { auth, db } from '@/lib/firebase';
import { uploadFile } from '@/lib/storage-wrapper';
import { doc, getDoc } from 'firebase/firestore';
import { stickerPacks, gifCollection } from '@/lib/stickers';
import { correctText, detectLanguage } from '@/lib/aiCorrection';
import Message from './Message';
import ChatInput, { type ChatInputHandle } from './ChatInput';
import FounderBadge from './FounderBadge';
import PremiumBadge from './PremiumBadge';
import PremiumModal from './PremiumModal';
import { getGiftAnimatedUrl } from '@/lib/gifts';

type PickerTab = 'emoji' | 'stickers' | 'gifs' | 'my-stickers';

export default function ChatView() {
  const { contacts, activeChatId, setView, sendMessage, editMessage, deleteMessage, forwardMessage, saveSticker, removeSavedSticker, savedStickers, themeColor, wallpaper, isGlassEnabled, clearHistory, deleteChat, user, setTypingStatus, isDarkMode, isAiTrialActive, startAiTrial, aiTrialStart } = useChat();
  const chatInputRef = useRef<ChatInputHandle>(null);
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
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [contextMenu, setContextMenu] = useState<{ msgId: string; x: number; y: number } | null>(null);
  const [showForwardPicker, setShowForwardPicker] = useState(false);
  const [editingMsg, setEditingMsg] = useState<{ id: string; text: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ messageId: string; senderName: string; text: string; senderAvatar?: string } | null>(null);
  const [selectedStickerPack, setSelectedStickerPack] = useState<string | null>(null);
  const [gifSearch, setGifSearch] = useState('');
  const [isUploadingSticker, setIsUploadingSticker] = useState(false);
  const [showStickerCreator, setShowStickerCreator] = useState(false);
  const [stickerPreview, setStickerPreview] = useState<string | null>(null);
  const [stickerName, setStickerName] = useState('');
  const [stickerFile, setStickerFile] = useState<File | null>(null);
  const [channelOwnerId, setChannelOwnerId] = useState<string | null>(null);
  
  // ИИ исправление
  const [aiCorrectionModal, setAiCorrectionModal] = useState<{
    messageId: string;
    originalText: string;
    correctedText: string;
    isLoading: boolean;
  } | null>(null);

  // Paywall модалка, когда пробный период AI иссяк.
  const [showAiPaywall, setShowAiPaywall] = useState(false);

  // Стабилизируем contact через useMemo чтобы избежать потери при обновлении contacts
  const contact = useMemo(() => activeChatId ? contacts[activeChatId] : null, [activeChatId, contacts]);
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

  // Обработка статуса печати с debounce
  const isTypingRef = useRef(false);
  
  const handleInputChange = useCallback((text: string) => {
    // ВРЕМЕННО ОТКЛЮЧЕНО - вызывает баги с очисткой поля
    // TODO: Реализовать через WebSocket или отдельный механизм
    return;
    
    /*
    if (!activeChatId || !setTypingStatus) return;
    
    // Если текст не пустой, отправляем статус "печатает"
    if (text.trim()) {
      // Отправляем статус только если он ещё не установлен
      if (!isTypingRef.current) {
        setTypingStatus(activeChatId, true);
        isTypingRef.current = true;
      }
      
      // Сбрасываем предыдущий таймер
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      
      // Через 2 секунды после остановки печати убираем статус
      typingTimerRef.current = setTimeout(() => {
        setTypingStatus(activeChatId, false);
        isTypingRef.current = false;
      }, 2000);
    } else {
      // Если текст пустой, сразу убираем статус
      if (isTypingRef.current) {
        setTypingStatus(activeChatId, false);
        isTypingRef.current = false;
      }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    }
    */
  }, [activeChatId, setTypingStatus]);

  // Очистка таймера при размонтировании (ОТКЛЮЧЕНО)
  useEffect(() => {
    return () => {
      // Временно отключено
      /*
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      // Убираем статус печати при выходе из чата
      if (activeChatId && setTypingStatus && isTypingRef.current) {
        setTypingStatus(activeChatId, false);
        isTypingRef.current = false;
      }
      */
    };
  }, [activeChatId, setTypingStatus]);

  // Загрузка информации о владельце канала
  useEffect(() => {
    if (contact?.isChannel && activeChatId) {
      const loadChannelOwner = async () => {
        try {
          const channelDoc = await getDoc(doc(db, 'channels', activeChatId));
          if (channelDoc.exists()) {
            setChannelOwnerId(channelDoc.data().ownerId);
          }
        } catch (error) {
          console.error('Error loading channel owner:', error);
        }
      };
      loadChannelOwner();
    }
  }, [contact?.isChannel, activeChatId]);

  // ИИ исправление текста (тап по сообщению). Первый день бесплатно — дальше paywall.
  const handleAiCorrection = useCallback(async (messageId: string, originalText: string) => {
    if (!isAiTrialActive()) {
      setShowAiPaywall(true);
      return;
    }
    if (!aiTrialStart) startAiTrial();

    setAiCorrectionModal({
      messageId,
      originalText,
      correctedText: originalText,
      isLoading: true,
    });

    try {
      const language = detectLanguage(originalText);
      const result = await correctText(originalText, language);
      
      setAiCorrectionModal(prev => prev ? {
        ...prev,
        correctedText: result.correctedText,
        isLoading: false,
      } : null);
    } catch (error) {
      console.error('AI correction error:', error);
      setAiCorrectionModal(prev => prev ? {
        ...prev,
        isLoading: false,
      } : null);
    }
  }, [isAiTrialActive, aiTrialStart, startAiTrial, setShowAiPaywall, setAiCorrectionModal]);

  // AI исправление текста в поле ввода до отправки. Режим общий с триалом.
  const handleAiFixInput = useCallback(async (text: string): Promise<string> => {
    if (!isAiTrialActive()) {
      setShowAiPaywall(true);
      return text;
    }
    if (!aiTrialStart) startAiTrial();
    try {
      const language = detectLanguage(text);
      const result = await correctText(text, language);
      return result.correctedText && result.correctedText.trim() ? result.correctedText : text;
    } catch (error) {
      console.error('AI input fix error:', error);
      return text;
    }
  }, [isAiTrialActive, aiTrialStart, startAiTrial, setShowAiPaywall]);

  // Применить исправления
  const applyCorrection = useCallback(async () => {
    if (!aiCorrectionModal) return;
    
    try {
      await editMessage(aiCorrectionModal.messageId, aiCorrectionModal.correctedText);
      setAiCorrectionModal(null);
    } catch (error) {
      console.error('Error applying correction:', error);
    }
  }, [aiCorrectionModal, editMessage]);
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

  // Обработчик отправки для ChatInput
  const handleSendFromInput = useCallback((text: string) => {
    if (text.trim() && !contact.isBlocked) {
      if (editingMsg) {
        editMessage(editingMsg.id, text.trim());
        setEditingMsg(null);
      } else {
        sendMessage(text.trim(), replyingTo ? { replyTo: replyingTo } : undefined);
      }
      setShowPicker(false);
      setReplyingTo(null);
    }
  }, [contact.isBlocked, editingMsg, replyingTo, editMessage, sendMessage]);

  const handleEmojiClick = (emoji: string) => {
    chatInputRef.current?.insertText(emoji);
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
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (stream) stream.getTracks().forEach(track => track.stop());
        try {
          // Загружаем через Supabase Storage
          const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
          const result = await uploadFile(audioFile, auth.currentUser?.uid || '', 'audio');
          sendMessage('Голосовое сообщение', { audioUrl: result.url });
        } catch (error) { console.error('Error uploading audio:', error); alert('Ошибка при загрузке голосового сообщения'); }
      };
      mediaRecorder.onerror = () => {
        if (stream) stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => { setRecordingTime(prev => prev + 1); }, 1000);
    } catch (err) {
      if (stream) stream.getTracks().forEach(track => track.stop());
      console.error('Error accessing microphone', err);
      alert('Нет доступа к микрофону');
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
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    console.log('File selected:', file.name, file.type, file.size);
    setShowAttachMenu(false);
    
    try {
      if (!auth.currentUser) {
        alert('Пожалуйста, войдите в систему');
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      
      console.log('Starting upload...');

      // Загружаем через Storage Wrapper с прогрессом
      const result = await uploadFile(
        file, 
        auth.currentUser.uid,
        undefined,
        (progress) => {
          console.log('Upload progress:', progress.percentage + '%');
          setUploadProgress(progress.percentage);
        }
      );
      
      console.log('Upload complete:', result);
      
      const fileType = file.type;
      const isImage = fileType.startsWith('image/');
      const isVideo = fileType.startsWith('video/');
      const isAudio = fileType.startsWith('audio/');
      
      // Отправляем сообщение с правильным типом
      if (isImage) {
        console.log('Sending image message');
        sendMessage('', { fileUrl: result.url, fileName: file.name });
      } else if (isVideo) {
        console.log('Sending video message');
        sendMessage('', { fileUrl: result.url, fileName: file.name });
      } else if (isAudio) {
        console.log('Sending audio message');
        sendMessage('', { audioUrl: result.url });
      } else {
        console.log('Sending file message');
        sendMessage(`Файл: ${file.name}`, { fileUrl: result.url, fileName: file.name });
      }
      
      setIsUploading(false);
      setUploadProgress(0);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setIsUploading(false);
      setUploadProgress(0);
      alert(error.message || 'Ошибка при загрузке файла');
    }
    
    // Очищаем input для возможности загрузки того же файла снова
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, msgId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ msgId, x: e.clientX, y: e.clientY });
  }, []);

  // Поддержка долгого нажатия для мобильных устройств.
  // Используем ref-ы вместо useState, чтобы touch-обработчики оставались
  // стабильными между рендерами — иначе memoized <Message> перерисовывался
  // на каждое нажатие клавиши в инпуте.
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent, msgId: string) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };

    longPressTimerRef.current = setTimeout(() => {
      // Вибрация при долгом нажатии (если поддерживается)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setContextMenu({
        msgId,
        x: touch.clientX,
        y: touch.clientY,
      });
    }, 500); // 500ms для долгого нажатия
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartRef.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const start = touchStartRef.current;
    const timer = longPressTimerRef.current;
    if (start && timer) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - start.x);
      const deltaY = Math.abs(touch.clientY - start.y);

      // Если палец сдвинулся больше чем на 10px, отменяем долгое нажатие
      if (deltaX > 10 || deltaY > 10) {
        clearTimeout(timer);
        longPressTimerRef.current = null;
      }
    }
  }, []);

  const handleEdit = (msgId: string, text: string) => {
    setEditingMsg({ id: msgId, text });
    requestAnimationFrame(() => chatInputRef.current?.focus());
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

  const contactAvatarUrl = contact?.avatarUrl;
  const handleReply = useCallback((msgId: string, senderName: string, text: string) => {
    setReplyingTo({
      messageId: msgId,
      senderName,
      text: text.substring(0, 100),
      senderAvatar: contactAvatarUrl,
    });
    setContextMenu(null);
    // Фокусируемся на поле ввода
    setTimeout(() => chatInputRef.current?.focus(), 100);
  }, [contactAvatarUrl]);

  const handleForwardTo = (targetChatId: string) => {
    const msg = contact.messages.find(m => m.id === contextMenu?.msgId);
    if (msg) forwardMessage(msg, targetChatId);
    setShowForwardPicker(false);
  };

  const cancelEdit = () => {
    setEditingMsg(null);
    chatInputRef.current?.clear();
  };

  const cancelReply = () => { 
    setReplyingTo(null); 
  };

  const forwardableContacts = useMemo(() =>
    Object.values(contacts).filter(c => c.id !== activeChatId && c.id !== 'saved_messages'),
    [contacts, activeChatId]
  );

  const filteredGifs = useMemo(() => {
    if (!gifSearch.trim()) return gifCollection;
    return gifCollection;
  }, [gifSearch]);

  const currentPack = selectedStickerPack ? stickerPacks.find(p => p.id === selectedStickerPack) : null;

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-tg-bg-light flex flex-col z-10"
    >
      {/* Header */}
      <motion.div
        initial={false}
        className={`text-tg-header-text px-2.5 h-12 flex items-center gap-2.5 shrink-0 transition-colors fixed top-0 left-0 right-0 z-30 ${isGlassEnabled ? 'backdrop-blur-xl border-b border-white/20 shadow-xl' : 'shadow-lg'}`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'DD' : themeColor }}
      >
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); setView('menu'); }} 
          className="p-1.5 rounded-full hover:bg-white/15 active:bg-white/25 transition-all duration-200"
        >
          <ArrowLeft size={24} />
        </motion.button>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2.5 cursor-pointer hover:bg-white/10 p-1.5 rounded-lg transition-all" 
          onClick={() => setView('profile')}
        >
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
            <div className="font-medium text-[16px] flex items-center gap-1">
              {contact.name}
              {contact.isFounder && <FounderBadge size={18} />}
              {contact.isOfficial && !contact.isFounder && <BadgeCheck size={16} className="text-blue-500 fill-blue-500 text-white" />}
              {contact.premium && (
                <PremiumBadge 
                  size="sm" 
                  onClick={() => setShowPremiumModal(true)}
                />
              )}
              {(() => {
                const protectedBy = contact.copyProtectedBy || {};
                const anyActive = Object.keys(protectedBy).length > 0;
                if (!anyActive) return null;
                return (
                  <motion.span
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                    whileHover={{ rotate: [0, -8, 8, -4, 4, 0] }}
                    className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-white/20"
                    title="В этом чате включена защита от копирования"
                    aria-label="Защита от копирования активна"
                  >
                    <Lock size={11} className="text-white" />
                  </motion.span>
                );
              })()}
            </div>
            <div className="text-[13px] text-[#d1e0ec]">{contact.isChannel ? contact.statusOnline : (contact.isTyping ? 'печатает...' : contact.statusOffline)}</div>
          </div>
        </motion.div>
        <div className="flex-grow"></div>
        {contact.isChannel ? (
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setView('channel-info')} 
            className="p-1.5 rounded-full hover:bg-white/15 active:bg-white/25 transition-all duration-200"
          >
            <Info size={24} />
          </motion.button>
        ) : (
          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={{ 
                rotate: isMenuOpen ? 90 : 0,
              }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20 
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
                console.log('Menu button clicked, isMenuOpen:', !isMenuOpen);
              }} 
              className="p-1.5 rounded-full hover:bg-white/15 active:bg-white/25 transition-all duration-200 relative z-50"
            >
              <MoreVertical size={24} />
            </motion.button>
            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100]" 
                    onClick={() => {
                      setIsMenuOpen(false);
                      console.log('Backdrop clicked, closing menu');
                    }} 
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`absolute right-2 top-full mt-1 w-48 rounded-xl shadow-2xl py-1 z-[110] overflow-hidden ${
                      isDarkMode 
                        ? 'bg-[#1a1a1a] border border-gray-800' 
                        : 'bg-white'
                    }`}
                  >
                    <button 
                      onClick={() => { setShowClearModal(true); setIsMenuOpen(false); }} 
                      className={`w-full text-left px-4 py-3 text-[15px] transition-colors flex items-center gap-3 ${
                        isDarkMode 
                          ? 'hover:bg-gray-800 text-gray-200' 
                          : 'hover:bg-gray-100 text-black'
                      }`}
                    >
                      <Trash2 size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                      Очистить историю
                    </button>
                    <div className={`h-px mx-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
                    <button 
                      onClick={() => { setShowDeleteModal(true); setIsMenuOpen(false); }} 
                      className={`w-full text-left px-4 py-3 text-[15px] text-red-500 transition-colors flex items-center gap-3 ${
                        isDarkMode 
                          ? 'hover:bg-red-500/10' 
                          : 'hover:bg-red-50'
                      }`}
                    >
                      <X size={18} className="text-red-500" />
                      Удалить чат
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-grow overflow-y-auto p-2.5 pt-14 flex flex-col gap-0.5 no-scrollbar relative z-10"
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

        {contact.messages.map((msg, index) => {
          const isOwn = msg.type === 'sent';
          const prevMsg = index > 0 ? contact.messages[index - 1] : null;
          const nextMsg = index < contact.messages.length - 1 ? contact.messages[index + 1] : null;
          
          // Группировка сообщений от одного отправителя
          const isFirstInGroup = !prevMsg || prevMsg.type !== msg.type;
          const isLastInGroup = !nextMsg || nextMsg.type !== msg.type;
          const showAvatar = isLastInGroup && !isOwn;
          const marginTop = isFirstInGroup ? 'mt-2' : 'mt-0.5';

          // Если это подарок, рендерим его отдельно (с анимациями)
          if (msg.gift) {
            return (
              <motion.div
                key={msg.id}
                initial={false}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className={`rounded-2xl p-4 text-white text-center min-w-[200px] relative overflow-hidden mb-1.5 ${
                  isOwn ? 'self-end' : 'self-start'
                } ${
                  msg.gift.id === 'cosmonaut'
                    ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-black'
                    : msg.gift.id === 'easter_bunny'
                    ? 'bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400'
                    : msg.gift.id === 'may_1'
                    ? 'bg-gradient-to-br from-red-500 via-rose-500 to-orange-400'
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
                
                {/* Фон для 1 Мая — тюльпаны и искры */}
                {msg.gift.id === 'may_1' && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background:
                          'radial-gradient(circle at 50% 25%, rgba(255,255,255,0.45) 0%, transparent 60%)',
                      }}
                      animate={{ opacity: [0.4, 0.9, 0.4] }}
                      transition={{ duration: 2.4, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute top-2 left-2 text-[24px]"
                      animate={{ rotate: [0, 10, -10, 0], y: [0, -4, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity }}
                    >
                      🌷
                    </motion.div>
                    <motion.div
                      className="absolute top-2 right-2 text-[24px]"
                      animate={{ rotate: [0, -10, 10, 0], y: [0, -4, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, delay: 0.5 }}
                    >
                      🌸
                    </motion.div>
                    <motion.div
                      className="absolute bottom-2 left-2 text-[24px]"
                      animate={{ rotate: [0, 10, -10, 0], y: [0, 4, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, delay: 1 }}
                    >
                      ✨
                    </motion.div>
                    <motion.div
                      className="absolute bottom-2 right-2 text-[24px]"
                      animate={{ rotate: [0, -10, 10, 0], y: [0, 4, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, delay: 1.5 }}
                    >
                      🌺
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
                      : msg.gift.id === 'may_1'
                      ? {
                          scale: [1, 1.12, 1],
                          rotate: [0, -8, 8, -4, 4, 0],
                          y: [0, -12, 0, -6, 0]
                        }
                      : {
                          scale: [1, 1.15, 1],
                          rotate: [0, -15, 15, -10, 10, -5, 5, 0],
                          y: [0, -10, 0, -5, 0]
                        }
                  }
                  transition={{
                    duration:
                      msg.gift.id === 'cosmonaut'
                        ? 3
                        : msg.gift.id === 'easter_bunny'
                        ? 2
                        : msg.gift.id === 'may_1'
                        ? 2.4
                        : 1.5,
                    times: [0, 0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 1],
                    ease: 'easeInOut',
                    repeat:
                      msg.gift.id === 'easter_bunny' ||
                      msg.gift.id === 'cosmonaut' ||
                      msg.gift.id === 'may_1'
                        ? Infinity
                        : 0,
                  }}
                  className="mb-2 relative z-10 flex items-center justify-center"
                >
                  {getGiftAnimatedUrl(msg.gift.id) ? (
                    <NextImage
                      src={getGiftAnimatedUrl(msg.gift.id)!}
                      alt={msg.gift.name}
                      width={80}
                      height={80}
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <span className="text-[80px]">{msg.gift.emoji}</span>
                  )}
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
                {msg.gift.id === 'may_1' && (
                  <div className="text-[11px] text-yellow-100 mt-1 relative z-10">
                    🌷 С праздником весны и труда! 🌷
                  </div>
                )}
              </motion.div>
            );
          }

          // Для обычных сообщений используем мемоизированный компонент с улучшениями
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.5
              }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} w-full`}
            >
              <div className={`max-w-[75%] ${marginTop}`}>
                <Message
                  msg={msg}
                  isOwn={isOwn}
                  themeColor={themeColor}
                  isChannel={contact.isChannel || false}
                  onContextMenu={handleContextMenu}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                  onSaveSticker={saveSticker}
                  onReply={handleReply}
                  showAvatar={showAvatar}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                  isCopyProtected={!isOwn && Boolean(msg.senderId && contact.copyProtectedBy?.[msg.senderId])}
                />
              </div>
            </motion.div>
          );
        })}

        {/* Индикатор печати - всегда в DOM, но скрыт через opacity */}
        <motion.div 
          initial={false}
          animate={{ 
            opacity: contact.isTyping && !contact.isBlocked ? 1 : 0,
            marginBottom: contact.isTyping && !contact.isBlocked ? '6px' : '0px',
            height: contact.isTyping && !contact.isBlocked ? 'auto' : '0px'
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`flex items-center px-3 py-2 bg-tg-received-bubble self-start rounded-[18px] rounded-bl-[5px] message-tail-received relative shadow-md overflow-hidden ${
            contact.isTyping && !contact.isBlocked 
              ? 'min-h-[44px]' 
              : 'pointer-events-none'
          }`}
        >
          <div className="dot-flashing"></div>
        </motion.div>
        <div ref={messagesEndRef} />
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (() => {
          const msg = contact.messages.find(m => m.id === contextMenu.msgId);
          if (!msg) return null;
          const isOwn = msg.type === 'sent';
          const canEdit = isOwn && !msg.audioUrl && !msg.fileUrl && !msg.stickerUrl && !msg.gifUrl;
          const isProtectedIncoming = !isOwn && Boolean(msg.senderId && contact.copyProtectedBy?.[msg.senderId]);

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-[60] bg-white rounded-xl shadow-2xl border border-gray-100 py-1 min-w-[180px]"
              style={{
                left: Math.min(contextMenu.x, window.innerWidth - 200),
                top: Math.min(contextMenu.y, window.innerHeight - 300),
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {canEdit && (
                <button onClick={() => handleEdit(msg.id, msg.text)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left text-[15px] text-gray-700 transition-colors">
                  <Edit3 size={18} className="text-gray-500" /> Редактировать
                </button>
              )}
              <button onClick={() => handleReply(msg.id, isOwn ? 'Вы' : contact.name, msg.text)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left text-[15px] text-gray-700 transition-colors">
                <Reply size={18} className="text-gray-500" /> Ответить
              </button>
              {!isProtectedIncoming && (
                <button onClick={() => handleForward(msg.id)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left text-[15px] text-gray-700 transition-colors">
                  <Repeat2 size={18} className="text-gray-500" /> Переслать
                </button>
              )}
              {isProtectedIncoming && (
                <div
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-gray-500 bg-gray-50/70"
                  title="Собеседник включил защиту от копирования"
                >
                  <Lock size={16} className="text-gray-400" />
                  <span>Копирование и пересылка ограничены</span>
                </div>
              )}
              {msg.stickerUrl && !savedStickers.includes(msg.stickerUrl) && (
                <button onClick={() => { saveSticker(msg.stickerUrl!); setContextMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left text-[15px] text-gray-700">
                  <Download size={18} className="text-gray-500" /> Сохранить стикер
                </button>
              )}
              {isOwn && msg.text && (
                <button 
                  onClick={() => { 
                    handleAiCorrection(msg.id, msg.text); 
                    setContextMenu(null); 
                  }} 
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 text-left text-[15px] text-purple-600"
                >
                  <Sparkles size={18} className="text-purple-500" /> ИИ исправление
                </button>
              )}
              {isOwn && (
                <button onClick={() => handleDelete(msg.id)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-left text-[15px] text-red-500">
                  <Trash2 size={18} /> Удалить
                </button>
              )}
            </motion.div>
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

      {/* Input Area - New Telegram Style */}
      {contact.isChannel && channelOwnerId && user?.uid !== channelOwnerId ? (
        <div className={`flex items-center justify-center px-4 py-3 border-t border-gray-200 shrink-0 ${isGlassEnabled ? 'backdrop-blur-xl bg-white/80' : 'bg-white'}`}>
          <span className="text-gray-500 text-[15px]">Только владелец канала может отправлять сообщения</span>
        </div>
      ) : (
        <>
          {/* Upload Progress Indicator */}
          <AnimatePresence>
            {isUploading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`px-4 py-3 border-t border-gray-200 ${isGlassEnabled ? 'backdrop-blur-xl bg-white/80' : 'bg-white'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Загрузка файла...</span>
                      <span className="text-sm font-medium text-blue-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                        className="bg-blue-500 h-full rounded-full"
                      />
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <ChatInput
            ref={chatInputRef}
            isRecording={isRecording}
            recordingTime={recordingTime}
            isBlocked={contact.isBlocked || false}
            editingMsg={editingMsg}
            replyingTo={replyingTo}
            themeColor={themeColor}
            isGlassEnabled={isGlassEnabled}
            isDarkMode={isDarkMode}
            onSend={handleSendFromInput}
            onInputChange={handleInputChange}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onCancelEdit={cancelEdit}
            onCancelReply={cancelReply}
            onShowPicker={() => { setShowPicker(!showPicker); setPickerTab('emoji'); }}
            onShowAttachMenu={() => setShowAttachMenu(!showAttachMenu)}
            showAttachMenu={showAttachMenu}
            onAiFix={handleAiFixInput}
          />
          
          {/* Attach Menu Popup */}
          <AnimatePresence>
            {showAttachMenu && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/20 z-40"
                  onClick={() => setShowAttachMenu(false)}
                />
                
                {/* Menu */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  className="fixed bottom-24 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-w-sm mx-auto"
                >
                  <input type="file" ref={imageInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                  <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={handleFileUpload} />
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  
                  <div className="p-3">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { imageInputRef.current?.click(); setShowAttachMenu(false); }} 
                      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-blue-50 rounded-xl text-left transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                        <ImageIcon size={22} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="text-gray-900 font-medium text-[15px]">Фото / Видео</div>
                        <div className="text-gray-500 text-[13px]">Отправить изображение или видео</div>
                      </div>
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { audioInputRef.current?.click(); setShowAttachMenu(false); }} 
                      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-orange-50 rounded-xl text-left transition-colors mt-1"
                    >
                      <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white shrink-0">
                        <Music size={22} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="text-gray-900 font-medium text-[15px]">Музыка</div>
                        <div className="text-gray-500 text-[13px]">Отправить аудио файл</div>
                      </div>
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }} 
                      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-purple-50 rounded-xl text-left transition-colors mt-1"
                    >
                      <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white shrink-0">
                        <FileIcon size={22} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="text-gray-900 font-medium text-[15px]">Файл</div>
                        <div className="text-gray-500 text-[13px]">Отправить документ</div>
                      </div>
                    </motion.button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
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

      {/* AI Correction Modal */}
      <AnimatePresence>
        {aiCorrectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
              onClick={() => setAiCorrectionModal(null)} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: aiCorrectionModal.isLoading ? 360 : 0 }}
                    transition={{ duration: 1, repeat: aiCorrectionModal.isLoading ? Infinity : 0, ease: "linear" }}
                  >
                    <Sparkles size={24} />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold">ИИ Исправление</h3>
                    <p className="text-purple-100 text-sm">
                      {aiCorrectionModal.isLoading ? 'Анализируем текст...' : 'Проверьте исправления'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Original Text */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Оригинальный текст:</label>
                  <div className="p-3 bg-gray-50 rounded-xl border text-gray-800 text-sm">
                    {aiCorrectionModal.originalText}
                  </div>
                </div>

                {/* Corrected Text */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Исправленный текст:</label>
                  <div className="relative">
                    {aiCorrectionModal.isLoading ? (
                      <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"
                        />
                        <span className="ml-3 text-purple-600 font-medium">Исправляем...</span>
                      </div>
                    ) : (
                      <textarea
                        value={aiCorrectionModal.correctedText}
                        onChange={(e) => setAiCorrectionModal(prev => prev ? {
                          ...prev,
                          correctedText: e.target.value
                        } : null)}
                        className="w-full p-3 bg-green-50 border border-green-200 rounded-xl text-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-300"
                        rows={4}
                      />
                    )}
                  </div>
                </div>

                {/* Comparison */}
                {!aiCorrectionModal.isLoading && aiCorrectionModal.originalText !== aiCorrectionModal.correctedText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-blue-50 border border-blue-200 rounded-xl"
                  >
                    <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
                      <CheckCircle size={16} />
                      Найдены исправления
                    </div>
                    <p className="text-blue-600 text-xs">
                      ИИ предложил улучшения для вашего сообщения
                    </p>
                  </motion.div>
                )}

                {!aiCorrectionModal.isLoading && aiCorrectionModal.originalText === aiCorrectionModal.correctedText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-green-50 border border-green-200 rounded-xl"
                  >
                    <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-1">
                      <CheckCircle size={16} />
                      Текст выглядит отлично!
                    </div>
                    <p className="text-green-600 text-xs">
                      Ошибок не найдено
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Actions */}
              <div className="flex border-t border-gray-200">
                <button 
                  onClick={() => setAiCorrectionModal(null)} 
                  className="flex-1 py-4 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                  disabled={aiCorrectionModal.isLoading}
                >
                  Отмена
                </button>
                <button 
                  onClick={applyCorrection}
                  disabled={aiCorrectionModal.isLoading}
                  className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiCorrectionModal.isLoading ? 'Загрузка...' : 'Применить'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        userName={contact?.name || ''}
        onUpgrade={() => {
          setShowPremiumModal(false);
          setView('premium');
        }}
      />

      {/* AI Trial Paywall Modal */}
      <AnimatePresence>
        {showAiPaywall && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowAiPaywall(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
                  <Sparkles size={26} />
                </div>
                <div>
                  <div className="text-[18px] font-semibold text-gray-900">Пробный период закончился</div>
                  <div className="text-[13px] text-gray-500">AI исправление — функция HouseGram Premium</div>
                </div>
              </div>
              <p className="text-[14px] text-gray-700 leading-relaxed mb-5">
                Первые 24 часа AI исправление работает бесплатно для каждого пользователя.
                Чтобы пользоваться им дальше, оформите HouseGram Premium — больше AI-запросов, эксклюзивные эмодзи и значки.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowAiPaywall(false)}
                  className="px-4 py-2 rounded-xl text-[14px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Позже
                </button>
                <button
                  onClick={() => {
                    setShowAiPaywall(false);
                    setView('premium');
                  }}
                  className="px-4 py-2 rounded-xl text-[14px] font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition-opacity shadow-md"
                >
                  Подключить Premium
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}