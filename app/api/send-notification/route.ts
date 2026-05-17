import { NextRequest, NextResponse } from 'next/server';
import { jsonError, rateLimit } from '@/lib/security';
import { getAdmin, verifyAuthToken } from '@/lib/firebaseAdmin';

/**
 * POST /api/send-notification — отправить web-push через FCM.
 *
 * Безопасность:
 *  - Принимаются только запросы с одним из двух валидных способов авторизации:
 *      1) внутренний серверный ключ (Bearer <INTERNAL_API_KEY>) для
 *         собственных серверных задач;
 *      2) Firebase ID-токен пользователя — для отправки уведомлений
 *         себе или другим только если задано INTERNAL_API_KEY (без него
 *         любой залогиненный мог бомбить пушами кого угодно — мы это
 *         больше не разрешаем).
 *  - Если INTERNAL_API_KEY не задан и нет валидного ID-токена —
 *    отказываем. Раньше отсутствие ключа открывало эндпоинт всему миру.
 *  - Rate-limit 60 запросов/мин с одного IP.
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { key: 'send-notification', limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const apiKey = process.env.INTERNAL_API_KEY;
  const auth = request.headers.get('authorization');

  // Способ 1: внутренний ключ.
  let serverAuthorized = false;
  if (apiKey && auth === `Bearer ${apiKey}`) serverAuthorized = true;

  // Способ 2: пользовательский Firebase ID-токен.
  let userId: string | null = null;
  if (!serverAuthorized) {
    userId = await verifyAuthToken(auth);
    if (!userId) return jsonError('Unauthorized', 401);
  }

  try {
    const admin = getAdmin();
    const { token, title, body, data } = (await request.json()) as {
      token?: string;
      title?: string;
      body?: string;
      data?: Record<string, string>;
    };

    if (!token || typeof token !== 'string') {
      return jsonError('FCM token is required', 400);
    }

    const message = {
      token,
      notification: {
        title: typeof title === 'string' ? title.slice(0, 200) : 'HouseGram',
        body: typeof body === 'string' ? body.slice(0, 1000) : 'Новое сообщение',
      },
      data: (data && typeof data === 'object' ? data : {}) as Record<string, string>,
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          requireInteraction: false,
          vibrate: [200, 100, 200],
        },
        fcmOptions: { link: '/' },
      },
    };

    const response = await admin.messaging().send(message);
    return NextResponse.json({ success: true, messageId: response });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to send notification';
    return jsonError(msg, 500);
  }
}
