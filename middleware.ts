/**
 * Next.js Middleware - Базовая защита
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Простое in-memory хранилище для rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Очистка старых записей каждые 5 минут
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requestCounts.entries()) {
      if (value.resetTime < now) {
        requestCounts.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');
  
  return forwarded?.split(',')[0] || realIp || cfIp || 'unknown';
}

function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const key = `ratelimit:${ip}`;
  const record = requestCounts.get(key);
  
  if (!record || record.resetTime < now) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);
  
  // Пропускаем статические файлы
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Rate limiting для API routes
  if (pathname.startsWith('/api/')) {
    // 100 запросов в минуту для обычных API
    if (!checkRateLimit(ip, 100, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many requests', message: 'Слишком много запросов. Попробуйте позже.' },
        { status: 429 }
      );
    }
    
    // Строгий лимит для критичных операций
    if (pathname.includes('/payment/') || pathname.includes('/admin/')) {
      if (!checkRateLimit(`${ip}:critical`, 10, 60 * 1000)) {
        return NextResponse.json(
          { error: 'Too many requests', message: 'Слишком много запросов к критичным операциям.' },
          { status: 429 }
        );
      }
    }
  }
  
  // Создаем ответ с security headers
  const response = NextResponse.next();
  
  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https: wss:; " +
    "frame-ancestors 'none';"
  );
  
  // Добавляем IP в заголовки для использования в API routes
  response.headers.set('x-client-ip', ip);
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
