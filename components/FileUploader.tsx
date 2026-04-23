'use client';

import { useRef, useState, useEffect } from 'react';
import { Upload, X, File, Image, Video, Music, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { formatFileSize, detectFileType } from '@/lib/firebase-storage';

interface FileUploaderProps {
  userId: string;
  onUploadComplete: (url: string, fileName: string, fileType: string) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
}

export default function FileUploader({
  userId,
  onUploadComplete,
  accept = '*/*',
  maxSize = 100 * 1024 * 1024, // 100MB по умолчанию
  className = ''
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { uploading, progress, error, result, upload, reset } = useFileUpload(userId);

  // Очистка object URL при размонтировании
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      alert(`Файл слишком большой. Максимум: ${formatFileSize(maxSize)}`);
      return;
    }

    setSelectedFile(file);

    // Создаём превью для изображений через URL.createObjectURL (эффективнее по памяти)
    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const fileType = detectFileType(selectedFile);
      const result = await upload(selectedFile, fileType);
      onUploadComplete(result.url, selectedFile.name, result.type);
      handleCancel();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return <Image size={24} className="text-blue-500" />;
    if (type.startsWith('video/')) return <Video size={24} className="text-purple-500" />;
    if (type.startsWith('audio/')) return <Music size={24} className="text-green-500" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText size={24} className="text-red-500" />;
    return <File size={24} className="text-gray-500" />;
  };

  return (
    <div className={`file-uploader ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {!selectedFile ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Upload size={20} />
          <span>Выбрать файл</span>
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-4 max-w-md">
          {/* Превью */}
          {preview ? (
            <div className="mb-4">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          ) : (
            <div className="mb-4 flex items-center justify-center h-48 bg-gray-100 rounded-lg">
              {getFileIcon(selectedFile)}
            </div>
          )}

          {/* Информация о файле */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900 truncate flex-1">
                {selectedFile.name}
              </span>
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                disabled={uploading}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="text-sm text-gray-500">
              {formatFileSize(selectedFile.size)}
            </div>
          </div>

          {/* Прогресс загрузки */}
          {uploading && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Загрузка...</span>
                <span className="text-sm font-medium text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Успех */}
          {result && !uploading && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle size={20} className="text-green-500" />
              <span className="text-sm text-green-700">Файл успешно загружен!</span>
            </div>
          )}

          {/* Кнопки */}
          {!result && (
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Загрузка...</span>
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    <span>Загрузить</span>
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={uploading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
