'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, Paperclip, Image as ImageIcon, Video, Music, File as FileIcon, Plus, Users, Settings, Hash, Lock, Globe, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { getMatrixClient } from '@/lib/matrix-client';
import { Room, MatrixEvent, EventType, MsgType } from 'matrix-js-sdk';
import NextImage from 'next/image';

interface MatrixChatViewProps {
  roomId: string;
  onBack: () => void;
}

interface MatrixMessage {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  content: string;
  sender: string;
  senderName: string;
  timestamp: number;
  url?: string;
  filename?: string;
  filesize?: number;
  mimetype?: string;
  width?: number;
  height?: number;
  isOwn: boolean;
}

export default function MatrixChatView({ roomId, onBack }: MatrixChatViewProps) {
  const { themeColor, isGlassEnabled } = useChat();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<MatrixMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const matrixClient = getMatrixClient();

  // Загрузка комнаты и сообщений
  useEffect(() => {
    if (!matrixClient || !matrixClient.isReady()) {
      setError('Matrix клиент не подключен');
      setIsLoading(false);
      return;
    }

    const loadRoom = async () => {
      try {
        const matrixRoom = matrixClient.getRoom(roomId);
        if (!matrixRoom) {
          setError('Комната не найдена');
          setIsLoading(false);
          return;
        }

        setRoom(matrixRoom);
        
        // Загружаем сообщения
        const timeline = matrixRoom.getLiveTimeline();
        const events = timeline.getEvents();
        
        const matrixMessages: MatrixMessage[] = events
          .filter(event => event.getType() === EventType.RoomMessage)
          .map(event => convertMatrixEventToMessage(event))
          .filter(msg => msg !== null) as MatrixMessage[];

        setMessages(matrixMessages);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to load Matrix room:', err);
        setError(err.message || 'Ошибка загрузки комнаты');
        setIsLoading(false);
      }
    };

    loadRoom();
  }, [roomId, matrixClient]);

  // Подписка на новые сообщения
  useEffect(() => {
    if (!matrixClient || !matrixClient.isReady()) return;

    const handleNewMessage = (event: MatrixEvent) => {
      if (event.getRoomId() === roomId && event.getType() === EventType.RoomMessage) {
        const message = convertMatrixEventToMessage(event);
        if (message) {
          setMessages(prev => [...prev, message]);
        }
      }
    };

    matrixClient.onMessage(handleNewMessage);

    return () => {
      // Отписываемся от событий при размонтировании
      const client = matrixClient.getClient();
      if (client) {
        client.removeListener('Room.timeline' as any, handleNewMessage);
      }
    };
  }, [roomId, matrixClient]);

  // Автоскролл к новым сообщениям
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const convertMatrixEventToMessage = (event: MatrixEvent): MatrixMessage | null => {
    const content = event.getContent();
    const sender = event.getSender();
    const senderName = room?.getMember(sender || '')?.name || sender || 'Unknown';
    const currentUserId = matrixClient?.getUserId();

    if (!content.msgtype) return null;

    const baseMessage = {
      id: event.getId() || '',
      sender: sender || '',
      senderName,
      timestamp: event.getTs(),
      isOwn: sender === currentUserId,
    };

    // Функция для получения URL (поддержка как Matrix mxc://, так и прямых MEGA URLs)
    const getFileUrl = (url: string): string => {
      if (!url) return '';
      
      // Если это MEGA URL, возвращаем как есть
      if (url.startsWith('https://mega.nz/')) {
        return url;
      }
      
      // Если это Matrix mxc:// URL, конвертируем
      if (url.startsWith('mxc://')) {
        return matrixClient?.getClient()?.mxcUrlToHttp(url) || '';
      }
      
      // Иначе возвращаем как есть
      return url;
    };

    switch (content.msgtype) {
      case MsgType.Text:
        return {
          ...baseMessage,
          type: 'text',
          content: content.body || '',
        };

      case MsgType.Image:
        return {
          ...baseMessage,
          type: 'image',
          content: content.body || 'Изображение',
          url: getFileUrl(content.url),
          width: content.info?.w,
          height: content.info?.h,
          filesize: content.info?.size,
          mimetype: content.info?.mimetype,
        };

      case MsgType.Video:
        return {
          ...baseMessage,
          type: 'video',
          content: content.body || 'Видео',
          url: getFileUrl(content.url),
          filesize: content.info?.size,
          mimetype: content.info?.mimetype,
        };

      case MsgType.Audio:
        return {
          ...baseMessage,
          type: 'audio',
          content: content.body || 'Аудио',
          url: getFileUrl(content.url),
          filesize: content.info?.size,
          mimetype: content.info?.mimetype,
        };

      case MsgType.File:
        return {
          ...baseMessage,
          type: 'file',
          content: content.body || 'Файл',
          url: getFileUrl(content.url),
          filename: content.filename || content.body,
          filesize: content.info?.size,
          mimetype: content.info?.mimetype,
        };

      default:
        return null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !matrixClient || !room || isSending) return;

    setIsSending(true);
    try {
      await matrixClient.sendTextMessage(roomId, inputText.trim());
      setInputText('');
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err.message || 'Ошибка отправки сообщения');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'image' | 'video' | 'audio' | 'file') => {
    if (!matrixClient || !room) return;

    setIsUploading(true);
    setShowAttachMenu(false);

    try {
      switch (type) {
        case 'image':
          await matrixClient.sendImageMessage(roomId, file);
          break;
        case 'video':
          await matrixClient.sendVideoMessage(roomId, file);
          break;
        case 'audio':
          await matrixClient.sendAudioMessage(roomId, file);
          break;
        case 'file':
          await matrixClient.sendFileMessage(roomId, file);
          break;
      }
    } catch (err: any) {
      console.error('Failed to upload file:', err);
      setError(err.message || 'Ошибка загрузки файла');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="absolute inset-0 bg-tg-bg-light flex items-center justify-center z-10">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 size={48} className="animate-spin text-blue-500" />
          <p className="text-gray-600">Загрузка комнаты...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 bg-tg-bg-light flex items-center justify-center z-10">
        <div className="flex flex-col items-center space-y-4 p-6">
          <AlertCircle size={48} className="text-red-500" />
          <p className="text-red-600 text-center">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-tg-bg-light flex flex-col z-10"
    >
      {/* Header */}
      <motion.div
        className={`text-tg-header-text px-4 h-14 flex items-center gap-3 shrink-0 transition-colors ${
          isGlassEnabled ? 'backdrop-blur-xl border-b border-white/20 shadow-xl' : 'shadow-lg'
        }`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'DD' : themeColor }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="p-2 rounded-full hover:bg-white/15 active:bg-white/25 transition-all duration-200"
        >
          <ArrowLeft size={24} />
        </motion.button>
        
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
            {room?.isSpaceRoom() ? <Hash size={20} /> : 
             room?.getJoinRule() === 'public' ? <Globe size={20} /> : <Lock size={20} />}
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-lg">{room?.name || 'Matrix Chat'}</h1>
            <p className="text-sm opacity-80">
              {room?.getJoinedMemberCount()} участников
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-full hover:bg-white/15 active:bg-white/25 transition-all duration-200"
        >
          <Settings size={24} />
        </motion.button>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>Пока нет сообщений</p>
              <p className="text-sm">Начните общение!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.isOwn
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                }`}
              >
                {!message.isOwn && (
                  <div className="text-xs font-medium mb-1 opacity-70">
                    {message.senderName}
                  </div>
                )}

                {message.type === 'text' && (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}

                {message.type === 'image' && message.url && (
                  <div className="space-y-2">
                    <NextImage
                      src={message.url}
                      alt={message.content}
                      width={message.width || 300}
                      height={message.height || 200}
                      className="rounded-lg max-w-full h-auto"
                      unoptimized
                    />
                    {message.content !== 'Изображение' && (
                      <div className="text-sm">{message.content}</div>
                    )}
                  </div>
                )}

                {message.type === 'video' && message.url && (
                  <div className="space-y-2">
                    <video
                      src={message.url}
                      controls
                      className="rounded-lg max-w-full h-auto"
                    />
                    {message.content !== 'Видео' && (
                      <div className="text-sm">{message.content}</div>
                    )}
                  </div>
                )}

                {message.type === 'audio' && message.url && (
                  <div className="space-y-2">
                    <audio src={message.url} controls className="w-full" />
                    {message.content !== 'Аудио' && (
                      <div className="text-sm">{message.content}</div>
                    )}
                  </div>
                )}

                {message.type === 'file' && message.url && (
                  <div className="flex items-center gap-3 p-2 bg-black/10 rounded-lg">
                    <FileIcon size={24} className="text-gray-600" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{message.filename}</div>
                      {message.filesize && (
                        <div className="text-xs opacity-70">
                          {formatFileSize(message.filesize)}
                        </div>
                      )}
                    </div>
                    <a
                      href={message.url}
                      download={message.filename}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <FileIcon size={20} />
                    </a>
                  </div>
                )}

                <div className="text-xs opacity-70 mt-2 text-right">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        {isUploading && (
          <div className="mb-3 flex items-center gap-2 text-blue-600">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Загрузка файла...</span>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Attach button */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Paperclip size={24} />
            </motion.button>

            <AnimatePresence>
              {showAttachMenu && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowAttachMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-50"
                  >
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <ImageIcon size={20} className="text-blue-500" />
                      <span>Изображение</span>
                    </button>
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Video size={20} className="text-green-500" />
                      <span>Видео</span>
                    </button>
                    <button
                      onClick={() => audioInputRef.current?.click()}
                      className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Music size={20} className="text-purple-500" />
                      <span>Аудио</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <FileIcon size={20} className="text-gray-500" />
                      <span>Файл</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Text input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Введите сообщение..."
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 resize-none"
              disabled={isSending || isUploading}
            />
          </div>

          {/* Send button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isSending || isUploading}
            className="p-3 bg-blue-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            {isSending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </motion.button>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, 'image');
            e.target.value = '';
          }}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, 'video');
            e.target.value = '';
          }}
          className="hidden"
        />
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, 'audio');
            e.target.value = '';
          }}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, 'file');
            e.target.value = '';
          }}
          className="hidden"
        />
      </div>
    </motion.div>
  );
}