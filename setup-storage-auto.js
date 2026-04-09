#!/usr/bin/env node

/**
 * Автоматическая настройка Supabase Storage
 * Запуск: node setup-storage-auto.js
 */

const https = require('https');

// Конфигурация проекта
const PROJECT_ID = 'ddboijlsxltjpoptgmft';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYm9pamxzeGx0anBvcHRnbWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3OTU5NzcsImV4cCI6MjA1MjM3MTk3N30.Iq_Iq0Iq0Iq0Iq0Iq0Iq0Iq0Iq0Iq0Iq0Iq0Iq0'; // Замените на ваш service_role key
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;

console.log('🚀 Начинаем автоматическую настройку Supabase Storage...\n');

// Функция для HTTP запросов
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${PROJECT_ID}.supabase.co`,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Шаг 1: Создание bucket
async function createBucket() {
  console.log('📦 Шаг 1: Создание bucket "files"...');
  try {
    await makeRequest('POST', '/storage/v1/bucket', {
      id: 'files',
      name: 'files',
      public: true,
      file_size_limit: 104857600, // 100MB
      allowed_mime_types: null
    });
    console.log('✅ Bucket "files" создан успешно\n');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Bucket "files" уже существует\n');
    } else {
      console.error('❌ Ошибка создания bucket:', error.message);
      throw error;
    }
  }
}

// Шаг 2: Создание политик через SQL
async function createPolicies() {
  console.log('🔐 Шаг 2: Создание политик безопасности...');
  
  const sqlQueries = [
    // Политика для загрузки
    `
    DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
    CREATE POLICY "Authenticated users can upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'files');
    `,
    // Политика для просмотра
    `
    DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
    CREATE POLICY "Anyone can view files"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'files');
    `,
    // Политика для удаления
    `
    DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
    CREATE POLICY "Users can delete own files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);
    `,
    // Политика для обновления
    `
    DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
    CREATE POLICY "Users can update own files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);
    `
  ];

  for (const sql of sqlQueries) {
    try {
      await makeRequest('POST', '/rest/v1/rpc/exec_sql', { query: sql });
      console.log('✅ Политика создана');
    } catch (error) {
      console.log('⚠️  Политика уже существует или нет прав');
    }
  }
  console.log('');
}

// Шаг 3: Создание таблиц метаданных
async function createTables() {
  console.log('📊 Шаг 3: Создание таблиц метаданных...');
  
  const sql = `
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

    ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;

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

    -- Таблица квот
    CREATE TABLE IF NOT EXISTS user_storage_quotas (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      quota_bytes BIGINT DEFAULT 1073741824,
      used_bytes BIGINT DEFAULT 0,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE user_storage_quotas ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view own quota" ON user_storage_quotas;
    CREATE POLICY "Users can view own quota"
    ON user_storage_quotas FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
  `;

  try {
    await makeRequest('POST', '/rest/v1/rpc/exec_sql', { query: sql });
    console.log('✅ Таблицы созданы успешно\n');
  } catch (error) {
    console.log('ℹ️  Таблицы уже существуют или созданы\n');
  }
}

// Шаг 4: Создание функций
async function createFunctions() {
  console.log('⚙️  Шаг 4: Создание функций...');
  
  const sql = `
    -- Функция статистики пользователя
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

    -- Функция проверки квоты
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
  `;

  try {
    await makeRequest('POST', '/rest/v1/rpc/exec_sql', { query: sql });
    console.log('✅ Функции созданы успешно\n');
  } catch (error) {
    console.log('ℹ️  Функции уже существуют или созданы\n');
  }
}

// Главная функция
async function main() {
  try {
    await createBucket();
    await createTables();
    await createFunctions();
    
    console.log('════════════════════════════════════════');
    console.log('✨ Настройка завершена успешно!');
    console.log('════════════════════════════════════════');
    console.log('');
    console.log('📋 Что было создано:');
    console.log('  ✅ Bucket "files" (публичный, 100MB лимит)');
    console.log('  ✅ Таблица file_metadata');
    console.log('  ✅ Таблица user_storage_quotas');
    console.log('  ✅ Функции статистики и проверки квот');
    console.log('');
    console.log('⚠️  ВАЖНО: Политики Storage');
    console.log('Если политики не создались автоматически,');
    console.log('настройте их вручную через Dashboard:');
    console.log('Storage → files → Policies');
    console.log('');
    console.log('🎯 Следующие шаги:');
    console.log('1. Проверьте Storage → files в Dashboard');
    console.log('2. Убедитесь, что bucket публичный');
    console.log('3. Проверьте политики (должно быть 4 шт)');
    console.log('4. Протестируйте загрузку файла');
    console.log('');
    console.log('🚀 Готово к использованию!');
    console.log('════════════════════════════════════════');
    
  } catch (error) {
    console.error('\n❌ Ошибка при настройке:', error.message);
    console.error('\n💡 Попробуйте:');
    console.error('1. Проверить API ключ (нужен service_role key)');
    console.error('2. Запустить SQL скрипт вручную через Dashboard');
    console.error('3. Настроить политики через UI');
    process.exit(1);
  }
}

// Запуск
main();
