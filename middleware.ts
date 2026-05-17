import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Глобальный middleware: помечает ответы дополнительной защитой и
 * отбивает очевидно вредные запросы ещё до попадания в роуты.
 *
 *  - Редиректит http → https в production (на случай, если хостинг этого
 *    не делает сам).
 *  - Снимает заголовок Server (минимизация утечки версии).
 *  - Блокирует попытки переопределить метод через X-HTTP-Method-Override
 *    (одна из старых SSRF/CSRF техник).
 *  - Ограничивает длину Cookie/Headers — защита от смешанной CRLF-инъекции
 *    через нестандартные заголовки.
 */
export function middleware(req: NextRequest) {
  // Принудительный HTTPS.
  if (
    process.env.NODE_ENV === 'production' &&
    req.nextUrl.protocol === 'http:' &&
    !req.nextUrl.hostname.startsWith('localhost')
  ) {
    const httpsUrl = req.nextUrl.clone();
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl, 308);
  }

  // Блокируем явные method-override.
  if (req.headers.get('x-http-method-override')) {
    return new NextResponse('Method override is not allowed', { status: 400 });
  }

  // Слишком длинные cookie часто признак мусорного бота / атаки.
  const cookie = req.headers.get('cookie');
  if (cookie && cookie.length > 8192) {
    return new NextResponse('Cookie too large', { status: 400 });
  }

  const response = NextResponse.next();
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');
  return response;
}

export const config = {
  matcher: [
    // Не трогаем статику Next.js, чтобы не замедлять её зря.
    '/((?!_next/static|_next/image|favicon.ico|icon|manifest|robots.txt).*)',
  ],
};
