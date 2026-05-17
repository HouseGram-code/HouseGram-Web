import { NextRequest, NextResponse } from 'next/server';
import { jsonError, rateLimit } from '@/lib/security';
import { verifyAuthToken } from '@/lib/firebaseAdmin';

/**
 * POST /api/upload — загрузка пользовательских файлов.
 *
 * Безопасность:
 *  - Только авторизованные пользователи (Firebase ID-токен).
 *  - userId в форме обязан совпадать с uid из токена — нельзя загружать
 *    "за другого человека".
 *  - MIME-whitelist: image/*, video/*, audio/* и базовые документы.
 *    .exe/.bat/.html/.svg-злые скрипты больше не пропускаются.
 *  - Жёсткий лимит размера 25 MB (раньше — никакого).
 *  - Rate-limit 30 загрузок/мин с одного IP.
 */

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const ALLOWED_MIME = [
  /^image\/(png|jpe?g|gif|webp|heic)$/,
  /^video\/(mp4|webm|quicktime)$/,
  /^audio\/(mpeg|mp4|ogg|wav|webm)$/,
  /^application\/pdf$/,
];

function mimeAllowed(type: string): boolean {
  return ALLOWED_MIME.some((re) => re.test(type));
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { key: 'upload', limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const uid = await verifyAuthToken(request.headers.get('authorization'));
  if (!uid) return jsonError('Unauthorized', 401);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const fileType = (formData.get('fileType') as string | null) || 'uploads';

    if (!file || !userId) return jsonError('File and userId are required', 400);
    if (userId !== uid) return jsonError('Forbidden', 403);
    if (!mimeAllowed(file.type)) return jsonError('File type is not allowed', 415);
    if (file.size > MAX_UPLOAD_BYTES) return jsonError('File too large', 413);

    const safeFolder = /^[a-z0-9_-]{1,32}$/i.test(fileType) ? fileType : 'uploads';
    const safeName = (file.name || 'file').replace(/[\\/\r\n"<>]/g, '_').slice(0, 200);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // Apps Father: внутренний загрузочный API.
    const appsFatherUrl = process.env.NEXT_PUBLIC_APPS_FATHER_API_URL;
    const appsFatherKey = process.env.NEXT_PUBLIC_APPS_FATHER_API_KEY;

    if (appsFatherUrl && appsFatherKey) {
      try {
        const uploadResponse = await fetch(`${appsFatherUrl}/storage/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${appsFatherKey}`,
          },
          body: JSON.stringify({
            file: base64,
            fileName: safeName,
            mimeType: file.type,
            folder: safeFolder,
            userId,
          }),
          signal: AbortSignal.timeout(60_000),
        });

        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          const fileUrl =
            data.url || data.fileUrl || data.link || data.file_url || data.downloadUrl;
          if (fileUrl) {
            return NextResponse.json({
              url: fileUrl,
              path: fileUrl,
              size: file.size,
              type: file.type,
            });
          }
        }
      } catch {
        // fallthrough: пробуем ImgBB
      }
    }

    // ImgBB только для изображений.
    if (file.type.startsWith('image/')) {
      try {
        const imgbbApiKey = process.env.IMGBB_API_KEY;
        if (!imgbbApiKey) throw new Error('IMGBB_API_KEY is not configured');
        const imgbbFormData = new FormData();
        imgbbFormData.append('image', base64);
        imgbbFormData.append('name', `${userId}_${Date.now()}_${safeName}`);

        const uploadResponse = await fetch(
          `https://api.imgbb.com/1/upload?key=${imgbbApiKey}`,
          {
            method: 'POST',
            body: imgbbFormData,
            signal: AbortSignal.timeout(60_000),
          },
        );

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          if (uploadData.success) {
            return NextResponse.json({
              url: uploadData.data.url,
              path: uploadData.data.url_viewer,
              size: file.size,
              type: file.type,
              deleteUrl: uploadData.data.delete_url,
            });
          }
        }
      } catch {
        // fallthrough в data URL
      }
    }

    // Fallback: возвращаем data URL (никуда не загружено, локально).
    const dataUrl = `data:${file.type};base64,${base64}`;
    return NextResponse.json({
      url: dataUrl,
      path: 'local',
      size: file.size,
      type: file.type,
      warning: 'Using local data URL - file not uploaded to server',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Upload failed';
    return jsonError(msg, 500);
  }
}
