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
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('folder', folder);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }

    const data = await response.json();

    return {
      url: data.url || data.fileUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    console.error('Apps Father upload error:', error);
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
    const response = await fetch(`${API_URL}/delete`, {
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
    const response = await fetch(`${API_URL}/info`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileUrl }),
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
