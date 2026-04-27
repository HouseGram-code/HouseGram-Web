// HouseGram Bot API - Webhook Example
// Продвинутый бот с использованием webhook (Express.js)

const express = require('express');
const app = express();

// Конфигурация
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://your-server.com/webhook';
const PORT = process.env.PORT || 3000;
const API_URL = `https://housegram.vercel.app/api/bot/${BOT_TOKEN}`;

app.use(express.json());

// Функция для отправки сообщения
async function sendMessage(chatId, text, options = {}) {
  const body = {
    chat_id: chatId,
    text: text,
    ...options
  };

  const response = await fetch(`${API_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  return await response.json();
}

// Функция для отправки фото
async function sendPhoto(chatId, photoUrl, caption = '') {
  const response = await fetch(`${API_URL}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption: caption
    })
  });

  return await response.json();
}

// Установка webhook
async function setupWebhook() {
  const response = await fetch(`${API_URL}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: WEBHOOK_URL })
  });

  const result = await response.json();
  if (result.ok) {
    console.log('✅ Webhook установлен:', WEBHOOK_URL);
  } else {
    console.error('❌ Ошибка установки webhook:', result.error);
  }
}

// Команды бота
const commands = {
  '/start': async (chatId, userName) => {
    await sendMessage(
      chatId,
      `👋 Привет, ${userName}!\n\nЯ продвинутый бот HouseGram.\n\nВыбери действие:`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 Статистика', callback_data: 'stats' },
              { text: '🎲 Случайное число', callback_data: 'random' }
            ],
            [
              { text: '🖼️ Случайное фото', callback_data: 'photo' },
              { text: '💡 Совет дня', callback_data: 'tip' }
            ],
            [
              { text: 'ℹ️ Помощь', callback_data: 'help' }
            ]
          ]
        }
      }
    );
  },

  '/help': async (chatId) => {
    await sendMessage(
      chatId,
      `📖 Команды бота:

/start - Главное меню
/help - Эта справка
/stats - Статистика бота
/random - Случайное число
/photo - Случайное фото
/tip - Совет дня
/weather <город> - Погода
/calc <выражение> - Калькулятор

Или используй кнопки для быстрого доступа!`
    );
  },

  '/stats': async (chatId) => {
    const stats = {
      users: 1234,
      messages: 56789,
      uptime: '7 дней 12 часов'
    };

    await sendMessage(
      chatId,
      `📊 Статистика бота:

👥 Пользователей: ${stats.users}
💬 Сообщений: ${stats.messages}
⏱️ Работает: ${stats.uptime}
🚀 Версия: 1.0.0`
    );
  },

  '/random': async (chatId) => {
    const randomNum = Math.floor(Math.random() * 100) + 1;
    await sendMessage(
      chatId,
      `🎲 Ваше случайное число: ${randomNum}`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '🔄 Ещё раз', callback_data: 'random' }
          ]]
        }
      }
    );
  },

  '/photo': async (chatId) => {
    // Случайное фото с Unsplash
    const randomId = Math.floor(Math.random() * 1000);
    const photoUrl = `https://picsum.photos/800/600?random=${randomId}`;
    
    await sendPhoto(chatId, photoUrl, '🖼️ Случайное фото для вас!');
  },

  '/tip': async (chatId) => {
    const tips = [
      '💡 Используйте /help для просмотра всех команд',
      '🚀 Боты могут автоматизировать рутинные задачи',
      '🎯 Inline-кнопки делают бота удобнее',
      '📱 HouseGram Bot API похож на Telegram Bot API',
      '⚡ Webhook быстрее, чем long polling'
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    await sendMessage(chatId, randomTip);
  }
};

// Обработка callback от кнопок
async function handleCallback(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const userName = callbackQuery.from.first_name;

  switch (data) {
    case 'stats':
      await commands['/stats'](chatId);
      break;
    case 'random':
      await commands['/random'](chatId);
      break;
    case 'photo':
      await commands['/photo'](chatId);
      break;
    case 'tip':
      await commands['/tip'](chatId);
      break;
    case 'help':
      await commands['/help'](chatId);
      break;
  }

  // Ответ на callback
  await fetch(`${API_URL}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQuery.id,
      text: '✅ Выполнено'
    })
  });
}

// Обработка команды /weather
async function handleWeather(chatId, city) {
  if (!city) {
    await sendMessage(chatId, '❌ Укажите город: /weather Москва');
    return;
  }

  // Здесь можно интегрировать реальный API погоды
  await sendMessage(
    chatId,
    `🌤️ Погода в ${city}:\n\n🌡️ Температура: 22°C\n💨 Ветер: 5 м/с\n💧 Влажность: 65%\n\n(Это демо-данные)`
  );
}

// Обработка команды /calc
async function handleCalc(chatId, expression) {
  if (!expression) {
    await sendMessage(chatId, '❌ Укажите выражение: /calc 2+2');
    return;
  }

  try {
    // Простой калькулятор (в продакшене используйте безопасный парсер)
    const result = eval(expression.replace(/[^0-9+\-*/().]/g, ''));
    await sendMessage(chatId, `🔢 ${expression} = ${result}`);
  } catch (error) {
    await sendMessage(chatId, '❌ Ошибка в выражении');
  }
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    console.log('📨 Получено обновление:', JSON.stringify(update, null, 2));

    // Обработка сообщений
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text || '';
      const userName = update.message.from.first_name;

      console.log(`💬 Сообщение от ${userName}: ${text}`);

      // Обработка команд
      if (text.startsWith('/')) {
        const [command, ...args] = text.split(' ');
        
        if (commands[command]) {
          await commands[command](chatId, userName);
        } else if (command === '/weather') {
          await handleWeather(chatId, args.join(' '));
        } else if (command === '/calc') {
          await handleCalc(chatId, args.join(' '));
        } else {
          await sendMessage(chatId, '❌ Неизвестная команда. Используйте /help');
        }
      } else {
        // Эхо для обычных сообщений
        await sendMessage(chatId, `Вы написали: ${text}\n\nИспользуйте /help для списка команд`);
      }
    }

    // Обработка callback от кнопок
    if (update.callback_query) {
      await handleCallback(update.callback_query);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Ошибка обработки webhook:', error);
    res.sendStatus(500);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Главная страница
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>HouseGram Bot</title>
        <style>
          body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; }
          h1 { color: #6366f1; }
          .status { background: #10b981; color: white; padding: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>🤖 HouseGram Bot</h1>
        <div class="status">✅ Бот работает</div>
        <h2>Информация</h2>
        <ul>
          <li>Webhook URL: ${WEBHOOK_URL}</li>
          <li>Uptime: ${Math.floor(process.uptime())} секунд</li>
        </ul>
        <h2>Endpoints</h2>
        <ul>
          <li>POST /webhook - Webhook для получения обновлений</li>
          <li>GET /health - Health check</li>
        </ul>
      </body>
    </html>
  `);
});

// Запуск сервера
app.listen(PORT, async () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
  
  // Установка webhook
  await setupWebhook();
  
  console.log('✅ Бот готов к работе!');
});

// Обработка ошибок
process.on('unhandledRejection', (error) => {
  console.error('❌ Необработанная ошибка:', error);
});
