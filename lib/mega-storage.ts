'use client';

import { Storage, File as MEGAFile } from 'megajs';

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
  megaUrl?: string;
}

// Конфигурация для разных типов файлов
interface FileConfig {
  folder: string;
  maxSize: number;
  allowedTypes: string[];
}

const FILE_CONFIG: Record<FileType, FileConfig> = {
  image: {
    folder: 'images',
    maxSize: 4 * 1024 * 1024 * 1024, // 4GB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'],
  },
  video: {
    folder: 'videos',
    maxSize: 4 * 1024 * 1024 * 1024, // 4GB
    allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'video/mpeg', 'video/3gpp', 'video/x-matroska'],
  },
  audio: {
    folder: 'audio',
    maxSize: 4 * 1024 * 1024 * 1024, // 4GB
    allowedTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac'],
  },
  document: {
    folder: 'documents',
    maxSize: 4 * 1024 * 1024 * 1024, // 4GB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip'],
  },
  sticker: {
    folder: 'stickers',
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['image/png', 'image/webp', 'image/gif'],
  },
  gif: {
    folder: 'gifs',
    maxSize: 500 * 1024 * 1024, // 500MB
    allowedTypes: ['image/gif'],
  }
};

// Глобальный MEGA Storage клиент
let megaStorage: Storage | null = null;
let isInitializing = false;
let initPromise: Promise<Storage> | null = null;

// Инициализация MEGA Storage
export const initMegaStorage = async (email: string, password: string): Promise<Storage> => {
  if (megaStorage) {
    return megaStorage;
  }

  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  
  initPromise = new Promise(async (resolve, reject) => {
    try {
      const storage = new Storage({
        email,
        password,
        keepalive: true,
        autologin: true,
        autoload: true,
      });

      await storage.ready;
      
      megaStorage = storage;
      isInitializing = false;
      
      console.log('✅ MEGA Storage initialized successfully');
      console.log(`📦 Account: ${storage.name}`);
      
      // Получаем информацию об аккаунте
      try {
        const accountInfo = await storage.getAccountInfo();
        console.log(`💾 Storage used: ${formatFileSize(accountInfo.spaceUsed || 0)} / ${formatFileSize(accountInfo.spaceTotal || 0)}`);
      } catch (err) {
        console.warn('Could not fetch account info:', err);
      }
      
      resolve(storage);
    } catch (error: any) {
      isInitializing = false;
      initPromise = null;
      console.error('❌ Failed to initialize MEGA Storage:', error);
      reject(error);
    }
  });

  return initPromise;
};

// Получить текущий MEGA Storage
export const getMegaStorage = (): Storage | null => {
  return megaStorage;
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
  
  const fileTypeLower = file.type.toLowerCase();
  let isValidType = false;
  
  if (fileType === 'video' && fileTypeLower.startsWith('video/')) {
    isValidType = true;
  } else if (fileType === 'image' && fileTypeLower.startsWith('image/')) {
    isValidType = true;
  } else if (fileType === 'audio' && fileTypeLower.startsWith('audio/')) {
    isValidType = true;
  } else if (config.allowedTypes.includes(file.type)) {
    isValidType = true;
  }
  
  if (!isValidType) {
    return { valid: false, error: `Неподдерживаемый тип файла. Разрешены: ${config.allowedTypes.join(', ')}` };
  }
  
  if (file.size > config.maxSize) {
    const maxSizeGB = (config.maxSize / (1024 * 1024 * 1024)).toFixed(1);
    return { valid: false, error: `Файл слишком большой. Максимум: ${maxSizeGB}GB` };
  }
  
  return { valid: true };
};

// Генерация уникального имени файла
const generateFileName = (userId: string, originalName: string, fileType: FileType): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || 'bin';
  const cleanName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 50);
  
  return `${userId}_${timestamp}_${random}_${cleanName}`;
};

// Создать или получить папку
const getOrCreateFolder = async (storage: Storage, folderName: string): Promise<any> => {
  try {
    // Ищем папку в корне
    let folder = storage.root.children?.find((child: any) => 
      child.name === folderName && child.directory
    );
    
    // Если папки нет, создаем
    if (!folder) {
      console.log(`📁 Creating folder: ${folderName}`);
      folder = await storage.mkdir(folderName);
    }
    
    return folder;
  } catch (error) {
    console.error(`Failed to get/create folder ${folderName}:`, error);
    throw error;
  }
};

// Основная функция загрузки файла через MEGA
export const uploadFile = async (
  file: File,
  userId: string,
  fileType?: FileType,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  if (!megaStorage) {
    throw new Error('MEGA Storage не инициализирован. Вызовите initMegaStorage() сначала.');
  }

  // Определяем тип файла
  const type = fileType || detectFileType(file);
  const config = FILE_CONFIG[type];
  
  // Валидация
  const validation = validateFile(file, type);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  try {
    // Получаем или создаем папку для типа файла
    const folder = await getOrCreateFolder(megaStorage, config.folder);
    
    // Генерируем имя файла
    const fileName = generateFileName(userId, file.name, type);
    
    console.log(`⬆️ Uploading to MEGA: ${fileName} (${formatFileSize(file.size)})`);
    
    // Читаем файл как ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Загружаем файл в MEGA
    const uploadStream = folder.upload({
      name: fileName,
      size: file.size,
      allowUploadBuffering: true,
    });
    
    // Отслеживаем прогресс
    let uploadedBytes = 0;
    uploadStream.on('progress', (info: any) => {
      uploadedBytes = info.bytesLoaded || 0;
      if (onProgress) {
        onProgress({
          loaded: uploadedBytes,
          total: file.size,
          percentage: Math.round((uploadedBytes / file.size) * 100),
        });
      }
    });
    
    // Записываем данные
    uploadStream.write(buffer);
    uploadStream.end();
    
    // Ждем завершения загрузки
    const uploadedFile = await uploadStream.complete;
    
    console.log(`✅ File uploaded successfully: ${fileName}`);
    
    // Создаем публичную ссылку
    const shareUrl = await uploadedFile.link();
    
    return {
      url: shareUrl,
      path: `${config.folder}/${fileName}`,
      size: file.size,
      type: file.type,
      megaUrl: shareUrl,
    };
  } catch (error: any) {
    console.error('❌ MEGA upload failed:', error);
    throw new Error(`Ошибка загрузки файла в MEGA: ${error.message}`);
  }
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

// Удаление файла (опционально)
export const deleteFile = async (filePath: string): Promise<boolean> => {
  if (!megaStorage) {
    console.error('MEGA Storage not initialized');
    return false;
  }

  try {
    // Парсим путь (folder/filename)
    const [folderName, fileName] = filePath.split('/');
    
    // Находим папку
    const folder = megaStorage.root.children?.find((child: any) => 
      child.name === folderName && child.directory
    );
    
    if (!folder) {
      console.error(`Folder not found: ${folderName}`);
      return false;
    }
    
    // Находим файл
    const file = folder.children?.find((child: any) => child.name === fileName);
    
    if (!file) {
      console.error(`File not found: ${fileName}`);
      return false;
    }
    
    // Удаляем файл
    await file.delete(true); // true = permanent delete
    console.log(`🗑️ File deleted: ${filePath}`);
    
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

// Получить информацию об аккаунте
export const getAccountInfo = async (): Promise<{
  spaceUsed: number;
  spaceTotal: number;
  spaceAvailable: number;
  percentUsed: number;
} | null> => {
  if (!megaStorage) {
    return null;
  }

  try {
    const info = await megaStorage.getAccountInfo();
    const spaceUsed = info.spaceUsed || 0;
    const spaceTotal = info.spaceTotal || 0;
    const spaceAvailable = spaceTotal - spaceUsed;
    const percentUsed = spaceTotal > 0 ? (spaceUsed / spaceTotal) * 100 : 0;

    return {
      spaceUsed,
      spaceTotal,
      spaceAvailable,
      percentUsed,
    };
  } catch (error) {
    console.error('Failed to get account info:', error);
    return null;
  }
};

// Форматирование размера файла
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Закрыть соединение с MEGA
export const closeMegaStorage = async (): Promise<void> => {
  if (megaStorage) {
    try {
      await megaStorage.close();
      megaStorage = null;
      console.log('MEGA Storage connection closed');
    } catch (error) {
      console.error('Failed to close MEGA Storage:', error);
    }
  }
};
