/**
 * Puter.js Storage Integration
 * Бесплатное неограниченное облачное хранилище БЕЗ API ключей
 * https://puter.com
 */

// Типы для Puter.js API
declare global {
  interface Window {
    puter?: {
      fs: {
        write: (path: string, content: File | Blob | string, options?: any) => Promise<any>;
        read: (path: string) => Promise<Blob>;
        upload: (files: FileList | File[]) => Promise<any[]>;
        delete: (path: string) => Promise<void>;
        mkdir: (path: string) => Promise<void>;
        readdir: (path: string) => Promise<any[]>;
        stat: (path: string) => Promise<any>;
        getReadURL: (path: string) => Promise<string>;
      };
    };
  }
}

export interface PuterUploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
}

/**
 * Проверка доступности Puter.js
 */
export function isPuterAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.puter;
}

/**
 * Ожидание загрузки Puter.js
 */
export function waitForPuter(timeout = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isPuterAvailable()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isPuterAvailable()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
}

/**
 * Загрузка файла на Puter.js
 */
export async function uploadToPuter(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<PuterUploadResult> {
  console.log('📤 Puter: Starting upload...', {
    fileName: file.name,
    fileSize: file.size,
    userId
  });

  // Ждем загрузки Puter.js
  const available = await waitForPuter();
  if (!available || !window.puter) {
    throw new Error('Puter.js не загружен');
  }

  try {
    onProgress?.(10);

    // Создаем уникальное имя файла с userId
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}_${file.name}`;

    console.log('📤 Puter: Uploading to path:', fileName);

    // Загружаем файл
    const uploadedFile = await window.puter.fs.write(fileName, file, {
      createMissingParents: true,
      dedupeName: false,
    });

    onProgress?.(80);

    console.log('📤 Puter: Getting public URL...');

    // Получаем публичный URL
    const publicUrl = await window.puter.fs.getReadURL(fileName);

    onProgress?.(100);

    console.log('✅ Puter: Upload successful!', publicUrl);

    return {
      url: publicUrl,
      path: uploadedFile.path || fileName,
      name: file.name,
      size: file.size,
      type: file.type,
    };
  } catch (error: any) {
    console.error('❌ Puter: Upload error:', error);
    throw new Error(`Ошибка загрузки на Puter: ${error.message || 'Неизвестная ошибка'}`);
  }
}

/**
 * Загрузка нескольких файлов
 */
export async function uploadMultipleToPuter(
  files: File[],
  userId: string,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<PuterUploadResult[]> {
  const results: PuterUploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadToPuter(
      files[i],
      userId,
      (progress) => onProgress?.(i, progress)
    );
    results.push(result);
  }

  return results;
}

/**
 * Удаление файла с Puter
 */
export async function deleteFromPuter(path: string): Promise<boolean> {
  if (!isPuterAvailable() || !window.puter) {
    return false;
  }

  try {
    await window.puter.fs.delete(path);
    console.log('✅ Puter: File deleted:', path);
    return true;
  } catch (error) {
    console.error('❌ Puter: Delete error:', error);
    return false;
  }
}

/**
 * Получение информации о файле
 */
export async function getPuterFileInfo(path: string): Promise<any> {
  if (!isPuterAvailable() || !window.puter) {
    throw new Error('Puter.js не доступен');
  }

  try {
    const info = await window.puter.fs.stat(path);
    return info;
  } catch (error) {
    console.error('❌ Puter: Get file info error:', error);
    throw error;
  }
}

/**
 * Чтение файла с Puter
 */
export async function readFromPuter(path: string): Promise<Blob> {
  if (!isPuterAvailable() || !window.puter) {
    throw new Error('Puter.js не доступен');
  }

  try {
    const blob = await window.puter.fs.read(path);
    return blob;
  } catch (error) {
    console.error('❌ Puter: Read file error:', error);
    throw error;
  }
}

/**
 * Создание директории
 */
export async function createPuterDirectory(path: string): Promise<void> {
  if (!isPuterAvailable() || !window.puter) {
    throw new Error('Puter.js не доступен');
  }

  try {
    await window.puter.fs.mkdir(path);
    console.log('✅ Puter: Directory created:', path);
  } catch (error) {
    console.error('❌ Puter: Create directory error:', error);
    throw error;
  }
}

/**
 * Список файлов в директории
 */
export async function listPuterDirectory(path: string): Promise<any[]> {
  if (!isPuterAvailable() || !window.puter) {
    throw new Error('Puter.js не доступен');
  }

  try {
    const items = await window.puter.fs.readdir(path);
    return items;
  } catch (error) {
    console.error('❌ Puter: List directory error:', error);
    throw error;
  }
}
