import { NextRequest, NextResponse } from 'next/server';

// ============================================
// TELEGRAM STARS — оплата звёздами Telegram
// Нужен только токен бота из @BotFather!
// Никакой регистрации, никаких документов.
//
// Добавьте в .env.local:
//   TELEGRAM_BOT_TOKEN=123456789:AAF...
//
// Получить токен:
//   1. Открой @BotFather в Telegram
//   2. /newbot → придумай имя → получи токен
//   3. Зарегистрируй webhook бота:
//      GET https://api.telegram.org/bot{TOKEN}/setWebhook
//         ?url=https://ТВОЙ_ДОМЕН/api/payment/telegram-stars/webhook
// ============================================

// Цены в Telegram Stars (XTR) для каждого пакета молний
const STARS_PRICES: Record<number, number> = {
  25:     25,
  50:     50,
  75:     75,
  100:    99,
  250:    249,
  500:    499,
  1000:   990,
  2500:   2450,
  10000:  9900,
  50000:  48000,
  150000: 140000,
};

export async function POST(req: NextRequest) {
  try {
    const { stars, userId } = await req.json();

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'Telegram Bot Token не настроен. Добавьте TELEGRAM_BOT_TOKEN в .env.local' },
        { status: 501 }
      );
    }

    if (!userId || !stars) {
      return NextResponse.json({ error: 'Недостаточно данных' }, { status: 400 });
    }

    const starsPrice = STARS_PRICES[stars];
    if (!starsPrice) {
      return NextResponse.json({ error: 'Неверное количество молний' }, { status: 400 });
    }

    // payload кодирует userId и stars — вернётся в successful_payment
    const payload = `${userId}__${stars}__${Date.now()}`;

    // createInvoiceLink — НЕ нужен provider_token для цифровых товаров!
    const response = await fetch(
      `https://api.telegram.org/bot${token}/createInvoiceLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:          `${stars} молний HouseGram`,
          description:    `Покупка ${stars} молний для отправки подарков в HouseGram`,
          payload,
          currency:       'XTR',
          prices:         [{ label: `${stars} молний`, amount: starsPrice }],
          provider_token: '',   // пустой для цифровых товаров — это правильно!
        }),
      }
    );

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram createInvoiceLink error:', data);
      return NextResponse.json(
        { error: data.description || 'Ошибка Telegram API' },
        { status: 500 }
      );
    }

    console.log(`✅ Telegram Stars invoice created: ${stars} stars → ${starsPrice} XTR for ${userId}`);

    return NextResponse.json({
      paymentUrl: data.result,   // ссылка вида https://t.me/$invoice...
      starsPrice,
      payload,
    });

  } catch (error) {
    console.error('Telegram Stars create error:', error);
    return NextResponse.json({ error: 'Ошибка создания платежа' }, { status: 500 });
  }
}
