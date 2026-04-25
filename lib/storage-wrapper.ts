/**
 * Storage Wrapper - автоматически выбирает между MEGA и Firebase Storage
 */

import { getMegaStorage } from './mega-storage';
import * as MegaStorage from './mega-storage';
import * as FirebaseStorage from './firebase-storage';

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

// Основная функция загрузки с автоматическим fallback
export const uploadFile = async (
  file: File,
  userId: string,
  fileType?: FileType,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  const megaStorage = getMegaStorage();
  
  // Если MEGA доступен, используем его
  if (megaStorage) {
    try {
      console.log('📤 Uploading via MEGA Storage...');
      return await MegaStorage.uploadFile(file, userId, fileType, onProgress);
    } catch (error) {
      console.error('MEGA upload failed, falling back to Firebase:', error);
      // Fallback на Firebase
    }
  }
  
  // Используем Firebase Storage как fallback
  console.log('📤 Uploading via Firebase Storage (fallback)...');
  return await FirebaseStorage.uploadFile(file, userId, fileType, onProgress);
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
  const megaStorage = getMegaStorage();
  
  // Пробуем удалить из MEGA
  if (megaStorage) {
    try {
      return await MegaStorage.deleteFile(filePath);
    } catch (error) {
      console.error('MEGA delete failed, trying Firebase:', error);
    }
  }
  
  // Fallback на Firebase
  return await FirebaseStorage.deleteFile(filePath);
};
