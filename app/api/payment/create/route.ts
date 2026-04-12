import { NextRequest, NextResponse } from 'next/server';

// Этот файл - шаблон для интеграции платежной системы
// Раскомментируйте нужную систему и добавьте свои ключи в .env.local

export async function POST(req: NextRequest) {
  try {
    const { system, stars, price, priceUSD, userId } = await req.json();

    // Валидация
    if (!userId || !stars || !price) {
      return NextResponse.json(
        { error: 'Недостаточно данных' },
        { status: 400 }
      );
    }

    // ============================================
    // YOOKASSA (ЮKassa) - Для России
    // ============================================
    if (system === 'yookassa') {
      // Установите: npm install @a2seven/yoo-checkout
      // const { YooCheckout } = require('@a2seven/yoo-checkout');
      
      // const checkout = new YooCheckout({
      //   shopId: process.env.YOOKASSA_SHOP_ID!,
      //   secretKey: process.env.YOOKASSA_SECRET_KEY!
      // });

      // const payment = await checkout.createPayment({
      //   amount: {
      //     value: price.toString(),
      //     currency: 'RUB'
      //   },
      //   confirmation: {
      //     type: 'redirect',
      //     return_url: `${req.headers.get('origin')}/payment/success`
      //   },
      //   capture: true,
      //   description: `Покупка ${stars} молний HouseGram`,
      //   metadata: {
      //     userId,
      //     stars: stars.toString()
      //   }
      // });

      // return NextResponse.json({
      //   paymentUrl: payment.confirmation.confirmation_url,
      //   paymentId: payment.id
      // });

      return NextResponse.json(
        { error: 'YooKassa не настроена. См. PAYMENT_INTEGRATION.md' },
        { status: 501 }
      );
    }

    // ============================================
    // STRIPE - Для международных платежей
    // ============================================
    if (system === 'stripe') {
      // Установите: npm install stripe
      // const Stripe = require('stripe');
      // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      //   apiVersion: '2023-10-16'
      // });

      // const session = await stripe.checkout.sessions.create({
      //   payment_method_types: ['card'],
      //   line_items: [{
      //     price_data: {
      //       currency: 'usd',
      //       product_data: {
      //         name: `${stars} молний HouseGram`,
      //         description: 'Внутренняя валюта для отправки подарков'
      //       },
      //       unit_amount: Math.round(priceUSD * 100)
      //     },
      //     quantity: 1
      //   }],
      //   mode: 'payment',
      //   success_url: `${req.headers.get('origin')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      //   cancel_url: `${req.headers.get('origin')}/stars`,
      //   metadata: {
      //     userId,
      //     stars: stars.toString()
      //   }
      // });

      // return NextResponse.json({
      //   paymentUrl: session.url,
      //   sessionId: session.id
      // });

      return NextResponse.json(
        { error: 'Stripe не настроен. См. PAYMENT_INTEGRATION.md' },
        { status: 501 }
      );
    }

    // ============================================
    // ROBOKASSA - Альтернатива для России
    // ============================================
    if (system === 'robokassa') {
      // const crypto = require('crypto');
      
      // const merchantLogin = process.env.ROBOKASSA_LOGIN!;
      // const password1 = process.env.ROBOKASSA_PASSWORD1!;
      // const outSum = price.toString();
      // const invId = Date.now().toString();
      // const description = `Покупка ${stars} молний HouseGram`;

      // // Генерация подписи
      // const signatureStr = `${merchantLogin}:${outSum}:${invId}:${password1}`;
      // const signature = crypto.createHash('md5').update(signatureStr).digest('hex');

      // const paymentUrl = 
      //   `https://auth.robokassa.ru/Merchant/Index.aspx?` +
      //   `MerchantLogin=${merchantLogin}&` +
      //   `OutSum=${outSum}&` +
      //   `InvId=${invId}&` +
      //   `Description=${encodeURIComponent(description)}&` +
      //   `SignatureValue=${signature}&` +
      //   `Shp_userId=${userId}&` +
      //   `Shp_stars=${stars}`;

      // return NextResponse.json({
      //   paymentUrl,
      //   invId
      // });

      return NextResponse.json(
        { error: 'Robokassa не настроена. См. PAYMENT_INTEGRATION.md' },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { error: 'Неизвестная платежная система' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Ошибка создания платежа' },
      { status: 500 }
    );
  }
}
