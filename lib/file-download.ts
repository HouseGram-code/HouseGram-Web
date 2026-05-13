/**
 * Библиотека для скачивания файлов (фото, видео, музыка)
 */

export interface DownloadOptions {
  fileName?: string;
  useProxy?: boolean;
}

export interface FileInfo {
  contentType: string;
  contentLength: number;
  lastModified: string;
}

/**
 * Скачивание файла через API (обход CORS)
 */
export async function downloadFile(
  fileUrl: string,
  options: DownloadOptions = {}
): Promise<void> {
  const { fileName, useProxy = true } = options;

  try {
    console.log('📥 Downloading file:', fileUrl);

    // Используем прокси API для обхода CORS
    const downloadUrl = useProxy 
      ? `/api/download?url=${encodeURIComponent(fileUrl)}`
      : fileUrl;

    // Скачиваем файл
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    // Получаем blob
    const blob = await response.blob();

    // Определяем имя файла
    const finalFileName = fileName || getFileNameFromUrl(fileUrl) || 'download';

    // Создаём ссылку для скачивания
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFileName;
    
    // Триггерим скачивание
    document.body.appendChild(link);
    link.click();
    
    // Очищаем
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('✅ File downloaded successfully:', finalFileName);
  } catch (error: any) {
    console.error('❌ Download error:', error);
    throw new Error(`Не удалось скачать файл: ${error.message}`);
  }
}

/**
 * Получение информации о файле без скачивания
 */
export async function getFileInfo(fileUrl: string): Promise<FileInfo> {
  try {
    const response = await fetch(`/api/download?url=${encodeURIComponent(fileUrl)}`, {
      method: 'HEAD',
    });

    if (!response.ok) {
      throw new Error(`Failed to get file info: ${response.statusText}`);
    }

    return {
      contentType: response.headers.get('content-type') || 'application/octet-stream',
      contentLength: parseInt(response.headers.get('content-length') || '0', 10),
      lastModified: response.headers.get('last-modified') || new Date().toUTCString(),
    };
  } catch (error: any) {
    console.error('❌ Get file info error:', error);
    throw new Error(`Не удалось получить информацию о файле: ${error.message}`);
  }
}

/**
 * Скачивание нескольких файлов
 */
export async function downloadMultipleFiles(
  fileUrls: string[],
  options: DownloadOptions = {}
): Promise<void> {
  for (const fileUrl of fileUrls) {
    await downloadFile(fileUrl, options);
    // Небольшая задержка между скачиваниями
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Извлечение имени файла из URL
 */
function getFileNameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/');
    const fileName = parts[parts.length - 1];
    
    // Декодируем URL-encoded имя файла
    return decodeURIComponent(fileName);
  } catch {
    return null;
  }
}

/**
 * Определение типа файла по URL или MIME типу
 */
export function getFileType(url: string, mimeType?: string): 'image' | 'video' | 'audio' | 'document' {
  const urlLower = url.toLowerCase();
  const mimeLower = mimeType?.toLowerCase() || '';

  // Проверка по MIME типу
  if (mimeLower.startsWith('image/')) return 'image';
  if (mimeLower.startsWith('video/')) return 'video';
  if (mimeLower.startsWith('audio/')) return 'audio';

  // Проверка по расширению
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(urlLower)) return 'image';
  if (/\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(urlLower)) return 'video';
  if (/\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(urlLower)) return 'audio';

  return 'document';
}

/**
 * Форматирование размера файла
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Проверка, является ли URL медиа-файлом
 */
export function isMediaFile(url: string): boolean {
  const type = getFileType(url);
  return type === 'image' || type === 'video' || type === 'audio';
}
