import { NextRequest, NextResponse } from 'next/server';

/**
 * API для скачивания файлов (фото, видео, музыка)
 * GET /api/download?url=<file_url>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'File URL is required' },
        { status: 400 }
      );
    }

    console.log('📥 Download request:', fileUrl);

    // Загружаем файл
    const response = await fetch(fileUrl);

    if (!response.ok) {
      console.error('❌ Download failed:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to download file: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Получаем данные файла
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Определяем имя файла из URL или используем дефолтное
    const urlParts = fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1] || 'download';

    // Определяем MIME тип
    const contentType = response.headers.get('content-type') || blob.type || 'application/octet-stream';

    console.log('✅ Download successful:', {
      fileName,
      contentType,
      size: buffer.length
    });

    // Возвращаем файл с правильными заголовками
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('❌ Download error:', error);
    return NextResponse.json(
      { error: error.message || 'Download failed' },
      { status: 500 }
    );
  }
}

/**
 * API для получения информации о файле без скачивания
 * HEAD /api/download?url=<file_url>
 */
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return new NextResponse(null, { status: 400 });
    }

    // Делаем HEAD запрос к файлу
    const response = await fetch(fileUrl, { method: 'HEAD' });

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    // Возвращаем заголовки файла
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
        'Content-Length': response.headers.get('content-length') || '0',
        'Last-Modified': response.headers.get('last-modified') || new Date().toUTCString(),
      },
    });
  } catch (error: any) {
    console.error('❌ HEAD request error:', error);
    return new NextResponse(null, { status: 500 });
  }
}
