import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const fileType = formData.get('fileType') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'File and userId are required' },
        { status: 400 }
      );
    }

    console.log('📤 Upload request:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: userId
    });

    // Конвертируем файл в base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // Приоритет 1: Apps Father (поддерживает все типы файлов)
    const appsFatherUrl = process.env.NEXT_PUBLIC_APPS_FATHER_API_URL;
    const appsFatherKey = process.env.NEXT_PUBLIC_APPS_FATHER_API_KEY;

    if (appsFatherUrl && appsFatherKey) {
      try {
        console.log('📤 Uploading to Apps Father...');
        
        const uploadResponse = await fetch(`${appsFatherUrl}/storage/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${appsFatherKey}`,
          },
          body: JSON.stringify({
            file: base64,
            fileName: file.name,
            mimeType: file.type,
            folder: fileType || 'uploads',
            userId: userId,
          }),
        });

        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          const fileUrl = data.url || data.fileUrl || data.link || data.file_url || data.downloadUrl;
          
          if (fileUrl) {
            console.log('✅ Apps Father upload successful:', fileUrl);
            return NextResponse.json({
              url: fileUrl,
              path: fileUrl,
              size: file.size,
              type: file.type,
            });
          }
        }
        
        console.warn('⚠️ Apps Father upload failed, trying fallback...');
      } catch (error) {
        console.error('❌ Apps Father error:', error);
      }
    }

    // Приоритет 2: ImgBB (только для изображений)
    if (file.type.startsWith('image/')) {
      try {
        console.log('📤 Uploading image to ImgBB...');
        
        const imgbbApiKey = process.env.IMGBB_API_KEY || '3c2e3f0ab9e550f6528cf02b7953b0ac';
        const imgbbFormData = new FormData();
        imgbbFormData.append('image', base64);
        imgbbFormData.append('name', `${userId}_${Date.now()}_${file.name}`);

        const uploadResponse = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
          method: 'POST',
          body: imgbbFormData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          
          if (uploadData.success) {
            console.log('✅ ImgBB upload successful:', uploadData.data.url);
            return NextResponse.json({
              url: uploadData.data.url,
              path: uploadData.data.url_viewer,
              size: file.size,
              type: file.type,
              deleteUrl: uploadData.data.delete_url,
            });
          }
        }
      } catch (error) {
        console.error('❌ ImgBB error:', error);
      }
    }

    // Fallback: возвращаем data URL для локального отображения
    console.log('⚠️ Using data URL fallback');
    const dataUrl = `data:${file.type};base64,${base64}`;
    
    return NextResponse.json({
      url: dataUrl,
      path: 'local',
      size: file.size,
      type: file.type,
      warning: 'Using local data URL - file not uploaded to server',
    });
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
