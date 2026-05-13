/**
 * API Storage - загрузка файлов через серверный API (обход CORS)
 */

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

// Определение типа файла
export const detectFileType = (file: File): FileType => {
  const type = file.type.toLowerCase();
  
  if (type.startsWith('image/gif')) return 'gif';
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return 'document';
};

// Форматирование размера файла
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Загрузка файла через API (обход CORS)
export const uploadFile = async (
  file: File,
  userId: string,
  fileType?: FileType,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  const type = fileType || detectFileType(file);
  
  console.log(`📤 API Storage: Uploading ${file.name} (${formatFileSize(file.size)}) as ${type}`);
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('fileType', type);

    // Используем XMLHttpRequest для отслеживания прогресса
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Отслеживание прогресса
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentage = Math.round((e.loaded / e.total) * 100);
          console.log(`📤 Upload progress: ${percentage}%`);
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: percentage,
          });
        }
      });

      // Обработка завершения
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText);
            console.log(`✅ API Storage: Upload successful:`, result.url);
            resolve(result);
          } catch (error) {
            console.error('❌ API Storage: Failed to parse response:', xhr.responseText);
            reject(new Error('Invalid response from server'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            console.error('❌ API Storage: Upload failed:', error);
            reject(new Error(error.error || 'Upload failed'));
          } catch {
            console.error('❌ API Storage: Upload failed with status:', xhr.status);
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      // Обработка ошибок
      xhr.addEventListener('error', () => {
        console.error('❌ API Storage: Network error during upload');
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        console.error('❌ API Storage: Upload aborted');
        reject(new Error('Upload aborted'));
      });

      // Отправка запроса
      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  } catch (error: any) {
    console.error('❌ API Storage: Upload failed:', error);
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

// Удаление файла (заглушка - требует серверного API)
export const deleteFile = async (filePath: string): Promise<boolean> => {
  console.warn('Delete not implemented for API storage');
  return false;
};
