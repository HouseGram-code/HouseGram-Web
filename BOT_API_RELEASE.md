# 🤖 HouseGram Bot API 0.1 - Release Notes

## 🎉 Что нового?

HouseGram теперь поддерживает создание ботов! Как в Telegram, но для HouseGram.

---

## ✨ Основные возможности

### 🔧 BotMaster
- **Создание ботов** - Простой интерфейс для создания новых ботов
- **Управление ботами** - Список всех ваших ботов в одном месте
- **Токены** - Безопасная генерация и управление токенами
- **Настройки** - Изменение имени, описания и других параметров

### 📡 Bot API
- **sendMessage** - Отправка текстовых сообщений
- **sendPhoto** - Отправка изображений
- **sendDocument** - Отправка файлов
- **sendVoice** - Отправка голосовых сообщений
- **getMe** - Получение информации о боте
- **getUpdates** - Long polling для получения обновлений
- **setWebhook** - Установка webhook для получения обновлений
- **answerCallbackQuery** - Ответ на callback от inline-кнопок

### 🎨 Inline-кнопки
- Создание интерактивных меню
- Callback обработка
- URL кнопки

---

## 🚀 Как начать?

### 1. Создайте бота

1. Откройте HouseGram
2. Откройте боковое меню (☰)
3. Выберите **"BotMaster"**
4. Нажмите **"Создать нового бота"**
5. Введите имя и username
6. Получите токен!

### 2. Используйте Bot API

```javascript
const BOT_TOKEN = 'your_bot_token_here';
const API_URL = `https://housegram.vercel.app/api/bot/${BOT_TOKEN}`;

// Отправка сообщения
await fetch(`${API_URL}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: 'user_id',
    text: 'Hello from bot!'
  })
});
```

### 3. Примеры

В папке `examples/` вы найдете:
- **bot-example.js** - Простой echo bot с long polling
- **bot-webhook-example.js** - Продвинутый бот с webhook (Express.js)

---

## 📚 Документация

Полная документация доступна в файле: **[docs/bot-api.md](./docs/bot-api.md)**

### Разделы документации:
- 🎯 Введение в Bot API
- 🤖 Создание бота через BotMaster
- 📡 API Reference (все методы)
- 🔔 Webhook System
- 💡 Примеры использования
- 🔒 Безопасность

---

## 🛠️ Технические детали

### API Endpoints

```
POST /api/bot/{token}/sendMessage
POST /api/bot/{token}/sendPhoto
POST /api/bot/{token}/sendDocument
POST /api/bot/{token}/sendVoice
GET  /api/bot/{token}/getMe
GET  /api/bot/{token}/getUpdates
POST /api/bot/{token}/setWebhook
POST /api/bot/{token}/deleteWebhook
POST /api/bot/{token}/answerCallbackQuery
```

### База данных

Новые коллекции в Firestore:
- `bots` - Информация о ботах
- `bot_updates` - Обновления для long polling
- `callback_answers` - Ответы на callback queries

### Безопасность

- ✅ Токены генерируются криптографически безопасным способом
- ✅ Проверка владельца бота при всех операциях
- ✅ Валидация токенов при каждом API запросе
- ✅ Защита от несанкционированного доступа

---

## 📊 Лимиты

- **Сообщения**: 30 сообщений в секунду
- **Файлы**: Максимум 50 МБ
- **Webhook**: Таймаут 60 секунд
- **Long Polling**: Таймаут 30 секунд

---

## 🎯 Roadmap

### Версия 0.2 (планируется)
- [ ] Inline режим
- [ ] Клавиатуры (ReplyKeyboardMarkup)
- [ ] Редактирование сообщений
- [ ] Удаление сообщений
- [ ] Пересылка сообщений
- [ ] Работа с группами и каналами

### Версия 0.3 (планируется)
- [ ] Payments API
- [ ] Games API
- [ ] Passport API
- [ ] Stickers API

---

## 💡 Примеры использования

### Echo Bot
```javascript
// Простой бот, который повторяет сообщения
const updates = await getUpdates();
for (const update of updates) {
  if (update.message) {
    await sendMessage(
      update.message.chat.id,
      `Вы сказали: ${update.message.text}`
    );
  }
}
```

### Бот с кнопками
```javascript
await sendMessage(chatId, 'Выберите действие:', {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '🎮 Игры', callback_data: 'games' },
        { text: '⚙️ Настройки', callback_data: 'settings' }
      ]
    ]
  }
});
```

### Webhook бот
```javascript
app.post('/webhook', async (req, res) => {
  const update = req.body;
  
  if (update.message) {
    await sendMessage(
      update.message.chat.id,
      'Получил ваше сообщение!'
    );
  }
  
  res.sendStatus(200);
});
```

---

## 🔧 Установка и настройка

### Для разработчиков ботов

1. Создайте бота через BotMaster
2. Скопируйте токен
3. Используйте примеры из `examples/`
4. Читайте документацию в `docs/bot-api.md`

### Для разработчиков HouseGram

Новые файлы в проекте:
```
lib/botApi.ts                          # Bot API библиотека
components/BotMasterView.tsx           # UI для создания ботов
app/api/bot/[token]/*/route.ts        # API endpoints
docs/bot-api.md                        # Документация
examples/bot-example.js                # Пример бота
examples/bot-webhook-example.js        # Пример webhook бота
```

---

## 🐛 Известные проблемы

- Пока нет поддержки групп и каналов для ботов
- Inline режим в разработке
- Некоторые методы Telegram Bot API еще не реализованы

---

## 🤝 Вклад в проект

Хотите помочь развитию Bot API?

1. Создавайте issue с предложениями
2. Присылайте pull requests
3. Делитесь примерами ботов
4. Улучшайте документацию

---

## 📞 Поддержка

Нужна помощь?
- 📱 [Telegram Bot Support](https://t.me/HouseGramBot)
- 📖 [Документация](./docs/bot-api.md)
- 💡 [Примеры](./examples/)

---

## 📝 Changelog

### v0.1.0 (2026-04-27)

**Добавлено:**
- ✅ BotMaster - интерфейс для создания ботов
- ✅ Bot API - базовые методы для работы с ботами
- ✅ Система токенов
- ✅ Long polling (getUpdates)
- ✅ Webhook поддержка
- ✅ Inline-кнопки
- ✅ Отправка текста, фото, файлов, голосовых
- ✅ Документация и примеры

**Технические изменения:**
- Добавлена библиотека `lib/botApi.ts`
- Созданы API endpoints в `app/api/bot/`
- Добавлен компонент `BotMasterView`
- Обновлены типы в `types/index.ts`
- Добавлена документация в `docs/bot-api.md`

---

## 🎉 Заключение

HouseGram Bot API 0.1 - это первый шаг к созданию экосистемы ботов для HouseGram. Мы вдохновлялись Telegram Bot API, но адаптировали его под нашу платформу.

**Создавайте крутых ботов и делитесь ими с сообществом!** 🚀

---

<div align="center">

**Made with 💜 by the HouseGram Team**

[← Назад к README](./README.md) | [Документация Bot API →](./docs/bot-api.md)

</div>
