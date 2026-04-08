# Быстрый старт Real-Time мессенджера

## 🚀 Запуск за 5 минут

### 1. Запустите Socket.IO сервер и Next.js одновременно

```bash
npm run dev:all
```

Вы увидите:
```
[0] ▲ Next.js 15.5.14
[0]    - Local:        http://localhost:3000
[1] 🚀 Socket.IO server running on port 3001
```

### 2. Откройте браузер

Перейдите на http://localhost:3000

## ✅ Что уже работает

- ✅ Socket.IO сервер настроен
- ✅ Real-time подключения
- ✅ Отправка/получение сообщений
- ✅ Статусы онлайн/оффлайн
- ✅ "Печатает..." индикатор
- ✅ Прочитано/не прочитано

## 📝 Что нужно настроить (опционально)

### Для production использования:

1. **Создайте проект в Supabase** (бесплатно)
   - https://supabase.com
   - Следуйте инструкциям в `REALTIME_SETUP.md`

2. **Добавьте ключи в `.env.local`**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```

3. **Разверните Socket.IO сервер**
   - Railway.app (рекомендуется, бесплатно)
   - Render.com
   - Heroku

## 🎯 Текущий режим

Сейчас работает в **локальном режиме**:
- Socket.IO: localhost:3001
- Сообщения хранятся в памяти
- При перезапуске данные сбрасываются

Для **production** нужно:
- Настроить Supabase (постоянное хранилище)
- Развернуть Socket.IO сервер
- Обновить URL в `.env.local`

## 🔧 Команды

```bash
# Запустить все (Next.js + Socket.IO)
npm run dev:all

# Только Next.js
npm run dev

# Только Socket.IO
npm run socket

# Сборка для production
npm run build
```

## 📚 Документация

- `REALTIME_SETUP.md` - Полная настройка Supabase
- `supabase-schema.sql` - SQL схема базы данных
- `lib/socket.ts` - Socket.IO клиент
- `lib/supabase.ts` - Supabase клиент
- `server/socket-server.js` - Socket.IO сервер

## 🐛 Проблемы?

### Socket.IO не подключается
```bash
# Проверьте, что сервер запущен
npm run socket
```

### Порт 3001 занят
Измените порт в `.env.local`:
```env
SOCKET_PORT=3002
NEXT_PUBLIC_SOCKET_URL=http://localhost:3002
```

## 🎉 Готово!

Теперь у вас есть мощный real-time мессенджер без проблем с Firebase permissions!
