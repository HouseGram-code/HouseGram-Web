-- ============================================
-- ПОЛНАЯ АВТОМАТИЧЕСКАЯ НАСТРОЙКА STORAGE
-- Один файл для всего
-- Проект: ddboijlsxltjpoptgmft
-- ============================================

-- ============================================
-- 1. СОЗДАНИЕ BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'files',
  'files',
  true,
  104857600,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = NULL;

-- ============================================
-- 2. ТАБЛИЦЫ
-- ============================================

-- Таблица метаданных файлов
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
  duration INTEGER,
  thumbnail_url TEXT,
  is_compressed BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  UNIQUE(file_path)
);

CREATE INDEX IF NOT EXISTS idx_file_metadata_user_id ON file_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_file_type ON file_metadata(file_type);
CREATE INDEX IF NOT EXISTS idx_file_metadata_uploaded_at ON file_metadata(uploaded_at DESC);

-- Таблица квот
CREATE TABLE IF NOT EXISTS user_storage_quotas (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  quota_bytes BIGINT DEFAULT 1073741824,
  used_bytes BIGINT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. RLS ПОЛИТИКИ ДЛЯ ТАБЛИЦ
-- ============================================

ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_storage_quotas ENABLE ROW LEVEL SECURITY;

-- Политики для file_metadata
DROP POLICY IF EXISTS "Users can view own file metadata" ON file_metadata;
CREATE POLICY "Users can view own file metadata"
ON file_metadata FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own file metadata" ON file_metadata;
CREATE POLICY "Users can insert own file metadata"
ON file_metadata FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own file metadata" ON file_metadata;
CREATE POLICY "Users can update own file metadata"
ON file_metadata FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own file metadata" ON file_metadata;
CREATE POLICY "Users can delete own file metadata"
ON file_metadata FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Политики для user_storage_quotas
DROP POLICY IF EXISTS "Users can view own quota" ON user_storage_quotas;
CREATE POLICY "Users can view own quota"
ON user_storage_quotas FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- 4. ФУНКЦИИ
-- ============================================

-- Статистика пользователя
CREATE OR REPLACE FUNCTION get_user_file_stats(p_user_id UUID)
RETURNS TABLE (
  file_count bigint,
  total_size_bytes bigint,
  total_size_formatted text
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint,
    COALESCE(SUM(file_size), 0)::bigint,
    pg_size_pretty(COALESCE(SUM(file_size), 0))
  FROM file_metadata
  WHERE user_id = p_user_id;
END;
$$;

-- Статистика по типам
CREATE OR REPLACE FUNCTION get_file_type_stats(p_user_id UUID)
RETURNS TABLE (
  file_type text,
  file_count bigint,
  total_size_bytes bigint,
  total_size_formatted text
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fm.file_type,
    COUNT(*)::bigint,
    COALESCE(SUM(fm.file_size), 0)::bigint,
    pg_size_pretty(COALESCE(SUM(fm.file_size), 0))
  FROM file_metadata fm
  WHERE fm.user_id = p_user_id
  GROUP BY fm.file_type
  ORDER BY total_size_bytes DESC;
END;
$$;

-- Проверка квоты
CREATE OR REPLACE FUNCTION check_user_quota(p_user_id UUID, p_file_size BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_quota BIGINT;
  v_used BIGINT;
BEGIN
  SELECT quota_bytes, used_bytes INTO v_quota, v_used
  FROM user_storage_quotas WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_storage_quotas (user_id, quota_bytes, used_bytes)
    VALUES (p_user_id, 1073741824, 0);
    RETURN true;
  END IF;
  
  RETURN (v_used + p_file_size) <= v_quota;
END;
$$;

-- Обновление использования
CREATE OR REPLACE FUNCTION update_user_storage_usage(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_total_size BIGINT;
BEGIN
  SELECT COALESCE(SUM(file_size), 0) INTO v_total_size
  FROM file_metadata WHERE user_id = p_user_id;
  
  INSERT INTO user_storage_quotas (user_id, used_bytes, updated_at)
  VALUES (p_user_id, v_total_size, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET used_bytes = v_total_size, updated_at = NOW();
END;
$$;

-- Очистка старых файлов
CREATE OR REPLACE FUNCTION cleanup_old_file_metadata(p_user_id UUID, days_old integer DEFAULT 90)
RETURNS TABLE (deleted_count bigint) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count bigint;
BEGIN
  DELETE FROM file_metadata
  WHERE user_id = p_user_id
  AND uploaded_at < NOW() - (days_old || ' days')::interval;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN QUERY SELECT v_deleted_count;
END;
$$;

-- ============================================
-- 5. ПРЕДСТАВЛЕНИЯ
-- ============================================

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
-- ЗАВЕРШЕНИЕ
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '✨ Supabase Storage настроен успешно!';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📦 Создано:';
  RAISE NOTICE '  ✅ Bucket: files (публичный, 100MB)';
  RAISE NOTICE '  ✅ Таблица: file_metadata';
  RAISE NOTICE '  ✅ Таблица: user_storage_quotas';
  RAISE NOTICE '  ✅ Функции: 5 шт';
  RAISE NOTICE '  ✅ Представления: 1 шт';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  ВАЖНО: Настройте политики Storage!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Перейдите в Dashboard:';
  RAISE NOTICE '   Storage → files → Policies → New Policy';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Создайте 4 политики:';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣  Загрузка (INSERT):';
  RAISE NOTICE '   Name: Authenticated users can upload';
  RAISE NOTICE '   Target: authenticated';
  RAISE NOTICE '   WITH CHECK: bucket_id = ''files''';
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣  Просмотр (SELECT):';
  RAISE NOTICE '   Name: Anyone can view files';
  RAISE NOTICE '   Target: public';
  RAISE NOTICE '   USING: bucket_id = ''files''';
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣  Удаление (DELETE):';
  RAISE NOTICE '   Name: Users can delete own files';
  RAISE NOTICE '   Target: authenticated';
  RAISE NOTICE '   USING: bucket_id = ''files'' AND';
  RAISE NOTICE '          auth.uid()::text = (storage.foldername(name))[1]';
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣  Обновление (UPDATE):';
  RAISE NOTICE '   Name: Users can update own files';
  RAISE NOTICE '   Target: authenticated';
  RAISE NOTICE '   USING и WITH CHECK: bucket_id = ''files'' AND';
  RAISE NOTICE '          auth.uid()::text = (storage.foldername(name))[1]';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '🧪 Проверка:';
  RAISE NOTICE '   SELECT * FROM storage.buckets WHERE id = ''files'';';
  RAISE NOTICE '   SELECT * FROM get_user_file_stats(auth.uid());';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
END $$;
