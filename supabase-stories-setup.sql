-- ============================================
-- Supabase Storage Setup для историй (Stories)
-- ============================================

-- Создаем bucket для файлов (если еще не создан)
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies для историй
-- ============================================

-- Политика: Все авторизованные пользователи могут читать файлы
CREATE POLICY "Anyone can view files"
ON storage.objects FOR SELECT
USING (bucket_id = 'files' AND auth.role() = 'authenticated');

-- Политика: Пользователи могут загружать файлы в свою папку
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'files' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN ('images', 'videos', 'audio', 'documents', 'stickers', 'gifs')
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Политика: Пользователи могут обновлять свои файлы
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'files' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Политика: Пользователи могут удалять свои файлы
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'files' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- ============================================
-- Проверка настроек
-- ============================================

-- Проверяем bucket
SELECT * FROM storage.buckets WHERE id = 'files';

-- Проверяем политики
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
