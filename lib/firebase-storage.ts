import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

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
    folder: 'images',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'],
    compress: true,
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85
  },
  video: {
    folder: 'videos',
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'video/mpeg', 'video/3gpp', 'video/x-matroska'],
    compress: false
  },
  audio: {
    folder: 'audio',
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac'],
    compress: false
  },
  document: {
    folder: 'documents',
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip'],
    compress: false
  },
  sticker: {
    folder: 'stickers',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/png', 'image/webp', 'image/gif'],
    compress: true,
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.9
  },
  gif: {
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

// Основная функция загрузки файла через Firebase Storage
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
  
  try {
    // Создаем ссылку на файл в Firebase Storage
    const fileRef = ref(storage, filePath);
    
    // Загружаем файл
    const snapshot = await uploadBytes(fileRef, uploadFile, {
      contentType,
      cacheControl: 'public, max-age=31536000', // 1 год
    });
    
    // Получаем URL для скачивания
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: filePath,
      size: uploadFile.size,
      type: contentType
    };
  } catch (error: any) {
    console.error('Firebase Storage upload failed:', error);
    throw new Error(`Ошибка загрузки файла: ${error.message}`);
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

// Удаление файла
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

// Форматирование размера файла
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};