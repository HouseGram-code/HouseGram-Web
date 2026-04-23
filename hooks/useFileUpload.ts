import { useState, useCallback } from 'react';
import { uploadFile, uploadMultipleFiles, deleteFile, UploadProgress, UploadResult, FileType } from '@/lib/mega-storage';

export interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  result: UploadResult | null;
}

/**
 * Хук для загрузки одного файла
 */
export const useFileUpload = (userId: string) => {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    result: null
  });

  const upload = useCallback(async (file: File, fileType?: FileType) => {
    setState({
      uploading: true,
      progress: 0,
      error: null,
      result: null
    });

    try {
      const result = await uploadFile(
        file,
        userId,
        fileType,
        (progress: UploadProgress) => {
          setState(prev => ({
            ...prev,
            progress: progress.percentage
          }));
        }
      );

      setState({
        uploading: false,
        progress: 100,
        error: null,
        result
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки';
      setState({
        uploading: false,
        progress: 0,
        error: errorMessage,
        result: null
      });
      throw error;
    }
  }, [userId]);

  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      error: null,
      result: null
    });
  }, []);

  return {
    ...state,
    upload,
    reset
  };
};

/**
 * Хук для загрузки нескольких файлов
 */
export const useMultipleFileUpload = (userId: string) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<UploadResult[]>([]);

  const upload = useCallback(async (files: File[]) => {
    setUploading(true);
    setProgress({});
    setError(null);
    setResults([]);

    try {
      const uploadResults = await uploadMultipleFiles(
        files,
        userId,
        (fileIndex: number, fileProgress: UploadProgress) => {
          setProgress(prev => ({
            ...prev,
            [fileIndex]: fileProgress.percentage
          }));
        }
      );

      setResults(uploadResults);
      setUploading(false);
      return uploadResults;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки';
      setError(errorMessage);
      setUploading(false);
      throw error;
    }
  }, [userId]);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress({});
    setError(null);
    setResults([]);
  }, []);

  return {
    uploading,
    progress,
    error,
    results,
    upload,
    reset
  };
};

/**
 * Хук для удаления файла
 */
export const useFileDelete = () => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteFileByPath = useCallback(async (filePath: string, bucket?: string) => {
    setDeleting(true);
    setError(null);

    try {
      const success = await deleteFile(filePath);
      setDeleting(false);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления';
      setError(errorMessage);
      setDeleting(false);
      throw error;
    }
  }, []);

  return {
    deleting,
    error,
    deleteFile: deleteFileByPath
  };
};
