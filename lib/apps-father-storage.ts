/**
 * Apps Father Storage Integration
 * Provides file upload functionality using Apps Father API
 */

const API_URL = process.env.NEXT_PUBLIC_APPS_FATHER_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_APPS_FATHER_API_KEY;

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Upload file to Apps Father Storage
 */
export async function uploadToAppsFather(
  file: File,
  userId: string,
  folder: string = 'uploads'
): Promise<UploadResult> {
  if (!API_URL || !API_KEY) {
    throw new Error('Apps Father API credentials not configured');
  }

  try {
    console.log('📤 Apps Father: Starting upload...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId,
      folder
    });

    const formData = new FormData();
    formData.append('file', file);
    
    // Добавляем метаданные как отдельные поля
    formData.append('userId', userId);
    formData.append('folder', folder);
    formData.append('fileName', file.name);

    console.log('📤 Apps Father: Sending request to:', API_URL);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        // НЕ устанавливаем Content-Type - браузер сам установит с boundary для FormData
      },
      body: formData,
    });

    console.log('📤 Apps Father: Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📤 Apps Father: Upload failed:', errorText);
      throw new Error(`Upload failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('📤 Apps Father: Upload successful:', data);

    // Поддержка разных форматов ответа
    const fileUrl = data.url || data.fileUrl || data.link || data.file_url;
    
    if (!fileUrl) {
      console.error('📤 Apps Father: No URL in response:', data);
      throw new Error('No file URL in response');
    }

    return {
      url: fileUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    console.error('📤 Apps Father: Upload error:', error);
    throw error;
  }
}

/**
 * Delete file from Apps Father Storage
 */
export async function deleteFromAppsFather(fileUrl: string): Promise<void> {
  if (!API_URL || !API_KEY) {
    throw new Error('Apps Father API credentials not configured');
  }

  try {
    const response = await fetch(API_URL, {
      method: 'DELETE',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileUrl }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Delete failed: ${error}`);
    }
  } catch (error) {
    console.error('Apps Father delete error:', error);
    throw error;
  }
}

/**
 * Get file info from Apps Father Storage
 */
export async function getFileInfo(fileUrl: string): Promise<any> {
  if (!API_URL || !API_KEY) {
    throw new Error('Apps Father API credentials not configured');
  }

  try {
    const response = await fetch(`${API_URL}?fileUrl=${encodeURIComponent(fileUrl)}`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Get info failed: ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Apps Father get info error:', error);
    throw error;
  }
}
