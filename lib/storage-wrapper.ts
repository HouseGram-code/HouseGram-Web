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
  console.log('📤 Storage Wrapper: Starting upload...', {
    fileName: file.name,
    fileSize: formatFileSize(file.size),
    fileType: fileType || detectFileType(file),
    userId
  });

  // Приоритет 1: Apps Father Storage (если настроен)
  if (isAppsFatherAvailable()) {
    try {
      console.log('📤 Storage Wrapper: Trying Apps Father Storage...');
      const result = await AppsFatherStorage.uploadToAppsFather(
        file,
        userId,
        fileType || detectFileType(file)
      );
      
      console.log('✅ Storage Wrapper: Apps Father upload successful!', result.url);
      
      return {
        url: result.url,
        path: result.url,
        size: result.fileSize,
        type: result.mimeType,
      };
    } catch (error) {
      console.error('❌ Storage Wrapper: Apps Father upload failed:', error);
      console.log('📤 Storage Wrapper: Falling back to MEGA...');
      // Fallback на MEGA
    }
  } else {
    console.log('⚠️ Storage Wrapper: Apps Father not configured, skipping...');
  }
  
  // Приоритет 2: MEGA Storage
  const megaStorage = getMegaStorage();
  if (megaStorage) {
    try {
      console.log('📤 Storage Wrapper: Trying MEGA Storage...');
      const result = await MegaStorage.uploadFile(file, userId, fileType, onProgress);
      console.log('✅ Storage Wrapper: MEGA upload successful!', result.url);
      return result;
    } catch (error) {
      console.error('❌ Storage Wrapper: MEGA upload failed:', error);
      console.log('📤 Storage Wrapper: Falling back to API Storage...');
      // Fallback на API Storage
    }
  } else {
    console.log('⚠️ Storage Wrapper: MEGA not available, skipping...');
  }
  
  // Приоритет 3: API Storage как последний fallback (обход CORS)
  console.log('📤 Storage Wrapper: Using API Storage (last resort)...');
  try {
    const result = await ApiStorage.uploadFile(file, userId, fileType, onProgress);
    console.log('✅ Storage Wrapper: API Storage upload successful!', result.url);
    return result;
  } catch (error) {
    console.error('❌ Storage Wrapper: All upload methods failed!', error);
    throw new Error('Не удалось загрузить файл. Попробуйте позже.');
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
