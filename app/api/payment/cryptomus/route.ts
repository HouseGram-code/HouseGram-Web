import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Cryptomus - простая платежная система БЕЗ документов
// Регистрация: https://cryptomus.com/

const MERCHANT_ID = process.env.CRYPTOMUS_MERCHANT_ID || '';
const API_KEY = process.env.CRYPTOMUS_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { stars, price, userId } = await req.json();

    if (!MERCHANT_ID || !API_KEY) {
      return NextResponse.json(
        { error: 'Cryptomus не настроен. Добавьте CRYPTOMUS_MERCHANT_ID и CRYPTOMUS_API_KEY в .env.local' },
        { status: 500 }
      );
    }

    if (!userId || !stars || !price) {
      return NextResponse.json(
        { error: 'Недостаточно данных' },
        { status: 400 }
      );
    }

    // Данные для платежа
    const paymentData = {
      amount: price.toString(),
      currency: 'RUB',
      order_id: `stars_${userId}_${Date.now()}`,
      url_callback: `${process.env.APP_URL || req.headers.get('origin')}/api/payment/webhook`,
      url_success: `${process.env.APP_URL || req.headers.get('origin')}/payment/success`,
      url_return: `${process.env.APP_URL || req.headers.get('origin')}/stars`,
      additional_data: JSON.stringify({ 
        userId, 
        stars,
        timestamp: Date.now()
      }),
      lifetime: 3600, // 1 час на оплату
      is_payment_multiple: false
    };

    // Генерация подписи для Cryptomus
    const jsonData = JSON.stringify(paymentData);
    const base64Data = Buffer.from(jsonData).toString('base64');
    const sign = crypto
      .createHash('md5')
      .update(base64Data + API_KEY)
      .digest('hex');

    console.log('Creating Cryptomus payment:', {
      orderId: paymentData.order_id,
      amount: paymentData.amount,
      stars
    });

    // Запрос к API Cryptomus
    const response = await fetch('https://api.cryptomus.com/v1/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant': MERCHANT_ID,
        'sign': sign
      },
      body: jsonData
    });

    const result = await response.json();

    if (!response.ok || result.state !== 0) {
      console.error('Cryptomus API error:', result);
      return NextResponse.json(
        { error: result.message || 'Ошибка создания платежа' },
        { status: 500 }
      );
    }

    console.log('✅ Cryptomus payment created:', result.result.uuid);

    return NextResponse.json({
      paymentUrl: result.result.url,
      paymentId: result.result.uuid,
      orderId: paymentData.order_id
    });

  } catch (error) {
    console.error('Cryptomus payment creation error:', error);
    return NextResponse.json(
      { error: 'Ошибка создания платежа' },
      { status: 500 }
    );
  }
}

// GET endpoint для проверки настройки
export async function GET() {
  const isConfigured = !!(MERCHANT_ID && API_KEY);
  
  return NextResponse.json({
    status: isConfigured ? 'configured' : 'not_configured',
    message: isConfigured 
      ? 'Cryptomus настроен и готов к работе' 
      : 'Добавьте CRYPTOMUS_MERCHANT_ID и CRYPTOMUS_API_KEY в .env.local',
    merchant_id: MERCHANT_ID ? '***' + MERCHANT_ID.slice(-4) : 'не установлен'
  });
}
