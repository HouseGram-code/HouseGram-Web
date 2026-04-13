import { createClient } from '@supabase/supabase-js';

// Supabase конфигурация (бесплатная альтернатива Firebase)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
});

// Типы для базы данных
export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  status: 'online' | 'offline';
  last_seen: string;
  is_official: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  type: 'text' | 'audio' | 'file' | 'sticker' | 'gif';
  file_url?: string;
  file_name?: string;
  sticker_url?: string;
  gif_url?: string;
  reply_to?: string;
  created_at: string;
  updated_at?: string;
  status: 'sending' | 'sent' | 'read';
}

export interface Chat {
  id: string;
  participants: string[];
  last_message?: string;
  last_message_sender_id?: string;
  updated_at: string;
  created_at: string;
}

// Функции для работы с пользователями
export const userService = {
  async updateStatus(userId: string, status: 'online' | 'offline') {
    const { error } = await supabase
      .from('users')
      .update({ 
        status, 
        last_seen: new Date().toISOString() 
      })
      .eq('id', userId);
    
    if (error) console.error('Error updating status:', error);
    return !error;
  },

  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  async searchUsers(query: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', `%${query}%`)
      .limit(20);
    
    return { data, error };
  },

  subscribeToUserStatus(userId: string, callback: (user: User) => void) {
    return supabase
      .channel(`user:${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      }, (payload) => {
        callback(payload.new as User);
      })
      .subscribe();
  },

  // Подписка на статусы нескольких пользователей
  subscribeToMultipleUserStatuses(userIds: string[], callback: (user: User) => void) {
    const channel = supabase.channel('users-status');
    
    userIds.forEach(userId => {
      channel.on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      }, (payload) => {
        callback(payload.new as User);
      });
    });
    
    return channel.subscribe();
  }
};

// Хелпер для форматирования времени последнего посещения
export const formatLastSeen = (lastSeenStr: string): string => {
  try {
    const lastSeen = new Date(lastSeenStr);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / 60000);
    
    if (diffMinutes < 1) {
      return 'был(а) только что';
    } else if (diffMinutes < 60) {
      return `был(а) ${diffMinutes} мин. назад`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `был(а) ${hours} ч. назад`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return `был(а) ${days} дн. назад`;
    }
  } catch (e) {
    return 'был(а) недавно';
  }
};

// Менеджер онлайн статуса
export class OnlineStatusManager {
  private userId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private visibilityHandler: (() => void) | null = null;
  private beforeUnloadHandler: (() => void) | null = null;
  private pageHideHandler: (() => void) | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Запуск отслеживания статуса
  async start() {
    // Устанавливаем статус "онлайн"
    await userService.updateStatus(this.userId, 'online');

    // Heartbeat каждые 30 секунд для поддержания онлайн статуса
    this.heartbeatInterval = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        await userService.updateStatus(this.userId, 'online');
      }
    }, 30000);

    // Обработчик изменения видимости вкладки
    this.visibilityHandler = async () => {
      const status = document.visibilityState === 'visible' ? 'online' : 'offline';
      await userService.updateStatus(this.userId, status);
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    // Обработчик закрытия страницы
    this.beforeUnloadHandler = () => {
      // Используем sendBeacon для надежной отправки
      const data = JSON.stringify({
        userId: this.userId,
        status: 'offline',
        lastSeen: new Date().toISOString()
      });
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/update-status', data);
      }
      
      // Синхронная попытка обновления
      userService.updateStatus(this.userId, 'offline');
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);

    // Дополнительный обработчик для мобильных устройств
    this.pageHideHandler = () => {
      userService.updateStatus(this.userId, 'offline');
    };
    window.addEventListener('pagehide', this.pageHideHandler);
  }

  // Остановка отслеживания статуса
  async stop() {
    // Очищаем интервал
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Удаляем обработчики событий
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
    if (this.pageHideHandler) {
      window.removeEventListener('pagehide', this.pageHideHandler);
      this.pageHideHandler = null;
    }

    // Устанавливаем статус "оффлайн"
    await userService.updateStatus(this.userId, 'offline');
  }
}

// Функции для работы с сообщениями
export const messageService = {
  async sendMessage(message: Omit<Message, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        ...message,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    return { data, error };
  },

  async getMessages(chatId: string, limit = 50) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  },

  async updateMessage(messageId: string, text: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({ 
        text, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', messageId)
      .select()
      .single();
    
    return { data, error };
  },

  async deleteMessage(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
    
    return { error };
  },

  subscribeToMessages(chatId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        callback(payload.new as Message);
      })
      .subscribe();
  }
};

// Функции для работы с чатами
export const chatService = {
  async getChats(userId: string) {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .contains('participants', [userId])
      .order('updated_at', { ascending: false });
    
    return { data, error };
  },

  async createChat(participants: string[]) {
    const { data, error } = await supabase
      .from('chats')
      .insert([{
        participants,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    return { data, error };
  },

  async updateLastMessage(chatId: string, message: string, senderId: string) {
    const { error } = await supabase
      .from('chats')
      .update({
        last_message: message,
        last_message_sender_id: senderId,
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId);
    
    return { error };
  }
};

// ============================================
// SUPABASE STORAGE - Загрузка файлов
// ============================================

export type FileType = 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'gif';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
}

// Интерфейс для конфигурации файлов
interface FileConfig {
  bucket: string;
  folder: string;
  maxSize: number;
  allowedTypes: string[];
  compress: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

// Конфигурация для разных типов файлов
const FILE_CONFIG: Record<FileType, FileConfig> = {
  image: {
    bucket: 'files',
    folder: 'images',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'],
    compress: true,
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85
  },
  video: {
    bucket: 'files',
    folder: 'videos',
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'video/mpeg', 'video/3gpp', 'video/x-matroska'],
    compress: false
  },
  audio: {
    bucket: 'files',
    folder: 'audio',
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac'],
    compress: false
  },
  document: {
    bucket: 'files',
    folder: 'documents',
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip'],
    compress: false
  },
  sticker: {
    bucket: 'files',
    folder: 'stickers',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/png', 'image/webp', 'image/gif'],
    compress: true,
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.9
  },
  gif: {
    bucket: 'files',
    folder: 'gifs',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/gif'],
    compress: false
  }
};

// Определение типа файла
export const detectFileType = (file: File): FileType => {
  const type = file.type.toLowerCase();
  
  if (type.startsWith('image/gif')) return 'gif';
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return 'document';
};

// Валидация файла
export const validateFile = (file: File, fileType: FileType): { valid: boolean; error?: string } => {
  const config = FILE_CONFIG[fileType];
  
  // Проверяем, что тип файла соответствует категории
  const fileTypeLower = file.type.toLowerCase();
  let isValidType = false;
  
  // Для видео проверяем, что это видео
  if (fileType === 'video' && fileTypeLower.startsWith('video/')) {
    isValidType = true;
  }
  // Для изображений проверяем, что это изображение
  else if (fileType === 'image' && fileTypeLower.startsWith('image/')) {
    isValidType = true;
  }
  // Для остальных типов проверяем точное совпадение
  else if (config.allowedTypes.includes(file.type)) {
    isValidType = true;
  }
  
  if (!isValidType) {
    return { valid: false, error: `Неподдерживаемый тип файла. Разрешены: ${config.allowedTypes.join(', ')}` };
  }
  
  if (file.size > config.maxSize) {
    const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(0);
    return { valid: false, error: `Файл слишком большой. Максимум: ${maxSizeMB}MB` };
  }
  
  return { valid: true };
};

// Сжатие изображения
const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<Blob> => {
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
        let width = img.width;
        let height = img.height;

        // Вычисляем новые размеры с сохранением пропорций
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // Высококачественное масштабирование
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Пробуем WebP, если не поддерживается - используем JPEG
        canvas.toBlob(
          (blob) => {
            if (blob) {
              URL.revokeObjectURL(img.src);
              resolve(blob);
            } else {
              // Fallback на JPEG
              canvas.toBlob(
                (jpegBlob) => {
                  URL.revokeObjectURL(img.src);
                  if (jpegBlob) {
                    resolve(jpegBlob);
                  } else {
                    reject(new Error('Failed to create blob'));
                  }
                },
                'image/jpeg',
                quality
              );
            }
          },
          'image/webp',
          quality
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
    
    img.crossOrigin = 'anonymous';
    img.src = URL.createObjectURL(file);
  });
};

// Генерация уникального имени файла
const generateFileName = (userId: string, originalName: string, fileType: FileType): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || 'bin';
  const cleanName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 50);
  
  return `${userId}/${timestamp}_${random}_${cleanName}`;
};

// Основная функция загрузки файла
export const uploadFile = async (
  file: File,
  userId: string,
  fileType?: FileType,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  // Определяем тип файла
  const type = fileType || detectFileType(file);
  const config = FILE_CONFIG[type];
  
  // Валидация
  const validation = validateFile(file, type);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Подготовка файла
  let uploadFile: File | Blob = file;
  let contentType = file.type;
  
  // Сжатие изображений
  if (config.compress && (type === 'image' || type === 'sticker')) {
    try {
      const compressed = await compressImage(
        file,
        config.maxWidth || 1920,
        config.maxHeight || 1920,
        config.quality || 0.85
      );
      uploadFile = compressed;
      contentType = compressed.type;
    } catch (error) {
      console.warn('Failed to compress image, uploading original:', error);
    }
  }
  
  // Генерация пути
  const fileName = generateFileName(userId, file.name, type);
  const filePath = `${config.folder}/${fileName}`;
  
  // Загрузка в Supabase Storage
  const { data, error } = await supabase.storage
    .from(config.bucket)
    .upload(filePath, uploadFile, {
      contentType,
      cacheControl: '31536000', // 1 год
      upsert: false
    });
  
  if (error) {
    console.error('Upload error:', error);
    throw new Error(`Ошибка загрузки: ${error.message}`);
  }
  
  // Получение публичного URL
  const { data: urlData } = supabase.storage
    .from(config.bucket)
    .getPublicUrl(filePath);
  
  return {
    url: urlData.publicUrl,
    path: filePath,
    size: uploadFile.size,
    type: contentType
  };
};

// Загрузка нескольких файлов
export const uploadMultipleFiles = async (
  files: File[],
  userId: string,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadFile(
      file,
      userId,
      undefined,
      (progress) => onProgress?.(i, progress)
    );
    results.push(result);
  }
  
  return results;
};

// Удаление файла
export const deleteFile = async (filePath: string, bucket: string = 'files'): Promise<boolean> => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);
  
  if (error) {
    console.error('Delete error:', error);
    return false;
  }
  
  return true;
};

// Получение информации о файле
export const getFileInfo = async (filePath: string, bucket: string = 'files') => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(filePath);
  
  return { data, error };
};

// Генерация превью для видео
export const generateVideoThumbnail = (videoFile: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    video.onloadedmetadata = () => {
      // Берём кадр с 1 секунды
      video.currentTime = Math.min(1, video.duration / 2);
    };
    
    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(video.src);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        },
        'image/jpeg',
        0.8
      );
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };
    
    video.src = URL.createObjectURL(videoFile);
  });
};

// Форматирование размера файла
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
