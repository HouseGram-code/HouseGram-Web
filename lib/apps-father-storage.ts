/**
 * Apps Father Storage Integration
 * CloudStorage API for file uploads
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
 * Upload file to Apps Father CloudStorage
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

    // Читаем файл как base64
    const base64 = await fileToBase64(file);

    // Отправляем через CloudStorage API
    const response = await fetch(`${API_URL}/storage/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        file: base64,
        fileName: file.name,
        mimeType: file.type,
        folder: folder,
        userId: userId,
      }),
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
    const fileUrl = data.url || data.fileUrl || data.link || data.file_url || data.downloadUrl;
    
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
 * Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Delete file from Apps Father Storage
 */
export async function deleteFromAppsFather(fileUrl: string): Promise<void> {
  if (!API_URL || !API_KEY) {
    throw new Error('Apps Father API credentials not configured');
  }

  try {
    const response = await fetch(`${API_URL}/storage/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
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
    const response = await fetch(`${API_URL}/storage/info?fileUrl=${encodeURIComponent(fileUrl)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
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
