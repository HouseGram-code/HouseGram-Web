/**
 * AI Bot Helper - Бесплатный AI помощник для создания ботов
 * Использует Puter.js AI (бесплатно, без ключа!)
 */

/**
 * Генерация кода бота с помощью Puter AI
 */
export async function generateBotCode(description: string): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    // Используем Puter AI - бесплатный AI без ключа
    const prompt = `Создай код JavaScript бота для HouseGram на основе описания: "${description}"

Требования:
1. Используй HouseGram Bot API
2. Добавь обработку команд /start, /help
3. Добавь основной функционал по описанию
4. Используй async/await
5. Добавь комментарии на русском

Код должен быть готов к запуску.`;

    // Puter AI API (бесплатный, без ключа)
    const response = await fetch('https://api.puter.com/drivers/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interface: 'puter-chat-completion',
        driver: 'openai-completion',
        method: 'complete',
        args: {
          messages: [
            {
              role: 'system',
              content: 'Ты опытный разработчик ботов. Создаешь чистый, понятный код с комментариями на русском.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          max_tokens: 1500
        }
      })
    });

    if (!response.ok) {
      throw new Error('Puter AI недоступен');
    }

    const result = await response.json();
    const generatedCode = result.message?.content || result.choices?.[0]?.message?.content || '';

    if (generatedCode) {
      return {
        success: true,
        code: generatedCode
      };
    }

    throw new Error('Не удалось сгенерировать код');
  } catch (error) {
    console.error('Error generating bot code:', error);
    
    // Возвращаем умный шаблон при ошибке
    const smartTemplate = generateSmartTemplate(description);
    
    return {
      success: true,
      code: smartTemplate
    };
  }
}

/**
 * Умная генерация шаблона на основе описания
 */
function generateSmartTemplate(description: string): string {
  const lowerDesc = description.toLowerCase();
  
  // Определяем тип бота по ключевым словам
  const isWeatherBot = lowerDesc.includes('погод') || lowerDesc.includes('weather');
  const isReminderBot = lowerDesc.includes('напомина') || lowerDesc.includes('reminder');
  const isQuizBot = lowerDesc.includes('викторин') || lowerDesc.includes('quiz') || lowerDesc.includes('вопрос');
  const isCalculatorBot = lowerDesc.includes('калькулятор') || lowerDesc.includes('calculator') || lowerDesc.includes('считать');
  
  if (isWeatherBot) {
    return `// ${description}
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
const API_URL = \`https://housegram.vercel.app/api/bot/\${BOT_TOKEN}\`;

async function sendMessage(chatId, text) {
  await fetch(\`\${API_URL}/sendMessage\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

async function getUpdates(offset = 0) {
  const response = await fetch(\`\${API_URL}/getUpdates?offset=\${offset}\`);
  const data = await response.json();
  return data.result || [];
}

const commands = {
  '/start': async (chatId) => {
    await sendMessage(chatId, '🌤️ Привет! Я бот погоды. Отправь название города!');
  },
  '/help': async (chatId) => {
    await sendMessage(chatId, '📖 Отправь название города для прогноза погоды');
  }
};

let offset = 0;
while (true) {
  const updates = await getUpdates(offset);
  for (const update of updates) {
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      if (commands[text]) {
        await commands[text](chatId);
      } else {
        await sendMessage(chatId, \`🌤️ Погода в \${text}: 22°C, Солнечно\`);
      }
    }
    offset = update.update_id + 1;
  }
  await new Promise(resolve => setTimeout(resolve, 1000));
}`;
  }
  
  // Универсальный шаблон
  return `// ${description}
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
const API_URL = \`https://housegram.vercel.app/api/bot/\${BOT_TOKEN}\`;

async function sendMessage(chatId, text) {
  await fetch(\`\${API_URL}/sendMessage\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

async function getUpdates(offset = 0) {
  const response = await fetch(\`\${API_URL}/getUpdates?offset=\${offset}\`);
  const data = await response.json();
  return data.result || [];
}

const commands = {
  '/start': async (chatId) => {
    await sendMessage(chatId, '👋 Привет! Я бот для: ${description}');
  },
  '/help': async (chatId) => {
    await sendMessage(chatId, '📖 Используй /start для начала');
  }
};

let offset = 0;
console.log('🤖 Бот запущен!');

while (true) {
  try {
    const updates = await getUpdates(offset);
    for (const update of updates) {
      if (update.message) {
        const chatId = update.message.chat.id;
        const text = update.message.text;
        if (commands[text]) {
          await commands[text](chatId);
        } else {
          await sendMessage(chatId, \`Вы написали: \${text}\`);
        }
      }
      offset = update.update_id + 1;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('Ошибка:', error);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}`;
}

/**
 * Получить предложения для улучшения бота
 */
export async function getBotSuggestions(description: string): Promise<string[]> {
  return [
    '💡 Добавь inline-кнопки для быстрых действий',
    '📊 Сохраняй статистику использования',
    '🔔 Добавь систему уведомлений',
    '🎨 Используй эмодзи для лучшего UX',
    '⚡ Переключись на webhook для быстрой работы'
  ];
}
