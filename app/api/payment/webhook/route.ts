import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, increment, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Webhook для обработки подтверждений платежей
// Настройте URL webhook в панели платежной системы:
// https://yourdomain.com/api/payment/webhook

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let data: any;

    // Парсинг данных в зависимости от типа
    if (contentType.includes('application/json')) {
      data = await req.json();
    } else {
      // Для form-urlencoded (Robokassa)
      const text = await req.text();
      data = Object.fromEntries(new URLSearchParams(text));
    }

    // ============================================
    // CRYPTOMUS WEBHOOK (Приоритет - самый простой)
    // ============================================
    if (data.status && data.order_id && data.order_id.startsWith('stars_')) {
      console.log('📥 Cryptomus webhook received:', data.status);

      // Проверка подписи (опционально)
      // const sign = req.headers.get('sign');
      // if (sign) {
      //   const expectedSign = crypto
      //     .createHash('md5')
      //     .update(Buffer.from(JSON.stringify(data)).toString('base64') + process.env.CRYPTOMUS_API_KEY)
      //     .digest('hex');
      //   if (sign !== expectedSign) {
      //     return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      //   }
      // }

      if (data.status === 'paid' || data.status === 'paid_over') {
        try {
          const additionalData = JSON.parse(data.additional_data || '{}');
          const { userId, stars } = additionalData;

          if (!userId || !stars) {
            console.error('❌ Missing data in Cryptomus webhook:', data);
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
          }

          // Начисляем молнии
          await updateDoc(doc(db, 'users', userId), {
            stars: increment(parseInt(stars))
          });

          // Сохраняем транзакцию
          await setDoc(doc(db, 'transactions', data.uuid), {
            userId,
            stars: parseInt(stars),
            amount: parseFloat(data.amount),
            currency: data.currency,
            status: 'completed',
            paymentSystem: 'cryptomus',
            paymentId: data.uuid,
            orderId: data.order_id,
            createdAt: serverTimestamp()
          });

          console.log(`✅ Cryptomus payment succeeded: ${stars} stars for user ${userId}`);
          return NextResponse.json({ success: true });
        } catch (error) {
          console.error('❌ Error processing Cryptomus payment:', error);
          return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
        }
      }

      if (data.status === 'cancel' || data.status === 'fail') {
        console.log(`❌ Cryptomus payment ${data.status}: ${data.order_id}`);
        return NextResponse.json({ success: true });
      }

      // Для других статусов (pending, process, etc.)
      console.log(`⏳ Cryptomus payment status: ${data.status}`);
      return NextResponse.json({ success: true });
    }

    // ============================================
    // YOOKASSA WEBHOOK
    // ============================================
    if (data.event && data.event.startsWith('payment.')) {
      // Проверка подписи (опционально, но рекомендуется)
      // const signature = req.headers.get('x-yookassa-signature');
      // if (!verifyYooKassaSignature(data, signature)) {
      //   return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      // }

      if (data.event === 'payment.succeeded') {
        const { userId, stars } = data.object.metadata;
        
        if (!userId || !stars) {
          console.error('Missing metadata in payment:', data);
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
        }

        // Начисляем молнии пользователю
        await updateDoc(doc(db, 'users', userId), {
          stars: increment(parseInt(stars))
        });

        // Сохраняем транзакцию
        await setDoc(doc(db, 'transactions', data.object.id), {
          userId,
          stars: parseInt(stars),
          amount: parseFloat(data.object.amount.value),
          currency: data.object.amount.currency,
          status: 'completed',
          paymentSystem: 'yookassa',
          paymentId: data.object.id,
          createdAt: serverTimestamp()
        });

        console.log(`✅ Payment succeeded: ${stars} stars for user ${userId}`);
        return NextResponse.json({ success: true });
      }

      if (data.event === 'payment.canceled') {
        console.log(`❌ Payment canceled: ${data.object.id}`);
        return NextResponse.json({ success: true });
      }
    }

    // ============================================
    // STRIPE WEBHOOK
    // ============================================
    if (data.type && data.type.startsWith('checkout.session.')) {
      // Проверка подписи Stripe
      // const signature = req.headers.get('stripe-signature');
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // const event = stripe.webhooks.constructEvent(
      //   await req.text(),
      //   signature,
      //   process.env.STRIPE_WEBHOOK_SECRET
      // );

      if (data.type === 'checkout.session.completed') {
        const session = data.data.object;
        const { userId, stars } = session.metadata;

        if (!userId || !stars) {
          console.error('Missing metadata in Stripe session:', session);
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
        }

        // Начисляем молнии
        await updateDoc(doc(db, 'users', userId), {
          stars: increment(parseInt(stars))
        });

        // Сохраняем транзакцию
        await setDoc(doc(db, 'transactions', session.id), {
          userId,
          stars: parseInt(stars),
          amount: session.amount_total / 100,
          currency: session.currency,
          status: 'completed',
          paymentSystem: 'stripe',
          paymentId: session.id,
          createdAt: serverTimestamp()
        });

        console.log(`✅ Stripe payment succeeded: ${stars} stars for user ${userId}`);
        return NextResponse.json({ success: true });
      }
    }

    // ============================================
    // ROBOKASSA WEBHOOK
    // ============================================
    if (data.OutSum && data.InvId && data.SignatureValue) {
      // Проверка подписи
      // const crypto = require('crypto');
      // const password2 = process.env.ROBOKASSA_PASSWORD2!;
      // const signatureStr = `${data.OutSum}:${data.InvId}:${password2}:Shp_userId=${data.Shp_userId}:Shp_stars=${data.Shp_stars}`;
      // const expectedSignature = crypto.createHash('md5').update(signatureStr).digest('hex').toUpperCase();
      
      // if (data.SignatureValue.toUpperCase() !== expectedSignature) {
      //   return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      // }

      const userId = data.Shp_userId;
      const stars = parseInt(data.Shp_stars);

      if (!userId || !stars) {
        console.error('Missing custom parameters in Robokassa:', data);
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
      }

      // Начисляем молнии
      await updateDoc(doc(db, 'users', userId), {
        stars: increment(stars)
      });

      // Сохраняем транзакцию
      await setDoc(doc(db, 'transactions', data.InvId), {
        userId,
        stars,
        amount: parseFloat(data.OutSum),
        currency: 'RUB',
        status: 'completed',
        paymentSystem: 'robokassa',
        paymentId: data.InvId,
        createdAt: serverTimestamp()
      });

      console.log(`✅ Robokassa payment succeeded: ${stars} stars for user ${userId}`);
      
      // Robokassa требует специальный ответ
      return new NextResponse(`OK${data.InvId}`, { status: 200 });
    }

    console.log('Unknown webhook format:', data);
    return NextResponse.json({ error: 'Unknown format' }, { status: 400 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// GET endpoint для проверки статуса webhook
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Payment webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
