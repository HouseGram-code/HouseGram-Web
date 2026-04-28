/**
 * Бесплатные хранилища файлов без API ключей (2026)
 * 
 * Поддерживаемые сервисы:
 * 1. Catbox.moe - до 200MB, постоянное хранение
 * 2. 0x0.st - до 512MB, временное (30 дней - 1 год)
 * 3. Puter.js - неограниченное, требует подключения скрипта
 */

export interface UploadResult {
  url: string;
  deleteUrl?: string;
  expiresAt?: Date;
  service: 'catbox' | '0x0' | 'puter';
}

/**
 * Загрузка на Catbox.moe (до 200MB, постоянное хранение)
 */
export async function uploadToCatbox(file: File): Promise<UploadResult> {
  console.log('📤 Uploading to Catbox.moe:', file.name, file.size);

  const formData = new FormData();
  formData.append('reqtype', 'fileupload');
  formData.append('fileToUpload', file);

  try {
    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Catbox upload failed: ${response.statusText}`);
    }

    const url = await response.text();
    
    if (!url || url.includes('error')) {
      throw new Error('Catbox upload failed');
    }

    console.log('✅ Catbox upload successful:', url);

    return {
      url: url.trim(),
      service: 'catbox',
    };
  } catch (error) {
    console.error('❌ Catbox upload error:', error);
    throw error;
  }
}

/**
 * Загрузка на 0x0.st (до 512MB, временное хранение)
 */
export async function uploadTo0x0(
  file: File,
  expiresHours: number = 720 // 30 дней по умолчанию
): Promise<UploadResult> {
  console.log('📤 Uploading to 0x0.st:', file.name, file.size);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('expires', expiresHours.toString());

  try {
    const response = await fetch('https://0x0.st', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`0x0.st upload failed: ${response.statusText}`);
    }

    const url = await response.text();
    const token = response.headers.get('X-Token');

    if (!url) {
      throw new Error('0x0.st upload failed');
    }

    console.log('✅ 0x0.st upload successful:', url.trim());

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresHours);

    return {
      url: url.trim(),
      deleteUrl: token ? `${url.trim()}?token=${token}` : undefined,
      expiresAt,
      service: '0x0',
    };
  } catch (error) {
    console.error('❌ 0x0.st upload error:', error);
    throw error;
  }
}

/**
 * Автоматический выбор лучшего сервиса в зависимости от размера файла
 */
export async function uploadToFreeStorage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const fileSizeMB = file.size / (1024 * 1024);

  console.log(`📤 Free Storage: Uploading ${file.name} (${fileSizeMB.toFixed(2)} MB)`);

  // Выбираем сервис в зависимости от размера
  if (fileSizeMB <= 200) {
    // Catbox - лучший выбор для файлов до 200MB (постоянное хранение)
    try {
      console.log('📤 Free Storage: Trying Catbox.moe (up to 200MB)...');
      onProgress?.(10);
      const result = await uploadToCatbox(file);
      onProgress?.(100);
      return result;
    } catch (error) {
      console.warn('⚠️ Catbox failed, trying 0x0.st...', error);
      // Fallback на 0x0.st
    }
  }

  // 0x0.st - для файлов до 512MB (временное хранение)
  if (fileSizeMB <= 512) {
    try {
      console.log('📤 Free Storage: Trying 0x0.st (up to 512MB)...');
      onProgress?.(10);
      const result = await uploadTo0x0(file);
      onProgress?.(100);
      return result;
    } catch (error) {
      console.error('❌ All free storage services failed', error);
      throw new Error('Не удалось загрузить файл ни на один бесплатный сервис');
    }
  }

  throw new Error(`Файл слишком большой (${fileSizeMB.toFixed(2)} MB). Максимум: 512 MB`);
}

/**
 * Удаление файла с 0x0.st (если есть токен)
 */
export async function deleteFrom0x0(url: string, token: string): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('delete', '');

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    return response.ok;
  } catch (error) {
    console.error('❌ 0x0.st delete error:', error);
    return false;
  }
}

/**
 * Форматирование размера файла
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Проверка, поддерживается ли файл бесплатными сервисами
 */
export function isSupportedByFreeStorage(file: File): {
  supported: boolean;
  reason?: string;
  maxSize: number;
} {
  const maxSize = 512 * 1024 * 1024; // 512 MB
  
  if (file.size > maxSize) {
    return {
      supported: false,
      reason: `Файл слишком большой (${formatFileSize(file.size)}). Максимум: 512 MB`,
      maxSize,
    };
  }

  // Catbox не поддерживает некоторые типы файлов
  const blockedExtensions = ['.exe', '.scr', '.cpl', '.jar'];
  const fileExt = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  
  if (fileExt && blockedExtensions.includes(fileExt)) {
    return {
      supported: false,
      reason: `Тип файла ${fileExt} не поддерживается`,
      maxSize,
    };
  }

  return {
    supported: true,
    maxSize,
  };
}
