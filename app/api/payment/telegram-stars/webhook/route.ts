import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Webhook для обработки обновлений Telegram бота:
// 1. pre_checkout_query  — подтверждаем оплату (обязательно в течение 10 сек)
// 2. successful_payment  — начисляем молнии пользователю

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    // ── 1. Pre-checkout query: всегда подтверждаем ──────────────────────────
    if (update.pre_checkout_query) {
      const pcq = update.pre_checkout_query;
      console.log('📥 Telegram pre_checkout_query:', pcq.id, 'payload:', pcq.invoice_payload);

      await fetch(`https://api.telegram.org/bot${token}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pre_checkout_query_id: pcq.id,
          ok: true,
        }),
      });

      return NextResponse.json({ ok: true });
    }

    // ── 2. Successful payment: начисляем молнии ──────────────────────────────
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const payload  = payment.invoice_payload as string;

      console.log('📥 Telegram successful_payment, payload:', payload);

      // payload = userId__stars__timestamp
      const parts  = payload.split('__');
      const userId = parts[0];
      const stars  = parseInt(parts[1]);

      if (!userId || !stars || isNaN(stars)) {
        console.error('❌ Telegram Stars: invalid payload:', payload);
        return NextResponse.json({ ok: true }); // Telegram не ждёт ошибок
      }

      // Начисляем молнии
      await updateDoc(doc(db, 'users', userId), {
        stars: increment(stars),
      });

      // Сохраняем транзакцию
      const txId = payment.telegram_payment_charge_id || payload;
      await setDoc(doc(db, 'transactions', txId), {
        userId,
        stars,
        amount:             payment.total_amount,
        currency:           payment.currency,  // XTR
        status:             'completed',
        paymentSystem:      'telegram-stars',
        paymentId:          txId,
        payload,
        createdAt:          serverTimestamp(),
      });

      console.log(`✅ Telegram Stars payment: +${stars} молний → user ${userId}`);

      // Опционально: отправляем сообщение пользователю в Telegram
      const tgUserId = update.message.from?.id;
      if (tgUserId) {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: tgUserId,
            text: `⚡ Вы получили ${stars} молний HouseGram!\n\nОткройте приложение чтобы использовать их.`,
          }),
        });
      }

      return NextResponse.json({ ok: true });
    }

    // Прочие обновления игнорируем
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Telegram Stars webhook error:', error);
    return NextResponse.json({ ok: true }); // Всегда 200 для Telegram
  }
}

// GET — для проверки что webhook работает
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Telegram Stars webhook is active',
    setup: 'Зарегистрируйте webhook: https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://ДОМЕН/api/payment/telegram-stars/webhook',
  });
}
