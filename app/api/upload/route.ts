import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'File and userId are required' },
        { status: 400 }
      );
    }

    console.log('📤 Upload request:', {
      fileName: file.name,
      fileSize: file.size,
      userId: userId
    });

    // Конвертируем файл в base64 для ImgBB
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // Загружаем на ImgBB (бесплатный image hosting)
    const imgbbApiKey = process.env.IMGBB_API_KEY || 'f8e6e0e4e8f8e0e4e8f8e0e4'; // Временный ключ
    
    const imgbbFormData = new FormData();
    imgbbFormData.append('image', base64);
    imgbbFormData.append('name', `${userId}_${Date.now()}_${file.name}`);

    console.log('📤 Uploading to ImgBB...');

    const uploadResponse = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
      method: 'POST',
      body: imgbbFormData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ ImgBB upload failed:', uploadResponse.status, errorText);
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    const uploadData = await uploadResponse.json();
    
    if (!uploadData.success) {
      throw new Error('ImgBB upload failed');
    }

    console.log('✅ Upload successful:', uploadData.data.url);

    return NextResponse.json({
      url: uploadData.data.url,
      path: uploadData.data.url_viewer,
      size: file.size,
      type: file.type,
      deleteUrl: uploadData.data.delete_url,
    });
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    
    // Fallback: возвращаем data URL для локального отображения
    try {
      const formData2 = await request.formData();
      const file2 = formData2.get('file') as File;
      if (file2) {
        const bytes = await file2.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file2.type};base64,${base64}`;
        
        return NextResponse.json({
          url: dataUrl,
          path: 'local',
          size: file2.size,
          type: file2.type,
          warning: 'Using local data URL - file not uploaded to server',
        });
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
    
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
