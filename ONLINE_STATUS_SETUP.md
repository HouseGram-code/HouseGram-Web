# Настройка отслеживания онлайн статуса через Supabase

## Обзор

Система отслеживания онлайн статуса позволяет видеть, когда пользователи находятся в сети или были в последний раз онлайн. Реализована через Supabase Realtime для мгновенного обновления статусов.

## Возможности

✅ Автоматическое обновление статуса "онлайн" при активности
✅ Установка статуса "оффлайн" при закрытии вкладки/браузера
✅ Heartbeat каждые 30 секунд для поддержания онлайн статуса
✅ Realtime подписки на изменения статусов других пользователей
✅ Форматирование времени последнего посещения ("был(а) 5 мин. назад")
✅ Поддержка мобильных устройств (события pagehide)
✅ Надежная отправка через sendBeacon API

## Структура базы данных

В таблице `users` должны быть поля:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT,
  name TEXT,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_official BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска онлайн пользователей
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_seen ON users(last_seen);
```

## Настройка Supabase Realtime

1. В Supabase Dashboard перейдите в **Database** → **Replication**
2. Включите Realtime для таблицы `users`
3. Выберите события: `UPDATE` (для отслеживания изменений статуса)

## Использование в коде

### 1. Автоматическое отслеживание своего статуса

```typescript
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

function MyComponent() {
  const { user } = useAuth(); // Ваш хук авторизации
  
  // Автоматически отслеживает статус текущего пользователя
  useOnlineStatus(user?.id || null, true);
  
  return <div>...</div>;
}
```

### 2. Подписка на статус одного пользователя

```typescript
import { useUserStatus } from '@/hooks/useOnlineStatus';

function UserProfile({ userId }: { userId: string }) {
  const [userStatus, setUserStatus] = useState<'online' | 'offline'>('offline');
  
  useUserStatus(userId, (user) => {
    setUserStatus(user.status);
  });
  
  return (
    <div>
      Статус: {userStatus === 'online' ? 'В сети' : 'Не в сети'}
    </div>
  );
}
```

### 3. Подписка на статусы нескольких пользователей

```typescript
import { useMultipleUserStatuses } from '@/hooks/useOnlineStatus';

function ChatList({ contacts }: { contacts: Contact[] }) {
  const [statuses, setStatuses] = useState<Record<string, User>>({});
  
  const userIds = contacts.map(c => c.id);
  
  useMultipleUserStatuses(userIds, (user) => {
    setStatuses(prev => ({
      ...prev,
      [user.id]: user
    }));
  });
  
  return (
    <div>
      {contacts.map(contact => (
        <div key={contact.id}>
          {contact.name} - {statuses[contact.id]?.status || 'offline'}
        </div>
      ))}
    </div>
  );
}
```

### 4. Ручное управление статусом

```typescript
import { userService } from '@/lib/supabase';

// Установить статус онлайн
await userService.updateStatus(userId, 'online');

// Установить статус оффлайн
await userService.updateStatus(userId, 'offline');
```

### 5. Форматирование времени последнего посещения

```typescript
import { formatLastSeen } from '@/lib/supabase';

const lastSeenText = formatLastSeen(user.last_seen);
// Результат: "был(а) 5 мин. назад" или "был(а) 2 ч. назад"
```

## API Endpoint для надежного обновления статуса

Создайте файл `app/api/update-status/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, status, lastSeen } = await request.json();
    
    if (!userId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const { error } = await supabase
      .from('users')
      .update({
        status,
        last_seen: lastSeen || new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating status:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in update-status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Интеграция в ChatContext

Добавьте в ваш `ChatContext.tsx`:

```typescript
import { useOnlineStatus, useMultipleUserStatuses } from '@/hooks/useOnlineStatus';
import { formatLastSeen, User as SupabaseUser } from '@/lib/supabase';

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  
  // Автоматическое отслеживание статуса текущего пользователя
  useOnlineStatus(user?.uid || null, !!user);
  
  // Получаем ID всех контактов для отслеживания их статусов
  const contactIds = Object.keys(contacts).filter(id => 
    id !== 'saved_messages' && id !== 'test_bot'
  );
  
  // Подписываемся на статусы всех контактов
  useMultipleUserStatuses(contactIds, (updatedUser: SupabaseUser) => {
    setContacts(prev => {
      const contact = prev[updatedUser.id];
      if (!contact) return prev;
      
      const statusOnline = updatedUser.status === 'online' ? 'в сети' : formatLastSeen(updatedUser.last_seen);
      const statusOffline = updatedUser.status === 'online' ? 'в сети' : formatLastSeen(updatedUser.last_seen);
      
      return {
        ...prev,
        [updatedUser.id]: {
          ...contact,
          statusOnline,
          statusOffline
        }
      };
    });
  });
  
  // ... остальной код
};
```

## Как это работает

### 1. При входе пользователя
- Статус автоматически устанавливается в "online"
- Запускается heartbeat интервал (каждые 30 секунд)
- Регистрируются обработчики событий браузера

### 2. Во время активности
- Каждые 30 секунд отправляется heartbeat с обновлением `last_seen`
- Статус остаётся "online" пока вкладка активна

### 3. При переключении вкладки
- Событие `visibilitychange` устанавливает статус в "offline"
- При возврате на вкладку статус снова становится "online"

### 4. При закрытии браузера
- Событие `beforeunload` отправляет статус "offline" через `sendBeacon`
- Событие `pagehide` дублирует отправку для мобильных устройств
- API endpoint `/api/update-status` обрабатывает запрос

### 5. Realtime обновления
- Supabase Realtime отслеживает изменения в таблице `users`
- При изменении статуса любого пользователя срабатывает callback
- UI автоматически обновляется с новым статусом

## Оптимизация производительности

### Батчинг обновлений
Вместо подписки на каждого пользователя отдельно, используйте `useMultipleUserStatuses` для подписки на всех сразу через один канал.

### Дебаунсинг
Heartbeat интервал 30 секунд - оптимальный баланс между актуальностью и нагрузкой на сервер.

### Индексы базы данных
Создайте индексы на поля `status` и `last_seen` для быстрых запросов.

## Troubleshooting

### Статус не обновляется
1. Проверьте, что Realtime включен для таблицы `users` в Supabase
2. Убедитесь, что у пользователя есть права на UPDATE таблицы
3. Проверьте консоль браузера на ошибки подключения

### Статус не сбрасывается при закрытии
1. Убедитесь, что API endpoint `/api/update-status` работает
2. Проверьте, что `sendBeacon` поддерживается браузером
3. Добавьте логирование в обработчики событий

### Высокая нагрузка на базу данных
1. Увеличьте интервал heartbeat с 30 до 60 секунд
2. Используйте батчинг для обновления статусов
3. Добавьте кэширование на уровне приложения

## Дополнительные возможности

### Показ "печатает..."
```typescript
// В таблице users добавьте поле
is_typing BOOLEAN DEFAULT FALSE

// Обновляйте при вводе текста
await supabase
  .from('users')
  .update({ is_typing: true })
  .eq('id', userId);
```

### История активности
```typescript
// Создайте таблицу для истории
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  status TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### Аналитика времени онлайн
```typescript
// Подсчёт времени онлайн за день
SELECT 
  user_id,
  SUM(EXTRACT(EPOCH FROM (next_timestamp - timestamp))) as seconds_online
FROM (
  SELECT 
    user_id,
    timestamp,
    LEAD(timestamp) OVER (PARTITION BY user_id ORDER BY timestamp) as next_timestamp,
    status
  FROM user_activity
  WHERE DATE(timestamp) = CURRENT_DATE
) sub
WHERE status = 'online'
GROUP BY user_id;
```

## Заключение

Система отслеживания онлайн статуса полностью настроена и готова к использованию. Она автоматически управляет статусами пользователей и предоставляет realtime обновления через Supabase.

Для вопросов и поддержки обращайтесь к документации Supabase Realtime: https://supabase.com/docs/guides/realtime
