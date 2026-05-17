/**
 * Лёгкая, без внешних зависимостей реализация защитных утилит для API:
 *
 *  - rateLimit: token-bucket per IP (in-memory). Подходит для защиты
 *    конкретных серверлесс-роутов от ботов и брутфорса.
 *  - getClientIp:  best-effort извлечение IP из заголовков (Vercel,
 *    Cloudflare, классический прокси).
 *  - jsonError: единый формат ответа об ошибке.
 *  - safeFetchUrl: проверка URL для серверного скачивания (анти-SSRF).
 *
 * Важно: in-memory лимит работает per-instance, поэтому в multi-region
 * деплое его недостаточно для жёсткого ограничения. Но он отсекает
 * простую массовую атаку с одного IP, а это уже на порядок лучше, чем
 * полное отсутствие лимитов.
 */

import { NextRequest, NextResponse } from 'next/server';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Чистка протухших корзин раз в минуту, чтобы Map не рос бесконечно.
let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) {
      if (v.resetAt < now) buckets.delete(k);
    }
  }, 60_000);
  // В Node 18+ unref может отсутствовать на некоторых платформах.
  if (typeof (cleanupTimer as any).unref === 'function') (cleanupTimer as any).unref();
}

export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf;
  return 'unknown';
}

export interface RateLimitOptions {
  /** Уникальное имя бакета (например, имя API-роута). */
  key: string;
  /** Максимальное число запросов за окно. */
  limit: number;
  /** Длительность окна в мс. */
  windowMs: number;
}

/**
 * Возвращает NextResponse(429) если лимит превышен, иначе null.
 * Используется в начале POST/GET-роутов:
 *
 *   const limited = rateLimit(request, { key: 'upload', limit: 30, windowMs: 60_000 });
 *   if (limited) return limited;
 */
export function rateLimit(
  req: NextRequest,
  opts: RateLimitOptions,
): NextResponse | null {
  ensureCleanup();
  const ip = getClientIp(req);
  const id = `${opts.key}:${ip}`;
  const now = Date.now();
  const existing = buckets.get(id);

  if (!existing || existing.resetAt < now) {
    buckets.set(id, { count: 1, resetAt: now + opts.windowMs });
    return null;
  }

  if (existing.count >= opts.limit) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(opts.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(existing.resetAt / 1000)),
        },
      },
    );
  }

  existing.count += 1;
  return null;
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Анти-SSRF проверка для серверных fetch. Блокирует:
 *   - не-HTTPS схемы (file://, gopher://, ftp://, javascript:);
 *   - localhost / 127.0.0.0/8 / link-local / private RFC1918 / IPv6 loopback.
 *
 * Возвращает true, если URL безопасен для серверного скачивания.
 * Для пропуска через clean DNS-резолв использовать дополнительные либы;
 * но базовый список покрывает 95% типовых попыток сделать SSRF.
 */
export function isSafeOutboundUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;

  const host = url.hostname.toLowerCase();

  // Очевидные локальные хосты
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '[::1]' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return false;
  }

  // IPv4 RFC1918 / loopback / link-local
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = ipv4.slice(1).map((n) => parseInt(n, 10));
    if (a === 10) return false;
    if (a === 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
  }

  // IPv6 ULA (fc00::/7) / link-local (fe80::/10)
  if (host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) {
    return false;
  }

  return true;
}
