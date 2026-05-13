# Настройка историй (Stories) через Supabase

## ✅ Шаг 1: Обновить Firestore Rules - ВЫПОЛНЕНО

Правила успешно применены!

## ⚠️ Шаг 2: Настроить Supabase Storage - ТРЕБУЕТСЯ

### Вариант 1: Через Supabase Dashboard (РЕКОМЕНДУЕТСЯ)

1. Откройте https://supabase.com/dashboard/project/YOUR_PROJECT_ID/storage/buckets
2. Войдите в свой проект Supabase
3. Перейдите в **Storage** → **Buckets**
4. Если bucket `files` не существует:
   - Нажмите **New bucket**
   - Name: `files`
   - Public: ✅ (включить)
   - Нажмите **Create bucket**

5. Настройте **Policies** для bucket `files`:
   - Нажмите на bucket `files`
   - Перейдите в **Policies**
   - Нажмите **New policy**
   - Создайте 4 политики:

#### Политика 1: Чтение (SELECT)
```sql
CREATE POLICY "Anyone can view files"
ON storage.objects FOR SELECT
USING (bucket_id = 'files' AND auth.role() = 'authenticated');
```

#### Политика 2: Загрузка (INSERT)
```sql
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'files' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN ('images', 'videos', 'audio', 'documents', 'stickers', 'gifs')
  AND (storage.foldername(name))[2] = auth.uid()::text
);
```

#### Политика 3: Обновление (UPDATE)
```sql
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'files' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
```

#### Политика 4: Удаление (DELETE)
```sql
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'files' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
```

### Вариант 2: Через SQL Editor

1. Откройте https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
2. Скопируйте содержимое файла `supabase-stories-setup.sql`
3. Вставьте в SQL Editor
4. Нажмите **Run**

## Проверка

После настройки Supabase Storage:
1. Обновите страницу приложения (Ctrl+F5)
2. Попробуйте создать историю (загрузить фото/видео)
3. Проверьте в Supabase Dashboard → Storage → files, что файлы загружаются в папки `images/` и `videos/`
4. Проверьте, что истории отображаются и открываются

## Преимущества Supabase Storage:

- ✅ Нет проблем с CORS
- ✅ Бесплатно до 1GB
- ✅ Автоматическое сжатие изображений
- ✅ CDN для быстрой загрузки
- ✅ Простые политики доступа

## Что было добавлено:

- ✅ Компонент Stories с кнопкой создания
- ✅ Загрузка фото/видео в Supabase Storage (вместо Firebase)
- ✅ Полноэкранный просмотр с прогресс-барами
- ✅ Счетчик просмотров (глаз) для своих историй
- ✅ Автоудаление через 24 часа
- ✅ Группировка по пользователям
- ✅ Firestore Rules применены
- ⚠️ Supabase Storage нужно настроить (см. выше)


