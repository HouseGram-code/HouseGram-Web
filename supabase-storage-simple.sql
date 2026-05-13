-- ============================================
-- SUPABASE STORAGE SETUP (УПРОЩЁННАЯ ВЕРСИЯ)
-- Настройка без изменения системных таблиц
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
-- 2. ТАБЛИЦА ДЛЯ МЕТАДАННЫХ ФАЙЛОВ
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

DROP POLICY IF EXISTS "Users can view own file metadata" ON file_metadata;
DROP POLICY IF EXISTS "Users can insert own file metadata" ON file_metadata;
DROP POLICY IF EXISTS "Users can update own file metadata" ON file_metadata;
DROP POLICY IF EXISTS "Users can delete own file metadata" ON file_metadata;

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
-- 3. ФУНКЦИИ ДЛЯ РАБОТЫ С МЕТАДАННЫМИ
-- ============================================

-- Функция для получения статистики пользователя
CREATE OR REPLACE FUNCTION get_user_file_stats(p_user_id UUID)
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
    COALESCE(SUM(file_size), 0)::bigint as total_size_bytes,
    pg_size_pretty(COALESCE(SUM(file_size), 0)) as total_size_formatted
  FROM file_metadata
  WHERE user_id = p_user_id;
END;
$$;

-- Функция для получения статистики по типам файлов
CREATE OR REPLACE FUNCTION get_file_type_stats(p_user_id UUID)
RETURNS TABLE (
  file_type text,
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
    fm.file_type,
    COUNT(*)::bigint as file_count,
    COALESCE(SUM(fm.file_size), 0)::bigint as total_size_bytes,
    pg_size_pretty(COALESCE(SUM(fm.file_size), 0)) as total_size_formatted
  FROM file_metadata fm
  WHERE fm.user_id = p_user_id
  GROUP BY fm.file_type
  ORDER BY total_size_bytes DESC;
END;
$$;

-- Функция для очистки старых метаданных
CREATE OR REPLACE FUNCTION cleanup_old_file_metadata(p_user_id UUID, days_old integer DEFAULT 90)
RETURNS TABLE (
  deleted_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count bigint;
BEGIN
  DELETE FROM file_metadata
  WHERE user_id = p_user_id
  AND uploaded_at < NOW() - (days_old || ' days')::interval;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN QUERY
  SELECT v_deleted_count;
END;
$$;

-- ============================================
-- 4. ТАБЛИЦА ДЛЯ КВОТ ПОЛЬЗОВАТЕЛЕЙ
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
  SELECT COALESCE(SUM(file_size), 0)
  INTO v_total_size
  FROM file_metadata
  WHERE user_id = p_user_id;
  
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

DROP POLICY IF EXISTS "Users can view own quota" ON user_storage_quotas;

CREATE POLICY "Users can view own quota"
ON user_storage_quotas FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- 5. ПРЕДСТАВЛЕНИЯ ДЛЯ СТАТИСТИКИ
-- ============================================

-- Представление для статистики по типам файлов
CREATE OR REPLACE VIEW user_file_stats AS
SELECT 
  user_id,
  file_type,
  COUNT(*) as file_count,
  COALESCE(SUM(file_size), 0) as total_size_bytes,
  pg_size_pretty(COALESCE(SUM(file_size), 0)) as total_size
FROM file_metadata
GROUP BY user_id, file_type;

-- ============================================
-- ЗАВЕРШЕНИЕ НАСТРОЙКИ
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Supabase Storage успешно настроен!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Bucket: files (публичный)';
  RAISE NOTICE 'Максимальный размер файла: 100MB';
  RAISE NOTICE 'Таблица метаданных: создана';
  RAISE NOTICE 'Функции статистики: созданы';
  RAISE NOTICE 'Система квот: настроена (1GB по умолчанию)';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Полезные команды:';
  RAISE NOTICE '1. Статистика: SELECT * FROM get_user_file_stats(auth.uid());';
  RAISE NOTICE '2. По типам: SELECT * FROM get_file_type_stats(auth.uid());';
  RAISE NOTICE '3. Очистка: SELECT * FROM cleanup_old_file_metadata(auth.uid(), 90);';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'ВАЖНО: Настройте политики Storage в Dashboard!';
  RAISE NOTICE 'Storage → files → Policies → New Policy';
  RAISE NOTICE '============================================';
END $$;
