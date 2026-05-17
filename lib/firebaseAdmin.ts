/**
 * Тонкий совместимый шим: раньше тут был `firebase-admin` с сервисным
 * ключом. Теперь все API-роуты пользуются `verifyIdToken.ts`, который
 * проверяет токен по публичным JWK Google — без секретов на сервере.
 *
 * Файл оставлен для обратной совместимости (на случай, если где-то ещё
 * есть `import { verifyAuthToken } from '@/lib/firebaseAdmin'`).
 *
 * Он берёт `projectId` из публичной переменной NEXT_PUBLIC_FIREBASE_PROJECT_ID.
 */

import { extractBearer, verifyFirebaseIdToken } from './verifyIdToken';

function getProjectId(): string {
  const id =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    '';
  return id;
}

/**
 * Проверяет Bearer-токен из заголовка Authorization. Возвращает uid
 * пользователя или null. Никаких сервисных ключей не требуется.
 */
export async function verifyAuthToken(
  authHeader: string | null,
): Promise<string | null> {
  const token = extractBearer(authHeader);
  if (!token) return null;
  const projectId = getProjectId();
  if (!projectId) return null;
  const decoded = await verifyFirebaseIdToken(token, projectId);
  return decoded?.uid ?? null;
}
