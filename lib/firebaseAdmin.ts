/**
 * Server-side Firebase Admin SDK с lazy-инициализацией.
 *
 * Используется в API-роутах, где нужно проверить ID-токен пользователя
 * (verifyIdToken) или выполнять привилегированные операции с Firestore
 * в обход security rules. Все секреты берутся из env-переменных:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY  (с экранированными \n)
 *
 * Если переменные не заданы — функции бросают ошибку. Это лучше, чем
 * молча "пропускать" авторизацию (как было в send-notification).
 */

import admin from 'firebase-admin';

let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;
  if (admin.apps.length > 0) {
    initialized = true;
    return;
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin не сконфигурирован: задайте FIREBASE_PROJECT_ID, ' +
        'FIREBASE_CLIENT_EMAIL и FIREBASE_PRIVATE_KEY в окружении.',
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
  initialized = true;
}

export function getAdmin(): typeof admin {
  ensureInitialized();
  return admin;
}

/**
 * Проверяет Firebase ID-токен из заголовка Authorization: Bearer <token>.
 * Возвращает uid пользователя или null, если токен отсутствует/невалиден.
 */
export async function verifyAuthToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;
  try {
    ensureInitialized();
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}
