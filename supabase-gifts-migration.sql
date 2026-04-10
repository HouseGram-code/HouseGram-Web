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

-- Политики безопасности для обновления баланса подарков
CREATE POLICY "Users can update own stars and gifts" ON users FOR UPDATE 
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update gifts_received on other users" ON users FOR UPDATE
  USING (true)
  WITH CHECK (
    -- Разрешаем обновлять только gifts_received
    (NEW.gifts_received IS DISTINCT FROM OLD.gifts_received) AND
    (NEW.id = OLD.id) AND
    (NEW.email = OLD.email) AND
    (NEW.name = OLD.name) AND
    (NEW.username = OLD.username)
  );
