import { useState, useCallback } from 'react';
import { downloadFile, downloadMultipleFiles, getFileInfo, FileInfo, DownloadOptions } from '@/lib/file-download';

export interface DownloadState {
  downloading: boolean;
  progress: number;
  error: string | null;
  completed: boolean;
}

/**
 * Хук для скачивания одного файла
 */
export const useFileDownload = () => {
  const [state, setState] = useState<DownloadState>({
    downloading: false,
    progress: 0,
    error: null,
    completed: false,
  });

  const download = useCallback(async (fileUrl: string, options?: DownloadOptions) => {
    setState({
      downloading: true,
      progress: 0,
      error: null,
      completed: false,
    });

    try {
      await downloadFile(fileUrl, options);

      setState({
        downloading: false,
        progress: 100,
        error: null,
        completed: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка скачивания';
      setState({
        downloading: false,
        progress: 0,
        error: errorMessage,
        completed: false,
      });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      downloading: false,
      progress: 0,
      error: null,
      completed: false,
    });
  }, []);

  return {
    ...state,
    download,
    reset,
  };
};

/**
 * Хук для скачивания нескольких файлов
 */
export const useMultipleFileDownload = () => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const download = useCallback(async (fileUrls: string[], options?: DownloadOptions) => {
    setDownloading(true);
    setProgress({});
    setError(null);
    setCompleted(false);

    try {
      await downloadMultipleFiles(fileUrls, options);

      setCompleted(true);
      setDownloading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка скачивания';
      setError(errorMessage);
      setDownloading(false);
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setDownloading(false);
    setProgress({});
    setError(null);
    setCompleted(false);
  }, []);

  return {
    downloading,
    progress,
    error,
    completed,
    download,
    reset,
  };
};

/**
 * Хук для получения информации о файле
 */
export const useFileInfo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<FileInfo | null>(null);

  const fetchInfo = useCallback(async (fileUrl: string) => {
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const fileInfo = await getFileInfo(fileUrl);
      setInfo(fileInfo);
      setLoading(false);
      return fileInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка получения информации';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setInfo(null);
  }, []);

  return {
    loading,
    error,
    info,
    fetchInfo,
    reset,
  };
};
