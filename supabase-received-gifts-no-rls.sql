-- ВРЕМЕННАЯ ВЕРСИЯ БЕЗ RLS ДЛЯ ТЕСТИРОВАНИЯ
-- После того как убедитесь что все работает, используйте версию с RLS

-- Удаляем старую таблицу если есть
DROP TABLE IF EXISTS received_gifts CASCADE;

-- Создание таблицы для полученных подарков
CREATE TABLE received_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  gift_id TEXT NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  cost INTEGER NOT NULL,
  from_user_id TEXT NOT NULL,
  from_name TEXT NOT NULL,
  can_convert BOOLEAN DEFAULT true,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для быстрого поиска
CREATE INDEX idx_received_gifts_user_id ON received_gifts(user_id);
CREATE INDEX idx_received_gifts_received_at ON received_gifts(received_at DESC);

-- ОТКЛЮЧАЕМ RLS ДЛЯ ТЕСТИРОВАНИЯ
ALTER TABLE received_gifts DISABLE ROW LEVEL SECURITY;

-- Комментарии к таблице
COMMENT ON TABLE received_gifts IS 'Хранит полученные пользователями подарки, которые можно обменять на молнии';
COMMENT ON COLUMN received_gifts.user_id IS 'ID пользователя-получателя';
COMMENT ON COLUMN received_gifts.gift_id IS 'ID типа подарка';
COMMENT ON COLUMN received_gifts.name IS 'Название подарка';
COMMENT ON COLUMN received_gifts.emoji IS 'Эмодзи подарка';
COMMENT ON COLUMN received_gifts.cost IS 'Стоимость подарка в молниях';
COMMENT ON COLUMN received_gifts.from_user_id IS 'ID отправителя';
COMMENT ON COLUMN received_gifts.from_name IS 'Имя отправителя';
COMMENT ON COLUMN received_gifts.can_convert IS 'Можно ли обменять подарок на молнии';
COMMENT ON COLUMN received_gifts.received_at IS 'Дата и время получения подарка';

-- Проверка создания таблицы
SELECT 'Table created successfully!' as status;
SELECT * FROM received_gifts LIMIT 1;
