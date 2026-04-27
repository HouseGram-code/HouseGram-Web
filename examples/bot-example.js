// HouseGram Bot API - Пример использования
// Простой Echo Bot

const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE'; // Получите токен от BotMaster
const API_URL = `https://housegram.vercel.app/api/bot/${BOT_TOKEN}`;

// Функция для отправки сообщения
async function sendMessage(chatId, text, replyMarkup = null) {
  const body = {
    chat_id: chatId,
    text: text
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const response = await fetch(`${API_URL}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  return await response.json();
}

// Функция для получения обновлений
async function getUpdates(offset = 0) {
  const response = await fetch(`${API_URL}/getUpdates?offset=${offset}`);
  const data = await response.json();
  return data.result || [];
}

// Функция для получения информации о боте
async function getMe() {
  const response = await fetch(`${API_URL}/getMe`);
  return await response.json();
}

// Обработчик команд
const commands = {
  '/start': async (chatId) => {
    await sendMessage(
      chatId,
      '👋 Привет! Я Echo Bot.\n\nОтправь мне любое сообщение, и я повторю его!',
      {
        inline_keyboard: [
          [
            { text: '🎮 Игры', callback_data: 'games' },
            { text: '⚙️ Настройки', callback_data: 'settings' }
          ],
          [
            { text: 'ℹ️ Помощь', callback_data: 'help' }
          ]
        ]
      }
    );
  },

  '/help': async (chatId) => {
    await sendMessage(
      chatId,
      `📖 Доступные команды:

/start - Начать работу с ботом
/help - Показать эту справку
/about - О боте
/echo <текст> - Повторить текст

Просто отправь мне любое сообщение, и я его повторю!`
    );
  },

  '/about': async (chatId) => {
    await sendMessage(
      chatId,
      '🤖 Echo Bot v1.0\n\nСоздан с помощью HouseGram Bot API\n\nРазработчик: @YourUsername'
    );
  }
};

// Обработчик callback от inline-кнопок
async function handleCallback(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  switch (data) {
    case 'games':
      await sendMessage(chatId, '🎮 Раздел игр в разработке!');
      break;
    case 'settings':
      await sendMessage(chatId, '⚙️ Настройки бота:\n\n• Язык: Русский\n• Режим: Echo');
      break;
    case 'help':
      await commands['/help'](chatId);
      break;
  }

  // Ответ на callback (убирает "часики" на кнопке)
  await fetch(`${API_URL}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQuery.id
    })
  });
}

// Основной цикл бота
async function main() {
  console.log('🤖 Запуск Echo Bot...');

  // Получаем информацию о боте
  const botInfo = await getMe();
  if (botInfo.ok) {
    console.log(`✅ Бот запущен: @${botInfo.result.username}`);
  } else {
    console.error('❌ Ошибка: Неверный токен');
    return;
  }

  let offset = 0;

  // Бесконечный цикл получения обновлений
  while (true) {
    try {
      const updates = await getUpdates(offset);

      for (const update of updates) {
        // Обработка сообщений
        if (update.message) {
          const chatId = update.message.chat.id;
          const text = update.message.text;

          console.log(`📨 Получено: "${text}" от ${chatId}`);

          // Проверяем команды
          if (commands[text]) {
            await commands[text](chatId);
          } else if (text.startsWith('/echo ')) {
            const echoText = text.substring(6);
            await sendMessage(chatId, echoText);
          } else {
            // Echo - повторяем сообщение
            await sendMessage(chatId, `Вы сказали: ${text}`);
          }
        }

        // Обработка callback от кнопок
        if (update.callback_query) {
          await handleCallback(update.callback_query);
        }

        // Обновляем offset
        offset = update.update_id + 1;
      }

      // Небольшая задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('❌ Ошибка:', error.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Запуск бота
main().catch(console.error);
