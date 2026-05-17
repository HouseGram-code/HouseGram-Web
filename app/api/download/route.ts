import { NextRequest, NextResponse } from 'next/server';
import { isSafeOutboundUrl, jsonError, rateLimit } from '@/lib/security';

/**
 * API для скачивания файлов (фото, видео, музыка)
 * GET /api/download?url=<file_url>
 *
 * Безопасность:
 *  - Принимаются только https-ссылки.
 *  - URL проходит anti-SSRF проверку (нельзя обращаться к localhost,
 *    приватным IP, link-local и т.д.).
 *  - Rate-limit 60 запросов / минуту с одного IP.
 *  - Размер тела ответа ограничен 100 MB, чтобы нельзя было превратить
 *    наш сервер в DoS-усилитель.
 */

const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024;

// Whitelisted домены, к которым приложение действительно ходит за файлами.
// Если список нужно расширить — добавить хост сюда, а не отключать проверку.
const ALLOWED_HOSTS = [
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'i.ibb.co',
  'raw.githubusercontent.com',
  'cdn.jsdelivr.net',
];

function isAllowedHost(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return ALLOWED_HOSTS.some(
      (allowed) => host === allowed || host.endsWith('.' + allowed),
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { key: 'download', limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) return jsonError('File URL is required', 400);
    if (!isSafeOutboundUrl(fileUrl)) return jsonError('URL is not allowed', 400);
    if (!isAllowedHost(fileUrl)) return jsonError('Host is not whitelisted', 400);

    const response = await fetch(fileUrl, {
      redirect: 'follow',
      // Прерываем долгие соединения. 30 секунд — щедро, но не «вечность».
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to download file: ${response.statusText}` },
        { status: response.status },
      );
    }

    // Проверка декларированного размера до буферизации.
    const declaredSize = parseInt(response.headers.get('content-length') || '0', 10);
    if (declaredSize && declaredSize > MAX_DOWNLOAD_BYTES) {
      return jsonError('File too large', 413);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_DOWNLOAD_BYTES) {
      return jsonError('File too large', 413);
    }

    const buffer = Buffer.from(arrayBuffer);
    const urlParts = fileUrl.split('/');
    const rawName = decodeURIComponent(urlParts[urlParts.length - 1] || 'download');
    // Не позволяем заголовку Content-Disposition выходить из строки
    // (защита от header injection через имена файлов с \r\n).
    const fileName = rawName.replace(/[\r\n"\\]/g, '_').slice(0, 200);

    const contentType =
      response.headers.get('content-type') || 'application/octet-stream';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Download failed';
    return jsonError(msg, 500);
  }
}

/**
 * HEAD /api/download?url=<file_url> — метаданные без загрузки тела.
 * Те же ограничения по URL и whitelisted хостам.
 */
export async function HEAD(request: NextRequest) {
  const limited = rateLimit(request, { key: 'download-head', limit: 120, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) return new NextResponse(null, { status: 400 });
    if (!isSafeOutboundUrl(fileUrl) || !isAllowedHost(fileUrl)) {
      return new NextResponse(null, { status: 400 });
    }

    const response = await fetch(fileUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) return new NextResponse(null, { status: response.status });

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
        'Content-Length': response.headers.get('content-length') || '0',
        'Last-Modified': response.headers.get('last-modified') || new Date().toUTCString(),
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
