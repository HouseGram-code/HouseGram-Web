# Быстрый старт Supabase Storage

## Шаг 1: Запуск SQL скрипта

1. Откройте Supabase Dashboard: https://app.supabase.com
2. Выберите ваш проект
3. Перейдите в **SQL Editor** (левое меню)
4. Нажмите **New Query**
5. Скопируйте весь код из файла `supabase-storage-setup.sql`
6. Вставьте в редактор
7. Нажмите **Run** или `Ctrl+Enter`

## Шаг 2: Проверка установки

После выполнения скрипта вы увидите сообщение:
```
============================================
Supabase Storage успешно настроен!
============================================
```

## Шаг 3: Проверка bucket

1. Перейдите в **Storage** (левое меню)
2. Вы должны увидеть bucket с именем `files`
3. Статус: **Public** (публичный)

## Шаг 4: Настройка переменных окружения

Добавьте в `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Найти эти значения можно в:
**Settings** → **API** → **Project URL** и **anon public**

## Шаг 5: Тестирование загрузки

```typescript
import { uploadFile } from '@/lib/supabase';

// Тест загрузки
const testUpload = async (file: File, userId: string) => {
  try {
    const result = await uploadFile(file, userId);
    console.log('✅ Файл загружен:', result.url);
    return result;
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
};
```

## Полезные SQL команды

### Проверить размер bucket
```sql
SELECT * FROM get_bucket_size('files');
```

### Статистика по пользователям
```sql
SELECT * FROM get_user_storage_stats() LIMIT 10;
```

### Топ-10 самых больших файлов
```sql
SELECT 
  name,
  pg_size_pretty((metadata->>'size')::bigint) as size,
  created_at
FROM storage.objects
WHERE bucket_id = 'files'
ORDER BY (metadata->>'size')::bigint DESC
LIMIT 10;
```

### Очистка файлов старше 90 дней
```sql
SELECT * FROM cleanup_old_files(90);
```

## Что было создано

✅ **Bucket `files`** - публичное хранилище
✅ **4 политики безопасности** - контроль доступа
✅ **3 функции мониторинга** - статистика и очистка
✅ **2 представления** - быстрый доступ к статистике
✅ **5 индексов** - оптимизация запросов
✅ **Таблица метаданных** - дополнительная информация о файлах
✅ **Система квот** - ограничение использования

## Структура папок

```
files/
├── images/{userId}/     - Изображения
├── videos/{userId}/     - Видео
├── audio/{userId}/      - Аудио
├── documents/{userId}/  - Документы
├── stickers/{userId}/   - Стикеры
└── gifs/{userId}/       - GIF анимации
```

## Лимиты по умолчанию

| Тип файла | Макс. размер | Сжатие |
|-----------|-------------|--------|
| Изображения | 10MB | ✅ WebP |
| Видео | 100MB | ❌ |
| Аудио | 20MB | ❌ |
| Документы | 50MB | ❌ |
| Стикеры | 5MB | ✅ WebP |
| GIF | 10MB | ❌ |

## Troubleshooting

### Ошибка "relation does not exist"
- Убедитесь, что таблица `users` существует
- Запустите сначала `supabase-schema.sql`

### Ошибка "permission denied"
- Проверьте, что вы запускаете SQL от имени администратора
- В Supabase Dashboard это происходит автоматически

### Bucket не создаётся
- Проверьте, что bucket с именем `files` не существует
- Удалите старый bucket и запустите скрипт снова

## Следующие шаги

1. ✅ Запустите SQL скрипт
2. ✅ Проверьте создание bucket
3. ✅ Настройте `.env.local`
4. ✅ Протестируйте загрузку файла
5. ✅ Интегрируйте в ChatView

## Поддержка

Документация Supabase Storage:
https://supabase.com/docs/guides/storage

Если возникли проблемы, проверьте:
- Логи в Supabase Dashboard → Logs
- Консоль браузера (F12)
- Network tab для HTTP запросов
