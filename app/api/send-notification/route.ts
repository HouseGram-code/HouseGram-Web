import { NextRequest, NextResponse } from 'next/server';
import { jsonError, rateLimit } from '@/lib/security';
import { verifyAuthToken } from '@/lib/firebaseAdmin';

/**
 * POST /api/send-notification — отправка web-push уведомлений.
 *
 * Безопасность:
 *  - Запрос обязан прийти с валидным Firebase ID-токеном (Authorization:
 *    Bearer <token>). Токен проверяется по публичным JWK Google — без
 *    серверных ключей.
 *  - Rate-limit 60/мин с одного IP.
 *
 * Реализация отправки FCM:
 *  - Если задан FCM_SERVER_KEY (legacy ключ из Firebase Console → Cloud
 *    Messaging → "Cloud Messaging API (Legacy)"), отправляем через
 *    https://fcm.googleapis.com/fcm/send. Это просто и не требует
 *    сервисного аккаунта.
 *  - Если ключа нет — возвращаем 503, чтобы клиент мог fallback'ом
 *    показать локальное уведомление через onForegroundMessage.
 *
 * Никаких приватных ключей или JSON-credentials в коде нет.
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { key: 'send-notification', limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const uid = await verifyAuthToken(request.headers.get('authorization'));
  if (!uid) return jsonError('Unauthorized', 401);

  try {
    const { token, title, body, data } = (await request.json()) as {
      token?: string;
      title?: string;
      body?: string;
      data?: Record<string, string>;
    };

    if (!token || typeof token !== 'string') {
      return jsonError('FCM token is required', 400);
    }

    const fcmServerKey = process.env.FCM_SERVER_KEY;
    if (!fcmServerKey) {
      // Эндпоинт публичен по дизайну для совместимости с клиентом, но
      // отправлять push некем. Возвращаем 503 — клиент тихо игнорирует.
      return NextResponse.json(
        {
          ok: false,
          warning:
            'FCM_SERVER_KEY is not configured on the server, push notifications are disabled.',
        },
        { status: 503 },
      );
    }

    const safeTitle =
      typeof title === 'string' ? title.slice(0, 200) : 'HouseGram';
    const safeBody =
      typeof body === 'string' ? body.slice(0, 1000) : 'Новое сообщение';
    const safeData =
      data && typeof data === 'object'
        ? Object.fromEntries(
            Object.entries(data).filter(([, v]) => typeof v === 'string'),
          )
        : {};

    const fcmPayload = {
      to: token,
      notification: {
        title: safeTitle,
        body: safeBody,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        click_action: '/',
      },
      data: safeData,
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          requireInteraction: false,
          vibrate: [200, 100, 200],
        },
        fcm_options: { link: '/' },
      },
    };

    const fcmResp = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${fcmServerKey}`,
      },
      body: JSON.stringify(fcmPayload),
      signal: AbortSignal.timeout(15_000),
    });

    if (!fcmResp.ok) {
      const text = await fcmResp.text().catch(() => '');
      return jsonError(`FCM error: ${fcmResp.status} ${text}`.trim(), 502);
    }

    const result = await fcmResp.json().catch(() => ({}));
    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to send notification';
    return jsonError(msg, 500);
  }
}
