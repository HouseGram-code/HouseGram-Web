import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { system, stars, price, userId } = await req.json();

    if (!userId || !stars || !price) {
      return NextResponse.json({ error: 'Недостаточно данных' }, { status: 400 });
    }

    // ============================================
    // ROBOKASSA — работает без регистрации ИП/ООО
    // в тестовом режиме (IsTest=1).
    // Зарегистрируйтесь на robokassa.ru и добавьте
    // в .env.local:
    //   ROBOKASSA_LOGIN=ваш_логин
    //   ROBOKASSA_PASSWORD1=пароль_1
    //   ROBOKASSA_PASSWORD2=пароль_2
    //   ROBOKASSA_TEST_MODE=true   (убрать для боевого)
    // ============================================
    if (system === 'robokassa') {
      const merchantLogin = process.env.ROBOKASSA_LOGIN;
      const password1     = process.env.ROBOKASSA_PASSWORD1;
      const isTest        = process.env.ROBOKASSA_TEST_MODE === 'true' ? 1 : 0;

      if (!merchantLogin || !password1) {
        return NextResponse.json(
          { error: 'Robokassa не настроена. Добавьте ROBOKASSA_LOGIN и ROBOKASSA_PASSWORD1 в .env.local' },
          { status: 501 }
        );
      }

      const outSum     = price.toString();
      const invId      = String(Date.now()).slice(-9);
      const description = `Покупка ${stars} молний HouseGram`;

      // Подпись: MD5(Login:OutSum:InvId:Password1:Shp_stars=N:Shp_userId=U)
      // Параметры Shp_ перечисляются строго в алфавитном порядке
      const signStr = `${merchantLogin}:${outSum}:${invId}:${password1}:Shp_stars=${stars}:Shp_userId=${userId}`;
      const signature = crypto.createHash('md5').update(signStr).digest('hex');

      const params = new URLSearchParams({
        MerchantLogin:   merchantLogin,
        OutSum:          outSum,
        InvId:           invId,
        Description:     description,
        SignatureValue:  signature,
        Shp_stars:       String(stars),
        Shp_userId:      userId,
        IsTest:          String(isTest),
      });

      const paymentUrl = `https://auth.robokassa.ru/Merchant/Index.aspx?${params.toString()}`;

      console.log(`✅ Robokassa payment created: ${stars} stars for ${userId}, invId=${invId}, isTest=${isTest}`);

      return NextResponse.json({ paymentUrl, invId });
    }

    // ============================================
    // YOOMONEY QUICKPAY — БЕЗ API ключа!
    // Нужен только бесплатный кошелёк ЮМани.
    // Добавьте в .env.local:
    //   YOOMONEY_WALLET=41001XXXXXXXXX  (номер кошелька)
    //   YOOMONEY_SECRET=ваш_секрет       (из настроек кошелька →
    //     yoomoney.ru/transfer/myservices/http-notification)
    // ============================================
    if (system === 'yoomoney') {
      const wallet = process.env.YOOMONEY_WALLET;
      if (!wallet) {
        return NextResponse.json(
          { error: 'YooMoney кошелёк не настроен. Добавьте YOOMONEY_WALLET в .env.local' },
          { status: 501 }
        );
      }

      // label = userId__stars__timestamp (разделитель __ для надёжности)
      const label = `${userId}__${stars}__${Date.now()}`;
      const comment = encodeURIComponent(`Покупка ${stars} молний HouseGram`);

      // Ссылка работает без API ключа — просто редирект на ЮМани
      const paymentUrl = `https://yoomoney.ru/to/${wallet}/${price}?label=${encodeURIComponent(label)}&targets=${comment}`;

      console.log(`✅ YooMoney payment link created: ${stars} stars for ${userId}, label=${label}`);
      return NextResponse.json({ paymentUrl, label });
    }

    // ============================================
    // CRYPTOMUS — крипто-оплата без документов
    // Зарегистрируйтесь на cryptomus.com и добавьте
    //   CRYPTOMUS_MERCHANT_ID=...
    //   CRYPTOMUS_API_KEY=...
    // ============================================
    if (system === 'cryptomus') {
      const MERCHANT_ID = process.env.CRYPTOMUS_MERCHANT_ID;
      const API_KEY     = process.env.CRYPTOMUS_API_KEY;

      if (!MERCHANT_ID || !API_KEY) {
        return NextResponse.json(
          { error: 'Cryptomus не настроен. Добавьте CRYPTOMUS_MERCHANT_ID и CRYPTOMUS_API_KEY в .env.local' },
          { status: 501 }
        );
      }

      const origin = process.env.APP_URL || req.headers.get('origin') || '';
      const paymentData = {
        amount:          price.toString(),
        currency:        'RUB',
        order_id:        `stars_${userId}_${Date.now()}`,
        url_callback:    `${origin}/api/payment/webhook`,
        url_success:     `${origin}/payment/success`,
        url_return:      `${origin}/`,
        additional_data: JSON.stringify({ userId, stars }),
        lifetime:        3600,
        is_payment_multiple: false,
      };

      const jsonData  = JSON.stringify(paymentData);
      const base64    = Buffer.from(jsonData).toString('base64');
      const sign      = crypto.createHash('md5').update(base64 + API_KEY).digest('hex');

      const response = await fetch('https://api.cryptomus.com/v1/payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', merchant: MERCHANT_ID, sign },
        body:    jsonData,
      });

      const result = await response.json();
      if (!response.ok || result.state !== 0) {
        return NextResponse.json({ error: result.message || 'Ошибка Cryptomus' }, { status: 500 });
      }

      return NextResponse.json({ paymentUrl: result.result.url, paymentId: result.result.uuid });
    }

    // ============================================
    // FREEKASSA — физ. лицо БЕЗ ИП/ООО!
    // СБП, Сбербанк Online, карты, ЮМани и др.
    // Регистрация: freekassa.ru → бесплатно, для физ. лиц
    // Добавьте в .env.local:
    //   FREEKASSA_SHOP_ID=12345
    //   FREEKASSA_SECRET1=секретное_слово_1
    //   FREEKASSA_SECRET2=секретное_слово_2
    // ============================================
    if (system === 'freekassa') {
      const shopId  = process.env.FREEKASSA_SHOP_ID;
      const secret1 = process.env.FREEKASSA_SECRET1;

      if (!shopId || !secret1) {
        return NextResponse.json(
          { error: 'FreeKassa не настроена. Добавьте FREEKASSA_SHOP_ID и FREEKASSA_SECRET1 в .env.local' },
          { status: 501 }
        );
      }

      // orderId кодирует userId и stars для webhook
      const orderId   = `${userId}__${stars}__${Date.now()}`;
      const currency  = 'RUB';

      // Подпись: MD5(shopId:amount:secret1:currency:orderId)
      const signStr   = `${shopId}:${price}:${secret1}:${currency}:${orderId}`;
      const signature = crypto.createHash('md5').update(signStr).digest('hex');

      // us_* параметры вернутся в webhook как есть
      const params = new URLSearchParams({
        m:          shopId,
        oc:         orderId,
        s:          signature,
        sum:        price.toString(),
        currency,
        lang:       'ru',
        us_userId:  userId,
        us_stars:   String(stars),
      });

      const paymentUrl = `https://pay.freekassa.ru/?${params.toString()}`;

      console.log(`✅ FreeKassa payment link created: ${stars} stars for ${userId}, orderId=${orderId}`);
      return NextResponse.json({ paymentUrl, orderId });
    }

    return NextResponse.json({ error: 'Неизвестная платёжная система' }, { status: 400 });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: 'Ошибка создания платежа' }, { status: 500 });
  }
}
