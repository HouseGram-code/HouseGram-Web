-- ============================================
-- SUPABASE STORAGE SETUP
-- Полная настройка хранилища для файлов
-- ============================================

-- ============================================
-- 1. СОЗДАНИЕ STORAGE BUCKET
-- ============================================

-- Создаём публичный bucket для файлов
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'files',
  'files',
  true,
  104857600, -- 100MB в байтах
  NULL -- Разрешить все типы файлов
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = NULL;

-- ============================================
-- 2. ПОЛИТИКИ БЕЗОПАСНОСТИ ДЛЯ STORAGE
-- ============================================

-- Удаляем старые политики если они есть
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;

-- Политика 1: Загрузка файлов (только авторизованные пользователи)
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'files'
);

-- Политика 2: Просмотр файлов (все пользователи, включая анонимных)
CREATE POLICY "Anyone can view files"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'files'
);

-- Политика 3: Удаление файлов (только владелец файла)
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Политика 4: Обновление файлов (только владелец файла)
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- 3. ФУНКЦИИ ДЛЯ РАБОТЫ С ФАЙЛАМИ
-- ============================================

-- Функция для получения размера bucket
CREATE OR REPLACE FUNCTION get_bucket_size(bucket_name text)
RETURNS TABLE (
  file_count bigint,
  total_size_bytes bigint,
  total_size_formatted text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as file_count,
    COALESCE(SUM((metadata->>'size')::bigint), 0)::bigint as total_size_bytes,
    pg_size_pretty(COALESCE(SUM((metadata->>'size')::bigint), 0)) as total_size_formatted
  FROM storage.objects
  WHERE bucket_id = bucket_name;
END;
$$;

-- Функция для получения статистики по пользователям
CREATE OR REPLACE FUNCTION get_user_storage_stats()
RETURNS TABLE (
  user_id text,
  file_count bigint,
  total_size_bytes bigint,
  total_size_formatted text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (storage.foldername(name))[1] as user_id,
    COUNT(*)::bigint as file_count,
    COALESCE(SUM((metadata->>'size')::bigint), 0)::bigint as total_size_bytes,
    pg_size_pretty(COALESCE(SUM((metadata->>'size')::bigint), 0)) as total_size_formatted
  FROM storage.objects
  WHERE bucket_id = 'files'
  GROUP BY (storage.foldername(name))[1]
  ORDER BY SUM((metadata->>'size')::bigint) DESC;
END;
$$;

-- Функция для очистки старых файлов
CREATE OR REPLACE FUNCTION cleanup_old_files(days_old integer DEFAULT 90)
RETURNS TABLE (
  deleted_count bigint,
  freed_space_bytes bigint,
  freed_space_formatted text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count bigint;
  v_freed_space bigint;
BEGIN
  -- Подсчитываем размер файлов для удаления
  SELECT 
    COUNT(*),
    COALESCE(SUM((metadata->>'size')::bigint), 0)
  INTO v_deleted_count, v_freed_space
  FROM storage.objects
  WHERE bucket_id = 'files'
  AND created_at < NOW() - (days_old || ' days')::interval;
  
  -- Удаляем файлы
  DELETE FROM storage.objects
  WHERE bucket_id = 'files'
  AND created_at < NOW() - (days_old || ' days')::interval;
  
  RETURN QUERY
  SELECT 
    v_deleted_count,
    v_freed_space,
    pg_size_pretty(v_freed_space);
END;
$$;

-- ============================================
-- 4. ПРЕДСТАВЛЕНИЯ ДЛЯ МОНИТОРИНГА
-- ============================================

-- Представление для статистики bucket
CREATE OR REPLACE VIEW storage_bucket_stats AS
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  COALESCE(SUM((metadata->>'size')::bigint), 0) as total_size_bytes,
  pg_size_pretty(COALESCE(SUM((metadata->>'size')::bigint), 0)) as total_size,
  MIN(created_at) as oldest_file,
  MAX(created_at) as newest_file
FROM storage.objects
GROUP BY bucket_id;

-- Представление для статистики по типам файлов
CREATE OR REPLACE VIEW storage_file_types AS
SELECT 
  bucket_id,
  (storage.foldername(name))[2] as file_type,
  COUNT(*) as file_count,
  COALESCE(SUM((metadata->>'size')::bigint), 0) as total_size_bytes,
  pg_size_pretty(COALESCE(SUM((metadata->>'size')::bigint), 0)) as total_size,
  AVG((metadata->>'size')::bigint) as avg_size_bytes,
  pg_size_pretty(AVG((metadata->>'size')::bigint)::bigint) as avg_size
FROM storage.objects
WHERE bucket_id = 'files'
GROUP BY bucket_id, (storage.foldername(name))[2]
ORDER BY total_size_bytes DESC;

-- ============================================
-- 5. ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ
-- ============================================

-- Индекс для быстрого поиска по bucket_id
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id 
ON storage.objects(bucket_id);

-- Индекс для быстрого поиска по created_at
CREATE INDEX IF NOT EXISTS idx_storage_objects_created_at 
ON storage.objects(created_at DESC);

-- Индекс для быстрого поиска по owner
CREATE INDEX IF NOT EXISTS idx_storage_objects_owner 
ON storage.objects(owner);

-- Составной индекс для поиска файлов пользователя
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_owner 
ON storage.objects(bucket_id, owner);

-- ============================================
-- 6. ТРИГГЕРЫ ДЛЯ АВТОМАТИЗАЦИИ
-- ============================================

-- Функция для логирования загрузок
CREATE OR REPLACE FUNCTION log_file_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Можно добавить логирование в отдельную таблицу
  -- INSERT INTO file_upload_logs (user_id, file_path, file_size, uploaded_at)
  -- VALUES (NEW.owner, NEW.name, (NEW.metadata->>'size')::bigint, NOW());
  
  RETURN NEW;
END;
$$;

-- Триггер на загрузку файлов (закомментирован, раскомментируйте если нужно логирование)
-- CREATE TRIGGER on_file_upload
-- AFTER INSERT ON storage.objects
-- FOR EACH ROW
-- EXECUTE FUNCTION log_file_upload();

-- ============================================
-- 7. ТАБЛИЦА ДЛЯ МЕТАДАННЫХ ФАЙЛОВ (ОПЦИОНАЛЬНО)
-- ============================================

-- Создаём таблицу для хранения дополнительных метаданных
CREATE TABLE IF NOT EXISTS file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- для видео/аудио в секундах
  thumbnail_url TEXT,
  is_compressed BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  UNIQUE(file_path)
);

-- Индексы для file_metadata
CREATE INDEX IF NOT EXISTS idx_file_metadata_user_id ON file_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_file_type ON file_metadata(file_type);
CREATE INDEX IF NOT EXISTS idx_file_metadata_uploaded_at ON file_metadata(uploaded_at DESC);

-- RLS для file_metadata
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own file metadata"
ON file_metadata FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own file metadata"
ON file_metadata FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own file metadata"
ON file_metadata FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own file metadata"
ON file_metadata FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- 8. ПОЛЕЗНЫЕ ЗАПРОСЫ ДЛЯ АДМИНИСТРИРОВАНИЯ
-- ============================================

-- Проверка размера bucket
-- SELECT * FROM get_bucket_size('files');

-- Статистика по пользователям
-- SELECT * FROM get_user_storage_stats() LIMIT 10;

-- Топ-10 самых больших файлов
-- SELECT 
--   name,
--   (metadata->>'size')::bigint as size_bytes,
--   pg_size_pretty((metadata->>'size')::bigint) as size,
--   created_at,
--   owner
-- FROM storage.objects
-- WHERE bucket_id = 'files'
-- ORDER BY (metadata->>'size')::bigint DESC
-- LIMIT 10;

-- Файлы загруженные за последние 24 часа
-- SELECT 
--   name,
--   pg_size_pretty((metadata->>'size')::bigint) as size,
--   created_at,
--   owner
-- FROM storage.objects
-- WHERE bucket_id = 'files'
-- AND created_at > NOW() - INTERVAL '24 hours'
-- ORDER BY created_at DESC;

-- Очистка файлов старше 90 дней
-- SELECT * FROM cleanup_old_files(90);

-- ============================================
-- 9. НАСТРОЙКА КВОТ (ОПЦИОНАЛЬНО)
-- ============================================

-- Таблица для хранения квот пользователей
CREATE TABLE IF NOT EXISTS user_storage_quotas (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  quota_bytes BIGINT DEFAULT 1073741824, -- 1GB по умолчанию
  used_bytes BIGINT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Функция для проверки квоты перед загрузкой
CREATE OR REPLACE FUNCTION check_user_quota(p_user_id UUID, p_file_size BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quota BIGINT;
  v_used BIGINT;
BEGIN
  -- Получаем квоту и использование
  SELECT quota_bytes, used_bytes
  INTO v_quota, v_used
  FROM user_storage_quotas
  WHERE user_id = p_user_id;
  
  -- Если записи нет, создаём с дефолтной квотой
  IF NOT FOUND THEN
    INSERT INTO user_storage_quotas (user_id, quota_bytes, used_bytes)
    VALUES (p_user_id, 1073741824, 0);
    v_quota := 1073741824;
    v_used := 0;
  END IF;
  
  -- Проверяем, не превышена ли квота
  RETURN (v_used + p_file_size) <= v_quota;
END;
$$;

-- Функция для обновления использованного места
CREATE OR REPLACE FUNCTION update_user_storage_usage(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_size BIGINT;
BEGIN
  -- Подсчитываем общий размер файлов пользователя
  SELECT COALESCE(SUM((metadata->>'size')::bigint), 0)
  INTO v_total_size
  FROM storage.objects
  WHERE bucket_id = 'files'
  AND owner = p_user_id;
  
  -- Обновляем или создаём запись
  INSERT INTO user_storage_quotas (user_id, used_bytes, updated_at)
  VALUES (p_user_id, v_total_size, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    used_bytes = v_total_size,
    updated_at = NOW();
END;
$$;

-- RLS для user_storage_quotas
ALTER TABLE user_storage_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quota"
ON user_storage_quotas FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- ЗАВЕРШЕНИЕ НАСТРОЙКИ
-- ============================================

-- Выводим статистику после настройки
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Supabase Storage успешно настроен!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Bucket: files (публичный)';
  RAISE NOTICE 'Максимальный размер файла: 100MB';
  RAISE NOTICE 'Политики безопасности: установлены';
  RAISE NOTICE 'Функции мониторинга: созданы';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Полезные команды:';
  RAISE NOTICE '1. Проверить размер: SELECT * FROM get_bucket_size(''files'');';
  RAISE NOTICE '2. Статистика пользователей: SELECT * FROM get_user_storage_stats();';
  RAISE NOTICE '3. Очистка старых файлов: SELECT * FROM cleanup_old_files(90);';
  RAISE NOTICE '============================================';
END $$;
