/**
 * Storage Wrapper - автоматически выбирает между Apps Father, MEGA и API Storage
 */

import { getMegaStorage } from './mega-storage';
import * as MegaStorage from './mega-storage';
import * as ApiStorage from './api-storage';
import * as AppsFatherStorage from './apps-father-storage';

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

// Определение типа файла
export const detectFileType = (file: File): FileType => {
  return MegaStorage.detectFileType(file);
};

// Форматирование размера файла
export const formatFileSize = (bytes: number): string => {
  return MegaStorage.formatFileSize(bytes);
};

// Проверка доступности Apps Father
const isAppsFatherAvailable = (): boolean => {
  return !!(
    process.env.NEXT_PUBLIC_APPS_FATHER_API_URL && 
    process.env.NEXT_PUBLIC_APPS_FATHER_API_KEY
  );
};

// Основная функция загрузки с автоматическим fallback
export const uploadFile = async (
  file: File,
  userId: string,
  fileType?: FileType,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  // Приоритет 1: Apps Father Storage (если настроен)
  if (isAppsFatherAvailable()) {
    try {
      console.log('📤 Uploading via Apps Father Storage...');
      const result = await AppsFatherStorage.uploadToAppsFather(
        file,
        userId,
        fileType || detectFileType(file)
      );
      
      return {
        url: result.url,
        path: result.url,
        size: result.fileSize,
        type: result.mimeType,
      };
    } catch (error) {
      console.error('Apps Father upload failed, trying MEGA:', error);
      // Fallback на MEGA
    }
  }
  
  // Приоритет 2: MEGA Storage
  const megaStorage = getMegaStorage();
  if (megaStorage) {
    try {
      console.log('📤 Uploading via MEGA Storage...');
      return await MegaStorage.uploadFile(file, userId, fileType, onProgress);
    } catch (error) {
      console.error('MEGA upload failed, falling back to API Storage:', error);
      // Fallback на API Storage
    }
  }
  
  // Приоритет 3: API Storage как последний fallback (обход CORS)
  console.log('📤 Uploading via API Storage (CORS bypass)...');
  return await ApiStorage.uploadFile(file, userId, fileType, onProgress);
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
  // Пробуем удалить из Apps Father
  if (isAppsFatherAvailable() && filePath.includes('apps-father.com')) {
    try {
      await AppsFatherStorage.deleteFromAppsFather(filePath);
      return true;
    } catch (error) {
      console.error('Apps Father delete failed:', error);
    }
  }
  
  // Пробуем удалить из MEGA
  const megaStorage = getMegaStorage();
  if (megaStorage) {
    try {
      return await MegaStorage.deleteFile(filePath);
    } catch (error) {
      console.error('MEGA delete failed:', error);
    }
  }
  
  // API Storage не поддерживает удаление
  return false;
};
