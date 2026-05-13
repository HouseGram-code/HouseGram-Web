-- Проверка и диагностика таблицы received_gifts

-- 1. Проверка существования таблицы
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'received_gifts';

-- 2. Проверка структуры таблицы
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'received_gifts'
ORDER BY ordinal_position;

-- 3. Проверка индексов
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'received_gifts';

-- 4. Проверка RLS (Row Level Security)
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'received_gifts';

-- 5. Проверка политик RLS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'received_gifts';

-- 6. Подсчет записей в таблице
SELECT COUNT(*) as total_gifts FROM received_gifts;

-- 7. Просмотр последних 5 подарков
SELECT 
  id,
  user_id,
  gift_id,
  name,
  emoji,
  cost,
  from_user_id,
  from_name,
  can_convert,
  received_at
FROM received_gifts
ORDER BY received_at DESC
LIMIT 5;

-- 8. Статистика по пользователям
SELECT 
  user_id,
  COUNT(*) as gifts_count,
  SUM(cost) as total_value
FROM received_gifts
GROUP BY user_id
ORDER BY gifts_count DESC;

-- 9. Проверка на дубликаты
SELECT 
  user_id,
  gift_id,
  received_at,
  COUNT(*) as duplicates
FROM received_gifts
GROUP BY user_id, gift_id, received_at
HAVING COUNT(*) > 1;

-- 10. Тестовая вставка (закомментировано)
-- INSERT INTO received_gifts (user_id, gift_id, name, emoji, cost, from_user_id, from_name)
-- VALUES ('test-user', 'teddy_bear', 'Плюшевый мишка', '🧸', 15, 'test-sender', 'Тестовый отправитель');

-- 11. Тестовое чтение
-- SELECT * FROM received_gifts WHERE user_id = 'test-user';

-- 12. Тестовое удаление (закомментировано)
-- DELETE FROM received_gifts WHERE user_id = 'test-user';
