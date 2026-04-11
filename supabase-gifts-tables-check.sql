-- Проверка всех необходимых таблиц для системы подарков

-- 1. Проверка таблицы users
SELECT 
  'users' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) as exists;

-- 2. Проверка таблицы chats
SELECT 
  'chats' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'chats'
  ) as exists;

-- 3. Проверка таблицы messages
SELECT 
  'messages' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'messages'
  ) as exists;

-- 4. Проверка таблицы received_gifts
SELECT 
  'received_gifts' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'received_gifts'
  ) as exists;

-- 5. Если таблицы не существуют, создаем их

-- Создание таблицы users (если не существует)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  username TEXT,
  stars INTEGER DEFAULT 100,
  gifts_sent INTEGER DEFAULT 0,
  gifts_received INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы chats (если не существует)
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  participants TEXT[] NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы messages (если не существует)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  text TEXT,
  type TEXT DEFAULT 'text',
  status TEXT DEFAULT 'sent',
  gift_id TEXT,
  gift_name TEXT,
  gift_emoji TEXT,
  gift_cost INTEGER,
  gift_from TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица received_gifts уже должна быть создана из предыдущего скрипта

-- 6. Отключаем RLS для всех таблиц (для тестирования)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE received_gifts DISABLE ROW LEVEL SECURITY;

-- 7. Проверка что все таблицы созданы
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'chats', 'messages', 'received_gifts')
ORDER BY table_name;
