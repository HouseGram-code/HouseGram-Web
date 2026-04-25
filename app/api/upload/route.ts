import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const fileType = formData.get('fileType') as string || 'images';

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'File and userId are required' },
        { status: 400 }
      );
    }

    // Конвертируем File в ArrayBuffer
    const bytes = await file.arrayBuffer();

    // Генерируем путь к файлу
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 50);
    const fileName = `${userId}_${timestamp}_${random}_${cleanName}`;
    const filePath = `${fileType}/${fileName}`;

    // Загружаем в Firebase Storage через REST API
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(filePath)}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': file.type,
      },
      body: bytes,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    const uploadData = await uploadResponse.json();

    // Получаем публичный URL
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filePath)}?alt=media`;

    return NextResponse.json({
      url: downloadUrl,
      path: filePath,
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
