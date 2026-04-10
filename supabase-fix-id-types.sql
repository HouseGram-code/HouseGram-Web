-- Исправление типов ID для совместимости с Firebase Auth

-- Удаляем внешние ключи
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_chat_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_gift_from_fkey;
ALTER TABLE channels DROP CONSTRAINT IF EXISTS channels_created_by_fkey;
ALTER TABLE channel_posts DROP CONSTRAINT IF EXISTS channel_posts_channel_id_fkey;
ALTER TABLE invites DROP CONSTRAINT IF EXISTS invites_channel_id_fkey;
ALTER TABLE invites DROP CONSTRAINT IF EXISTS invites_created_by_fkey;

-- Изменяем тип ID в таблице users с UUID на TEXT
ALTER TABLE users ALTER COLUMN id TYPE TEXT;

-- Изменяем тип ID в таблице chats
ALTER TABLE chats ALTER COLUMN id TYPE TEXT;
ALTER TABLE chats ALTER COLUMN last_message_sender_id TYPE TEXT;

-- Изменяем тип ID в таблице messages
ALTER TABLE messages ALTER COLUMN id TYPE TEXT;
ALTER TABLE messages ALTER COLUMN chat_id TYPE TEXT;
ALTER TABLE messages ALTER COLUMN sender_id TYPE TEXT;
ALTER TABLE messages ALTER COLUMN reply_to TYPE TEXT;
ALTER TABLE messages ALTER COLUMN gift_from TYPE TEXT;

-- Изменяем тип ID в таблице channels
ALTER TABLE channels ALTER COLUMN id TYPE TEXT;
ALTER TABLE channels ALTER COLUMN created_by TYPE TEXT;

-- Изменяем тип ID в таблице channel_posts
ALTER TABLE channel_posts ALTER COLUMN id TYPE TEXT;
ALTER TABLE channel_posts ALTER COLUMN channel_id TYPE TEXT;

-- Изменяем тип ID в таблице invites
ALTER TABLE invites ALTER COLUMN channel_id TYPE TEXT;
ALTER TABLE invites ALTER COLUMN created_by TYPE TEXT;

-- Восстанавливаем внешние ключи
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;
  
ALTER TABLE messages ADD CONSTRAINT messages_chat_id_fkey 
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;
  
ALTER TABLE messages ADD CONSTRAINT messages_gift_from_fkey 
  FOREIGN KEY (gift_from) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE channels ADD CONSTRAINT channels_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE channel_posts ADD CONSTRAINT channel_posts_channel_id_fkey 
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE;

ALTER TABLE invites ADD CONSTRAINT invites_channel_id_fkey 
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE;

ALTER TABLE invites ADD CONSTRAINT invites_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- Обновляем политики безопасности для работы с TEXT ID
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can increment gifts_received" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;

CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can increment gifts_received" ON users FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Обновляем политики для chats
DROP POLICY IF EXISTS "Users can view own chats" ON chats;
DROP POLICY IF EXISTS "Users can create chats" ON chats;

CREATE POLICY "Users can view own chats" ON chats FOR SELECT 
  USING (auth.uid() = ANY(participants));

CREATE POLICY "Users can create chats" ON chats FOR INSERT 
  WITH CHECK (auth.uid() = ANY(participants));

-- Обновляем политики для messages
DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;

CREATE POLICY "Users can view messages in their chats" ON messages FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND auth.uid() = ANY(chats.participants)
  ));

CREATE POLICY "Users can send messages" ON messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages" ON messages FOR UPDATE 
  USING (auth.uid() = sender_id);

-- Обновляем политики для channels
DROP POLICY IF EXISTS "Anyone can view channels" ON channels;
DROP POLICY IF EXISTS "Users can create channels" ON channels;
DROP POLICY IF EXISTS "Channel owners can update" ON channels;

CREATE POLICY "Anyone can view channels" ON channels FOR SELECT USING (true);

CREATE POLICY "Users can create channels" ON channels FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Channel owners can update" ON channels FOR UPDATE 
  USING (auth.uid() = created_by);

-- Обновляем политики для invites
DROP POLICY IF EXISTS "Anyone can view invites" ON invites;
DROP POLICY IF EXISTS "Users can create invites" ON invites;

CREATE POLICY "Anyone can view invites" ON invites FOR SELECT USING (true);

CREATE POLICY "Users can create invites" ON invites FOR INSERT 
  WITH CHECK (auth.uid() = created_by);
