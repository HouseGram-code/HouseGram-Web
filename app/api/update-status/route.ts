import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { jsonError, rateLimit } from '@/lib/security';
import { verifyAuthToken } from '@/lib/firebaseAdmin';

/**
 * POST /api/update-status — обновить online/offline статус пользователя.
 *
 * Безопасность:
 *  - Требует валидный Firebase ID-токен в заголовке Authorization.
 *  - userId в теле должен совпадать с uid из токена. Иначе раньше любой
 *    мог менять статус любому пользователю (account spoofing).
 *  - Rate-limit 30 запросов/мин с одного IP.
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { key: 'update-status', limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return jsonError('Invalid body', 400);

    const { userId, status, lastSeen, idToken } = body as {
      userId?: string;
      status?: string;
      lastSeen?: string | number;
      idToken?: string;
    };

    // sendBeacon не поддерживает кастомные заголовки, поэтому также
    // принимаем idToken в теле как fallback. Это безопасно — токен
    // одноразово проверяется на сервере и не сохраняется.
    let uid = await verifyAuthToken(request.headers.get('authorization'));
    if (!uid && idToken) {
      uid = await verifyAuthToken(`Bearer ${idToken}`);
    }
    if (!uid) return jsonError('Unauthorized', 401);

    if (!userId) return jsonError('userId is required', 400);
    if (userId !== uid) return jsonError('Forbidden', 403);

    const safeStatus = status === 'online' ? 'online' : 'offline';

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status: safeStatus,
      lastSeen: lastSeen ? new Date(lastSeen) : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, userId, status: safeStatus });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update status';
    return jsonError(msg, 500);
  }
}
