-- Миграция для добавления функционала подарков

-- Добавляем поля для подарков в таблицу users
ALTER TABLE users ADD COLUMN IF NOT EXISTS stars INTEGER DEFAULT 100;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gifts_sent INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gifts_received INTEGER DEFAULT 0;

-- Добавляем поля для подарков в таблицу messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS gift_id TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS gift_name TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS gift_emoji TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS gift_cost INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS gift_from UUID REFERENCES users(id) ON DELETE SET NULL;

-- Обновляем CHECK constraint для type в messages
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_type_check 
  CHECK (type IN ('text', 'audio', 'file', 'sticker', 'gif', 'gift'));

-- Устанавливаем начальный баланс для существующих пользователей
UPDATE users SET stars = 100 WHERE stars IS NULL;
UPDATE users SET gifts_sent = 0 WHERE gifts_sent IS NULL;
UPDATE users SET gifts_received = 0 WHERE gifts_received IS NULL;

-- Удаляем старые политики если они есть
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can update own stars and gifts" ON users;
DROP POLICY IF EXISTS "Users can update gifts_received on other users" ON users;

-- Создаем новую политику для обновления своего профиля (включая stars и gifts)
CREATE POLICY "Users can update own profile" ON users FOR UPDATE 
  USING (auth.uid()::text = id::text);

-- Создаем политику для обновления gifts_received у других пользователей
CREATE POLICY "Users can increment gifts_received" ON users FOR UPDATE 
  USING (auth.uid() IS NOT NULL);
