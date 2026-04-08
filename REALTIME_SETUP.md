# Настройка Real-Time мессенджера

## Обзор

Вместо Firebase Firestore теперь используется мощный стек:
- **Supabase** - PostgreSQL база данных с real-time подписками
- **Socket.IO** - WebSocket для мгновенной доставки сообщений
- **Real-time статусы** - онлайн/оффлайн без задержек

## Преимущества

✅ **Нет проблем с правами доступа** - полный контроль над безопасностью
✅ **Мгновенная доставка** - WebSocket быстрее Firestore
✅ **Бесплатно** - Supabase дает 500MB БД и 2GB трафика бесплатно
✅ **PostgreSQL** - мощная реляционная БД вместо NoSQL
✅ **Типизация** - полная поддержка TypeScript

## Шаг 1: Создание проекта Supabase

1. Перейдите на https://supabase.com
2. Нажмите "Start your project"
3. Создайте аккаунт (можно через GitHub)
4. Создайте новый проект:
   - Название: `housegram-messenger`
   - Database Password: (придумайте надежный пароль)
   - Region: выберите ближайший регион
5. Дождитесь создания проекта (~2 минуты)

## Шаг 2: Настройка базы данных

1. В Supabase Dashboard откройте **SQL Editor**
2. Создайте новый query
3. Скопируйте содержимое файла `supabase-schema.sql`
4. Вставьте в редактор и нажмите **Run**
5. Проверьте, что все таблицы созданы в разделе **Table Editor**

## Шаг 3: Получение ключей API

1. В Supabase Dashboard откройте **Settings** → **API**
2. Скопируйте:
   - **Project URL** (например: `https://xxxxx.supabase.co`)
   - **anon public** ключ

## Шаг 4: Настройка переменных окружения

Создайте или обновите файл `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Socket.IO
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
SOCKET_PORT=3001
CORS_ORIGIN=http://localhost:3000

# Firebase (оставляем для совместимости)
NEXT_PUBLIC_FIREBASE_CONFIG=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
```

## Шаг 5: Запуск Socket.IO сервера

Откройте новый терминал и запустите:

```bash
node server/socket-server.js
```

Вы должны увидеть:
```
🚀 Socket.IO server running on port 3001
📡 WebSocket endpoint: ws://localhost:3001
```

## Шаг 6: Обновление package.json

Добавьте скрипт для запуска Socket.IO сервера:

```json
{
  "scripts": {
    "dev": "next dev",
    "socket": "node server/socket-server.js",
    "dev:all": "concurrently \"npm run dev\" \"npm run socket\""
  }
}
```

Установите concurrently для одновременного запуска:

```bash
npm install --save-dev concurrently
```

Теперь можно запускать все одной командой:

```bash
npm run dev:all
```

## Использование в коде

### Инициализация Socket.IO

```typescript
import { initSocket, emitUserStatus } from '@/lib/socket';

// При входе пользователя
const socket = initSocket(userId);
emitUserStatus('online');
```

### Отправка сообщения

```typescript
import { emitMessage } from '@/lib/socket';

emitMessage(chatId, {
  text: 'Привет!',
  type: 'text'
});
```

### Получение сообщений

```typescript
import { onNewMessage } from '@/lib/socket';

onNewMessage((message) => {
  console.log('Новое сообщение:', message);
  // Обновить UI
});
```

### Статус "печатает..."

```typescript
import { emitTyping, onTyping } from '@/lib/socket';

// Отправить
emitTyping(chatId, true);

// Получить
onTyping(({ chatId, userId, isTyping }) => {
  console.log(`User ${userId} is typing in ${chatId}`);
});
```

### Работа с Supabase

```typescript
import { userService, messageService } from '@/lib/supabase';

// Обновить статус
await userService.updateStatus(userId, 'online');

// Отправить сообщение
const { data, error } = await messageService.sendMessage({
  chat_id: chatId,
  sender_id: userId,
  text: 'Привет!',
  type: 'text',
  status: 'sent'
});

// Подписаться на новые сообщения
const subscription = messageService.subscribeToMessages(chatId, (message) => {
  console.log('Новое сообщение:', message);
});

// Отписаться
subscription.unsubscribe();
```

## Миграция с Firebase

Если хотите мигрировать данные с Firebase:

1. Экспортируйте данные из Firebase Console
2. Используйте скрипт миграции (создам отдельно)
3. Импортируйте в Supabase через SQL

## Production деплой

### Socket.IO сервер

Можно развернуть на:
- **Railway.app** (бесплатно)
- **Render.com** (бесплатно)
- **Heroku** (платно)
- **VPS** (DigitalOcean, Linode)

### Supabase

Автоматически работает в production, просто используйте production URL.

## Мониторинг

### Supabase Dashboard
- Просмотр таблиц в реальном времени
- SQL запросы
- Логи и метрики

### Socket.IO
- Количество подключений
- Активные комнаты
- Логи событий

## Troubleshooting

### Socket.IO не подключается

1. Проверьте, что сервер запущен: `node server/socket-server.js`
2. Проверьте порт в `.env.local`
3. Проверьте CORS настройки

### Supabase ошибки

1. Проверьте URL и ключ API
2. Проверьте RLS политики в Dashboard
3. Проверьте логи в Supabase Dashboard

### Сообщения не доставляются

1. Проверьте подключение к Socket.IO
2. Проверьте, что пользователь присоединился к комнате чата
3. Проверьте логи сервера

## Следующие шаги

1. ✅ Установлены библиотеки
2. ✅ Создана схема БД
3. ✅ Настроен Socket.IO сервер
4. ⏳ Создать проект в Supabase
5. ⏳ Запустить Socket.IO сервер
6. ⏳ Интегрировать в ChatContext

Готово к использованию! 🚀
