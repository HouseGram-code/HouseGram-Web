/**
 * Серверная верификация Firebase ID-токенов **без сервисного ключа**.
 *
 * Firebase публикует публичные ключи в формате JWK по адресу:
 *   https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com
 *
 * Мы загружаем JWK-набор, выбираем нужный ключ по `kid` из заголовка
 * токена, импортируем его через WebCrypto и проверяем подпись RS256.
 * Дополнительно проверяем стандартные claims (aud=projectId,
 * iss=https://securetoken.google.com/<projectId>, exp/iat).
 *
 * Кэшируем JWK на час, чтобы не бить по сети на каждый запрос.
 *
 * Зависит только от стандартных платформенных API (fetch + WebCrypto +
 * TextEncoder), доступных в Next.js Edge и Node 18+ runtime.
 */

const JWK_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

interface Jwk {
  kty: string;
  alg?: string;
  kid?: string;
  n?: string;
  e?: string;
  use?: string;
}

interface JwkSet {
  keys: Jwk[];
}

interface JwkCache {
  byKid: Map<string, Jwk>;
  expiresAt: number;
}

let cache: JwkCache | null = null;
let inflight: Promise<JwkCache> | null = null;

function base64UrlDecodeToBytes(input: string): Uint8Array {
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4 !== 0) s += '=';
  const bin =
    typeof atob === 'function'
      ? atob(s)
      : Buffer.from(s, 'base64').toString('binary');
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function base64UrlDecodeToText(input: string): string {
  return new TextDecoder().decode(base64UrlDecodeToBytes(input));
}

async function fetchJwks(): Promise<JwkCache> {
  const res = await fetch(JWK_URL, {
    // Подсказка для Next.js Route Handlers: можно кэшировать на час.
    next: { revalidate: 3600 },
  } as RequestInit);
  if (!res.ok) {
    throw new Error(`Failed to fetch Firebase JWK set: ${res.status}`);
  }
  const set = (await res.json()) as JwkSet;
  const map = new Map<string, Jwk>();
  for (const key of set.keys || []) {
    if (key.kid) map.set(key.kid, key);
  }
  // Уважаем Cache-Control: max-age, но не больше часа.
  const cc = res.headers.get('cache-control') || '';
  const m = cc.match(/max-age=(\d+)/i);
  const ttl = Math.min(3600, m ? parseInt(m[1], 10) : 3600);
  return { byKid: map, expiresAt: Date.now() + ttl * 1000 };
}

async function getJwks(): Promise<JwkCache> {
  if (cache && cache.expiresAt > Date.now()) return cache;
  if (!inflight) {
    inflight = fetchJwks()
      .then((res) => {
        cache = res;
        return res;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

interface DecodedToken {
  uid: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  email?: string;
}

/**
 * Проверяет ID-токен. Возвращает декодированные claims или null.
 *
 * @param token Firebase ID Token (JWT) от клиента.
 * @param projectId Идентификатор Firebase-проекта (например,
 *   "housegram-d070d"). Берётся из NEXT_PUBLIC_FIREBASE_PROJECT_ID.
 */
export async function verifyFirebaseIdToken(
  token: string,
  projectId: string,
): Promise<DecodedToken | null> {
  if (!token || !projectId) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;

  let header: { alg?: string; kid?: string };
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(base64UrlDecodeToText(headerB64));
    payload = JSON.parse(base64UrlDecodeToText(payloadB64));
  } catch {
    return null;
  }

  if (header.alg !== 'RS256' || !header.kid) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp < now) return null;
  if (typeof payload.iat !== 'number' || payload.iat > now + 60) return null;
  if (typeof payload.sub !== 'string' || !payload.sub) return null;
  if (payload.aud !== projectId) return null;
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;

  let jwks: JwkCache;
  try {
    jwks = await getJwks();
  } catch {
    return null;
  }
  const jwk = jwks.byKid.get(header.kid);
  if (!jwk || !jwk.n || !jwk.e) return null;

  let publicKey: CryptoKey;
  try {
    publicKey = await crypto.subtle.importKey(
      'jwk',
      { kty: 'RSA', alg: 'RS256', use: 'sig', n: jwk.n, e: jwk.e },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
  } catch {
    return null;
  }

  const signature = base64UrlDecodeToBytes(sigB64);
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

  // crypto.subtle.verify требует BufferSource поверх ArrayBuffer.
  // Uint8Array.buffer формально может быть SharedArrayBuffer, поэтому
  // копируем в свежий ArrayBuffer, чтобы успокоить строгий TS Vercel.
  const sigBuf = signature.slice().buffer as ArrayBuffer;
  const dataBuf = data.slice().buffer as ArrayBuffer;

  const ok = await crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    publicKey,
    sigBuf,
    dataBuf,
  );
  if (!ok) return null;

  return {
    uid: payload.sub as string,
    iss: payload.iss as string,
    aud: payload.aud as string,
    exp: payload.exp as number,
    iat: payload.iat as number,
    email: typeof payload.email === 'string' ? payload.email : undefined,
  };
}

export function extractBearer(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  return token || null;
}
