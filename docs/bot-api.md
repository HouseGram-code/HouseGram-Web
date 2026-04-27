# 🤖 HouseGram Bot API 0.1

Полная документация по созданию и управлению ботами в HouseGram.

---

## 📋 Содержание

1. [Введение](#введение)
2. [BotMaster - Создание бота](#botmaster---создание-бота)
3. [Bot API Reference](#bot-api-reference)
4. [Webhook System](#webhook-system)
5. [Примеры использования](#примеры-использования)

---

## 🎯 Введение

HouseGram Bot API позволяет разработчикам создавать ботов для автоматизации задач, интеграции с внешними сервисами и создания интерактивных приложений.

### Возможности Bot API

- ✅ Отправка и получение сообщений
- ✅ Работа с файлами и медиа
- ✅ Inline-кнопки и клавиатуры
- ✅ Webhook для получения обновлений
- ✅ Команды и обработка текста
- ✅ Управление группами и каналами

---

## 🤖 BotMaster - Создание бота

### Шаг 1: Найдите BotMaster

1. Откройте HouseGram
2. Откройте боковое меню и выберите "BotMaster"
3. Нажмите "Создать нового бота"

### Шаг 2: Создайте бота

BotMaster попросит вас:
1. **Имя бота** - отображаемое имя (например: "My Awesome Bot")
2. **Username бота** - уникальное имя, должно заканчиваться на `bot` (например: `my_awesome_bot`)

### Шаг 3: Получите токен

После создания бота вы получите **Bot Token**:
```
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

⚠️ **ВАЖНО**: Храните токен в секрете! Любой, у кого есть токен, может управлять вашим ботом.

### Возможности BotMaster

- ✅ Создать нового бота
- ✅ Список ваших ботов
- ✅ Изменить имя бота
- ✅ Изменить описание
- ✅ Установить аватар бота
- ✅ Установить список команд
- ✅ Удалить бота
- ✅ Получить токен бота
- ✅ Обновить токен (revoke)

---

## 📡 Bot API Reference

### Base URL

```
https://api.housegram.app/bot<token>/
```

### Методы API

#### sendMessage

Отправить текстовое сообщение.

**Endpoint**: `POST /sendMessage`

**Параметры**:
```json
{
  "chat_id": "user_id_or_channel_id",
  "text": "Hello from bot!",
  "parse_mode": "Markdown",
  "reply_markup": {
    "inline_keyboard": [[
      {"text": "Button 1", "callback_data": "btn1"},
      {"text": "Button 2", "url": "https://example.com"}
    ]]
  }
}
```

**Пример**:
```javascript
const response = await fetch('https://api.housegram.app/bot1234567890:ABC/sendMessage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: 'user123',
    text: 'Hello! 👋'
  })
});
```

#### sendPhoto

Отправить фото.

**Endpoint**: `POST /sendPhoto`

**Параметры**:
```json
{
  "chat_id": "user_id",
  "photo": "https://example.com/image.jpg",
  "caption": "Photo caption"
}
```

#### sendDocument

Отправить файл.

**Endpoint**: `POST /sendDocument`

**Параметры**:
```json
{
  "chat_id": "user_id",
  "document": "https://example.com/file.pdf",
  "caption": "File caption"
}
```

#### sendVoice

Отправить голосовое сообщение.

**Endpoint**: `POST /sendVoice`

**Параметры**:
```json
{
  "chat_id": "user_id",
  "voice": "https://example.com/voice.ogg"
}
```

#### getMe

Получить информацию о боте.

**Endpoint**: `GET /getMe`

**Ответ**:
```json
{
  "ok": true,
  "result": {
    "id": "bot123",
    "is_bot": true,
    "first_name": "My Bot",
    "username": "my_awesome_bot"
  }
}
```

#### getUpdates

Получить обновления (long polling).

**Endpoint**: `GET /getUpdates`

**Параметры**:
```json
{
  "offset": 0,
  "limit": 100,
  "timeout": 30
}
```

#### setWebhook

Установить webhook для получения обновлений.

**Endpoint**: `POST /setWebhook`

**Параметры**:
```json
{
  "url": "https://your-server.com/webhook"
}
```

#### deleteWebhook

Удалить webhook.

**Endpoint**: `POST /deleteWebhook`

#### answerCallbackQuery

Ответить на callback от inline-кнопки.

**Endpoint**: `POST /answerCallbackQuery`

**Параметры**:
```json
{
  "callback_query_id": "query_id",
  "text": "Button clicked!",
  "show_alert": false
}
```

---

## 🔔 Webhook System

### Настройка Webhook

1. **Установите webhook URL**:
```javascript
await fetch('https://api.housegram.app/bot<token>/setWebhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://your-server.com/webhook'
  })
});
```

2. **Обработайте входящие обновления**:
```javascript
// Express.js пример
app.post('/webhook', (req, res) => {
  const update = req.body;
  
  if (update.message) {
    const chatId = update.message.chat.id;
    const text = update.message.text;
    
    // Обработка сообщения
    console.log(`Received: ${text} from ${chatId}`);
  }
  
  res.sendStatus(200);
});
```

### Структура Update

```json
{
  "update_id": 123456789,
  "message": {
    "message_id": "msg123",
    "from": {
      "id": "user123",
      "first_name": "John",
      "username": "john_doe"
    },
    "chat": {
      "id": "user123",
      "type": "private"
    },
    "date": 1234567890,
    "text": "/start"
  }
}
```

---

## 💡 Примеры использования

### Простой Echo Bot

```javascript
const BOT_TOKEN = '1234567890:ABC';
const API_URL = `https://api.housegram.app/bot${BOT_TOKEN}`;

// Получение обновлений
async function getUpdates(offset = 0) {
  const response = await fetch(`${API_URL}/getUpdates?offset=${offset}`);
  const data = await response.json();
  return data.result;
}

// Отправка сообщения
async function sendMessage(chatId, text) {
  await fetch(`${API_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

// Основной цикл
let offset = 0;
while (true) {
  const updates = await getUpdates(offset);
  
  for (const update of updates) {
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      
      // Echo
      await sendMessage(chatId, `You said: ${text}`);
    }
    
    offset = update.update_id + 1;
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

### Bot с командами

```javascript
const commands = {
  '/start': async (chatId) => {
    await sendMessage(chatId, 'Welcome! Use /help to see commands.');
  },
  
  '/help': async (chatId) => {
    const helpText = `
Available commands:
/start - Start the bot
/help - Show this message
/about - About this bot
    `;
    await sendMessage(chatId, helpText);
  },
  
  '/about': async (chatId) => {
    await sendMessage(chatId, 'This is a HouseGram bot!');
  }
};

// Обработка команд
for (const update of updates) {
  if (update.message) {
    const chatId = update.message.chat.id;
    const text = update.message.text;
    
    if (commands[text]) {
      await commands[text](chatId);
    }
  }
}
```

### Bot с inline-кнопками

```javascript
async function sendMenuMessage(chatId) {
  await fetch(`${API_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: 'Choose an option:',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🎮 Games', callback_data: 'games' },
            { text: '⚙️ Settings', callback_data: 'settings' }
          ],
          [
            { text: '📊 Stats', callback_data: 'stats' },
            { text: 'ℹ️ Info', callback_data: 'info' }
          ]
        ]
      }
    })
  });
}

// Обработка callback
if (update.callback_query) {
  const callbackData = update.callback_query.data;
  const chatId = update.callback_query.message.chat.id;
  
  switch (callbackData) {
    case 'games':
      await sendMessage(chatId, 'Opening games...');
      break;
    case 'settings':
      await sendMessage(chatId, 'Opening settings...');
      break;
  }
  
  // Ответ на callback
  await fetch(`${API_URL}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: update.callback_query.id
    })
  });
}
```

### Webhook Bot (Express.js)

```javascript
const express = require('express');
const app = express();

app.use(express.json());

const BOT_TOKEN = '1234567890:ABC';
const API_URL = `https://api.housegram.app/bot${BOT_TOKEN}`;

// Установка webhook
async function setupWebhook() {
  await fetch(`${API_URL}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://your-server.com/webhook'
    })
  });
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  const update = req.body;
  
  if (update.message) {
    const chatId = update.message.chat.id;
    const text = update.message.text;
    
    if (text === '/start') {
      await fetch(`${API_URL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: 'Hello! I am a webhook bot!'
        })
      });
    }
  }
  
  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log('Bot server running on port 3000');
  setupWebhook();
});
```

---

## 🔒 Безопасность

### Защита токена

```javascript
// ❌ Плохо - токен в коде
const token = '1234567890:ABC';

// ✅ Хорошо - токен в переменных окружения
const token = process.env.BOT_TOKEN;
```

### Проверка webhook

```javascript
app.post('/webhook', (req, res) => {
  const secretToken = req.headers['x-housegram-bot-api-secret-token'];
  
  if (secretToken !== process.env.WEBHOOK_SECRET) {
    return res.sendStatus(403);
  }
  
  // Обработка обновления
  // ...
});
```

---

## 📊 Лимиты API

- **Сообщения**: 30 сообщений в секунду
- **Файлы**: Максимум 50 МБ
- **Webhook**: Таймаут 60 секунд
- **Long Polling**: Таймаут 30 секунд

---

## 🆘 Поддержка

Нужна помощь? Свяжитесь с нами:
- 📱 [Telegram Bot Support](https://t.me/HouseGramBot)

---

<div align="center">

**Создавайте крутых ботов! 🤖**

[← Назад к документации](./README.md)

</div>
