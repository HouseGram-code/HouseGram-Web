-- Полное пересоздание таблиц с правильными типами ID

-- Удаляем все таблицы
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS channel_posts CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Создание таблиц с TEXT ID для совместимости с Firebase Auth

-- Таблица пользователей
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_official BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_banned BOOLEAN DEFAULT FALSE,
  stars INTEGER DEFAULT 100,
  gifts_sent INTEGER DEFAULT 0,
  gifts_received INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица чатов
CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  participants TEXT[] NOT NULL,
  last_message TEXT,
  last_message_sender_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица сообщений
CREATE TABLE messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chat_id TEXT REFERENCES chats(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'audio', 'file', 'sticker', 'gif', 'gift')),
  file_url TEXT,
  file_name TEXT,
  sticker_url TEXT,
  gif_url TEXT,
  gift_id TEXT,
  gift_name TEXT,
  gift_emoji TEXT,
  gift_cost INTEGER,
  gift_from TEXT REFERENCES users(id) ON DELETE SET NULL,
  reply_to TEXT REFERENCES messages(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'read')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица каналов
CREATE TABLE channels (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE CASCADE,
  subscribers TEXT[] DEFAULT '{}',
  subscribers_count INTEGER DEFAULT 0,
  invite_code TEXT UNIQUE NOT NULL,
  link TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица постов в каналах
CREATE TABLE channel_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  channel_id TEXT REFERENCES channels(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  file_url TEXT,
  views INTEGER DEFAULT 0,
  viewed_by TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица приглашений
CREATE TABLE invites (
  invite_code TEXT PRIMARY KEY,
  channel_id TEXT REFERENCES channels(id) ON DELETE CASCADE,
  created_by TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица настроек системы
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Вставляем начальные настройки
INSERT INTO settings (key, maintenance_mode) VALUES ('global', FALSE);

-- Индексы для оптимизации
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_chats_participants ON chats USING GIN(participants);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_seen ON users(last_seen DESC);
CREATE INDEX idx_channels_invite_code ON channels(invite_code);

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для users
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Users can increment gifts_received" ON users FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Политики безопасности для chats
CREATE POLICY "Users can view own chats" ON chats FOR SELECT USING (auth.uid()::text = ANY(participants));
CREATE POLICY "Users can create chats" ON chats FOR INSERT WITH CHECK (auth.uid()::text = ANY(participants));
CREATE POLICY "Users can update chats" ON chats FOR UPDATE USING (auth.uid()::text = ANY(participants));

-- Политики безопасности для messages
CREATE POLICY "Users can view messages in their chats" ON messages FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND auth.uid()::text = ANY(chats.participants)
  ));
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid()::text = sender_id);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid()::text = sender_id);

-- Политики безопасности для channels
CREATE POLICY "Anyone can view channels" ON channels FOR SELECT USING (true);
CREATE POLICY "Users can create channels" ON channels FOR INSERT WITH CHECK (auth.uid()::text = created_by);
CREATE POLICY "Channel owners can update" ON channels FOR UPDATE USING (auth.uid()::text = created_by);

-- Политики безопасности для channel_posts
CREATE POLICY "Anyone can view posts" ON channel_posts FOR SELECT USING (true);
CREATE POLICY "Channel owners can create posts" ON channel_posts FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM channels WHERE channels.id = channel_posts.channel_id AND auth.uid()::text = channels.created_by
  ));

-- Политики безопасности для invites
CREATE POLICY "Anyone can view invites" ON invites FOR SELECT USING (true);
CREATE POLICY "Users can create invites" ON invites FOR INSERT WITH CHECK (auth.uid()::text = created_by);
