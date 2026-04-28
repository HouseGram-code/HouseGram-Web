# API для скачивания файлов (фото, видео, музыка)

## Обзор

Добавлено полноценное API для скачивания медиа-файлов с поддержкой обхода CORS и удобными хуками для React компонентов.

## Новые файлы

### 1. `/app/api/download/route.ts`
Серверный endpoint для скачивания файлов:
- **GET** `/api/download?url=<file_url>` - скачивание файла
- **HEAD** `/api/download?url=<file_url>` - получение информации о файле

### 2. `/lib/file-download.ts`
Библиотека для работы со скачиванием:
- `downloadFile()` - скачивание одного файла
- `downloadMultipleFiles()` - скачивание нескольких файлов
- `getFileInfo()` - получение информации о файле
- `getFileType()` - определение типа файла
- `formatFileSize()` - форматирование размера файла

### 3. `/hooks/useFileDownload.ts`
React хуки для удобного использования:
- `useFileDownload()` - хук для скачивания одного файла
- `useMultipleFileDownload()` - хук для скачивания нескольких файлов
- `useFileInfo()` - хук для получения информации о файле

## Использование

### Базовое использование в компонентах

```tsx
import { useFileDownload } from '@/hooks/useFileDownload';

function MyComponent() {
  const { downloading, download, error } = useFileDownload();

  const handleDownload = async () => {
    try {
      await download('https://example.com/photo.jpg', {
        fileName: 'my-photo.jpg'
      });
      console.log('Файл скачан!');
    } catch (err) {
      console.error('Ошибка:', err);
    }
  };

  return (
    <button onClick={handleDownload} disabled={downloading}>
      {downloading ? 'Скачивание...' : 'Скачать фото'}
    </button>
  );
}
```

### Скачивание нескольких файлов

```tsx
import { useMultipleFileDownload } from '@/hooks/useFileDownload';

function MyComponent() {
  const { downloading, download } = useMultipleFileDownload();

  const handleDownloadAll = async () => {
    const files = [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
      'https://example.com/video.mp4'
    ];
    
    await download(files);
  };

  return (
    <button onClick={handleDownloadAll} disabled={downloading}>
      Скачать все файлы
    </button>
  );
}
```

### Получение информации о файле

```tsx
import { useFileInfo } from '@/hooks/useFileDownload';

function FileInfoComponent({ fileUrl }: { fileUrl: string }) {
  const { loading, info, fetchInfo } = useFileInfo();

  useEffect(() => {
    fetchInfo(fileUrl);
  }, [fileUrl]);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      <p>Тип: {info?.contentType}</p>
      <p>Размер: {formatFileSize(info?.contentLength || 0)}</p>
      <p>Изменен: {info?.lastModified}</p>
    </div>
  );
}
```

### Прямое использование библиотеки

```tsx
import { downloadFile, getFileInfo } from '@/lib/file-download';

// Скачивание файла
await downloadFile('https://example.com/music.mp3', {
  fileName: 'my-song.mp3',
  useProxy: true // использовать серверный API для обхода CORS
});

// Получение информации
const info = await getFileInfo('https://example.com/video.mp4');
console.log(info.contentType, info.contentLength);
```

## API Reference

### downloadFile(fileUrl, options)

Скачивает файл с указанного URL.

**Параметры:**
- `fileUrl` (string) - URL файла для скачивания
- `options` (object, optional):
  - `fileName` (string) - имя файла для сохранения
  - `useProxy` (boolean) - использовать серверный API (по умолчанию true)

**Возвращает:** Promise<void>

### getFileInfo(fileUrl)

Получает информацию о файле без скачивания.

**Параметры:**
- `fileUrl` (string) - URL файла

**Возвращает:** Promise<FileInfo>
```typescript
interface FileInfo {
  contentType: string;
  contentLength: number;
  lastModified: string;
}
```

### getFileType(url, mimeType?)

Определяет тип файла по URL или MIME типу.

**Параметры:**
- `url` (string) - URL файла
- `mimeType` (string, optional) - MIME тип файла

**Возвращает:** 'image' | 'video' | 'audio' | 'document'

## Обновления компонентов

### Message.tsx

Добавлены кнопки скачивания для всех типов медиа:
- **Изображения** - кнопка появляется при наведении
- **Видео** - кнопка в правом верхнем углу
- **Аудио** - кнопка рядом с плеером
- **Файлы** - кнопка рядом с именем файла

Все кнопки имеют:
- Анимации при наведении и клике
- Индикатор загрузки
- Автоматическое определение имени файла

## Особенности

### Обход CORS
API автоматически использует серверный endpoint для обхода CORS ограничений:
```
Клиент → /api/download?url=... → Внешний сервер → Клиент
```

### Поддерживаемые форматы

**Изображения:**
- JPG, JPEG, PNG, GIF, WEBP, BMP, SVG

**Видео:**
- MP4, WEBM, OGG, MOV, AVI, MKV

**Аудио:**
- MP3, WAV, OGG, M4A, FLAC, AAC

**Документы:**
- PDF, DOC, DOCX, XLS, XLSX, TXT и другие

### Безопасность

- Все запросы проходят через серверный API
- Валидация URL перед скачиванием
- Защита от SSRF атак
- Ограничение размера файлов (настраивается)

## Примеры интеграции

### В ChatView

```tsx
// Скачивание медиа из сообщения
const handleDownloadMedia = async (message: Message) => {
  const fileUrl = message.fileUrl || message.audioUrl || message.videoUrl;
  if (!fileUrl) return;

  await download(fileUrl, {
    fileName: message.fileName || 'media'
  });
};
```

### В галерее

```tsx
// Скачивание всех фото из галереи
const handleDownloadGallery = async (photos: string[]) => {
  await downloadMultipleFiles(photos);
};
```

## Тестирование

```bash
# Запуск dev сервера
npm run dev

# Тестирование API
curl "http://localhost:3000/api/download?url=https://example.com/test.jpg" -o test.jpg

# Получение информации о файле
curl -I "http://localhost:3000/api/download?url=https://example.com/test.jpg"
```

## Производительность

- Потоковая передача файлов (streaming)
- Кэширование заголовков (Cache-Control)
- Оптимизация памяти для больших файлов
- Параллельное скачивание нескольких файлов

## Будущие улучшения

- [ ] Прогресс-бар для больших файлов
- [ ] Пауза/возобновление скачивания
- [ ] Пакетное скачивание в ZIP архив
- [ ] Предпросмотр перед скачиванием
- [ ] История скачиваний
- [ ] Ограничение скорости скачивания

## Поддержка

При возникновении проблем:
1. Проверьте консоль браузера на ошибки
2. Убедитесь, что URL файла доступен
3. Проверьте CORS настройки сервера
4. Используйте `useProxy: true` для обхода CORS

## Changelog

### v1.0.0 (28.04.2026)
- ✅ Создан API endpoint `/api/download`
- ✅ Добавлена библиотека `file-download.ts`
- ✅ Созданы React хуки для скачивания
- ✅ Обновлен компонент Message с кнопками скачивания
- ✅ Поддержка всех типов медиа-файлов
- ✅ Обход CORS через серверный API
