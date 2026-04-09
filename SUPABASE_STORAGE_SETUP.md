# Настройка Supabase Storage для загрузки файлов

## Обзор

Полноценная система загрузки файлов через Supabase Storage с поддержкой:
- 📸 Изображений (JPEG, PNG, WebP, HEIC)
- 🎥 Видео (MP4, WebM, QuickTime)
- 🎵 Аудио (MP3, WAV, OGG, WebM, AAC)
- 📄 Документов (PDF, DOC, DOCX, TXT, ZIP)
- 🎨 Стикеров (PNG, WebP, GIF)
- 🎬 GIF анимаций

## Возможности

✅ Автоматическое сжатие изображений
✅ Валидация типов и размеров файлов
✅ Прогресс-бар загрузки
✅ Генерация превью для видео
✅ Оптимизация WebP
✅ Уникальные имена файлов
✅ Кэширование на 1 год
✅ Поддержка множественной загрузки
✅ Удаление файлов

## Настройка Supabase Storage

### 1. Создание Storage Bucket

В Supabase Dashboard:

1. Перейдите в **Storage** → **Create a new bucket**
2. Имя bucket: `files`
3. Включите **Public bucket** (для публичного доступа)
4. Нажмите **Create bucket**

Или через SQL:

```sql
-- Создание bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('files', 'files', true);
```

### 2. Настройка политик безопасности

```sql
-- Политика для загрузки файлов (только авторизованные пользователи)
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'files');

-- Политика для просмотра файлов (все пользователи)
CREATE POLICY "Anyone can view files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'files');

-- Политика для удаления файлов (только владелец)
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Политика для обновления файлов (только владелец)
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Настройка лимитов

В Supabase Dashboard → **Storage** → **Settings**:

- **Maximum file size**: 100MB (или больше по необходимости)
- **Allowed MIME types**: Оставьте пустым для всех типов или укажите конкретные

## Структура файлов

```
files/
├── images/
│   └── {userId}/
│       └── {timestamp}_{random}_{filename}.webp
├── videos/
│   └── {userId}/
│       └── {timestamp}_{random}_{filename}.mp4
├── audio/
│   └── {userId}/
│       └── {timestamp}_{random}_{filename}.mp3
├── documents/
│   └── {userId}/
│       └── {timestamp}_{random}_{filename}.pdf
├── stickers/
│   └── {userId}/
│       └── {timestamp}_{random}_{filename}.webp
└── gifs/
    └── {userId}/
        └── {timestamp}_{random}_{filename}.gif
```

## Использование в коде

### 1. Загрузка одного файла

```typescript
import { uploadFile } from '@/lib/supabase';

const handleUpload = async (file: File, userId: string) => {
  try {
    const result = await uploadFile(
      file,
      userId,
      undefined, // автоопределение типа
      (progress) => {
        console.log(`Загружено: ${progress.percentage}%`);
      }
    );
    
    console.log('URL файла:', result.url);
    console.log('Путь:', result.path);
    console.log('Размер:', result.size);
  } catch (error) {
    console.error('Ошибка загрузки:', error);
  }
};
```

### 2. Использование хука useFileUpload

```typescript
import { useFileUpload } from '@/hooks/useFileUpload';

function MyComponent() {
  const { uploading, progress, error, result, upload } = useFileUpload(userId);
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const result = await upload(file);
      console.log('Файл загружен:', result.url);
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };
  
  return (
    <div>
      <input type="file" onChange={handleFileSelect} />
      {uploading && <div>Загрузка: {progress}%</div>}
      {error && <div>Ошибка: {error}</div>}
      {result && <div>Успех! URL: {result.url}</div>}
    </div>
  );
}
```

### 3. Компонент FileUploader

```typescript
import FileUploader from '@/components/FileUploader';

function ChatView() {
  const handleUploadComplete = (url: string, fileName: string, fileType: string) => {
    console.log('Файл загружен:', { url, fileName, fileType });
    // Отправить сообщение с файлом
    sendMessage('', { fileUrl: url, fileName });
  };
  
  return (
    <FileUploader
      userId={user.id}
      onUploadComplete={handleUploadComplete}
      accept="image/*,video/*,audio/*"
      maxSize={50 * 1024 * 1024} // 50MB
    />
  );
}
```

### 4. Загрузка нескольких файлов

```typescript
import { useMultipleFileUpload } from '@/hooks/useFileUpload';

function MultiUpload() {
  const { uploading, progress, results, upload } = useMultipleFileUpload(userId);
  
  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    try {
      const results = await upload(files);
      console.log('Все файлы загружены:', results);
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };
  
  return (
    <div>
      <input type="file" multiple onChange={handleFilesSelect} />
      {uploading && (
        <div>
          {Object.entries(progress).map(([index, percent]) => (
            <div key={index}>Файл {index}: {percent}%</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5. Удаление файла

```typescript
import { useFileDelete } from '@/hooks/useFileUpload';

function FileManager() {
  const { deleting, deleteFile } = useFileDelete();
  
  const handleDelete = async (filePath: string) => {
    try {
      const success = await deleteFile(filePath);
      if (success) {
        console.log('Файл удалён');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };
  
  return (
    <button onClick={() => handleDelete('images/user123/file.jpg')} disabled={deleting}>
      {deleting ? 'Удаление...' : 'Удалить'}
    </button>
  );
}
```

## Конфигурация типов файлов

В `lib/supabase.ts` настроены следующие лимиты:

| Тип | Макс. размер | Форматы | Сжатие |
|-----|-------------|---------|--------|
| Изображения | 10MB | JPEG, PNG, GIF, WebP, HEIC | ✅ WebP, 1920x1920 |
| Видео | 100MB | MP4, WebM, QuickTime, AVI | ❌ |
| Аудио | 20MB | MP3, WAV, OGG, WebM, AAC | ❌ |
| Документы | 50MB | PDF, DOC, DOCX, TXT, ZIP | ❌ |
| Стикеры | 5MB | PNG, WebP, GIF | ✅ WebP, 512x512 |
| GIF | 10MB | GIF | ❌ |

Изменить лимиты можно в константе `FILE_CONFIG`:

```typescript
const FILE_CONFIG = {
  image: {
    maxSize: 20 * 1024 * 1024, // Увеличить до 20MB
    maxWidth: 2560, // Увеличить разрешение
    quality: 0.9 // Улучшить качество
  }
  // ...
};
```

## Оптимизация изображений

### Автоматическое сжатие

Изображения автоматически сжимаются до WebP формата с сохранением качества:

```typescript
// Настройки сжатия
const compressed = await compressImage(
  file,
  1920, // maxWidth
  1920, // maxHeight
  0.85  // quality (0-1)
);
```

### Генерация превью для видео

```typescript
import { generateVideoThumbnail } from '@/lib/supabase';

const thumbnail = await generateVideoThumbnail(videoFile);
const thumbnailResult = await uploadFile(thumbnail, userId, 'image');
```

## Интеграция с сообщениями

### Отправка изображения

```typescript
const handleImageUpload = async (file: File) => {
  const result = await uploadFile(file, userId, 'image');
  sendMessage('', { 
    fileUrl: result.url, 
    fileName: file.name 
  });
};
```

### Отправка видео

```typescript
const handleVideoUpload = async (file: File) => {
  const result = await uploadFile(file, userId, 'video');
  
  // Опционально: генерация превью
  const thumbnail = await generateVideoThumbnail(file);
  const thumbnailResult = await uploadFile(thumbnail, userId, 'image');
  
  sendMessage('', { 
    fileUrl: result.url, 
    fileName: file.name,
    thumbnailUrl: thumbnailResult.url
  });
};
```

### Отправка аудио

```typescript
const handleAudioUpload = async (file: File) => {
  const result = await uploadFile(file, userId, 'audio');
  sendMessage('Голосовое сообщение', { 
    audioUrl: result.url 
  });
};
```

### Отправка стикера

```typescript
const handleStickerUpload = async (file: File) => {
  const result = await uploadFile(file, userId, 'sticker');
  sendMessage('', { 
    stickerUrl: result.url,
    stickerWidth: 256,
    stickerHeight: 256
  });
};
```

## Обработка ошибок

```typescript
try {
  const result = await uploadFile(file, userId);
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('Неподдерживаемый тип')) {
      alert('Этот тип файла не поддерживается');
    } else if (error.message.includes('слишком большой')) {
      alert('Файл слишком большой');
    } else if (error.message.includes('storage')) {
      alert('Ошибка хранилища. Проверьте настройки Supabase');
    } else {
      alert('Ошибка загрузки файла');
    }
  }
}
```

## Мониторинг использования

### Проверка размера bucket

```sql
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_size_bytes,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
FROM storage.objects
WHERE bucket_id = 'files'
GROUP BY bucket_id;
```

### Топ пользователей по использованию

```sql
SELECT 
  (storage.foldername(name))[2] as user_folder,
  COUNT(*) as file_count,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
WHERE bucket_id = 'files'
GROUP BY user_folder
ORDER BY SUM((metadata->>'size')::bigint) DESC
LIMIT 10;
```

### Очистка старых файлов

```sql
-- Удалить файлы старше 90 дней
DELETE FROM storage.objects
WHERE bucket_id = 'files'
AND created_at < NOW() - INTERVAL '90 days';
```

## Оптимизация производительности

### 1. CDN кэширование

Supabase автоматически использует CDN для статических файлов. Установлен `Cache-Control: 31536000` (1 год).

### 2. Ленивая загрузка изображений

```typescript
<img 
  src={imageUrl} 
  loading="lazy" 
  alt="Image"
/>
```

### 3. Responsive изображения

```typescript
// Загрузить несколько размеров
const sizes = [320, 640, 1280];
const urls = await Promise.all(
  sizes.map(size => uploadResizedImage(file, userId, size))
);

// Использовать srcset
<img 
  srcSet={`${urls[0]} 320w, ${urls[1]} 640w, ${urls[2]} 1280w`}
  sizes="(max-width: 320px) 320px, (max-width: 640px) 640px, 1280px"
  src={urls[2]}
  alt="Image"
/>
```

## Troubleshooting

### Ошибка "Storage bucket not found"
1. Проверьте, что bucket `files` создан в Supabase Dashboard
2. Убедитесь, что bucket публичный (Public bucket: true)

### Ошибка "Permission denied"
1. Проверьте политики безопасности в Storage
2. Убедитесь, что пользователь авторизован
3. Проверьте, что `auth.uid()` совпадает с userId

### Файлы не загружаются
1. Проверьте размер файла (не превышает лимит)
2. Проверьте тип файла (входит в allowedTypes)
3. Проверьте консоль браузера на ошибки
4. Проверьте квоту Storage в Supabase Dashboard

### Медленная загрузка
1. Включите сжатие изображений
2. Уменьшите maxWidth/maxHeight
3. Используйте WebP вместо PNG/JPEG
4. Проверьте скорость интернета

## Миграция с Firebase Storage

```typescript
// Старый код (Firebase)
const storageRef = ref(storage, `images/${userId}/${fileName}`);
await uploadBytes(storageRef, file);
const url = await getDownloadURL(storageRef);

// Новый код (Supabase)
const result = await uploadFile(file, userId, 'image');
const url = result.url;
```

## Заключение

Система загрузки файлов через Supabase Storage полностью настроена и готова к использованию. Она обеспечивает:

- Быструю загрузку с автоматической оптимизацией
- Безопасное хранение с контролем доступа
- Масштабируемость до петабайтов данных
- CDN для быстрой доставки по всему миру

Для вопросов и поддержки: https://supabase.com/docs/guides/storage
