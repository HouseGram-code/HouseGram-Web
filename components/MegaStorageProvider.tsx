'use client';

import { useEffect, useState } from 'react';
import { initMegaStorage, getMegaStorage, getAccountInfo, formatFileSize } from '@/lib/mega-storage';
import { Loader2, HardDrive, AlertCircle, CheckCircle } from 'lucide-react';

interface MegaStorageProviderProps {
  children: React.ReactNode;
}

export default function MegaStorageProvider({ children }: MegaStorageProviderProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<{
    spaceUsed: number;
    spaceTotal: number;
    spaceAvailable: number;
    percentUsed: number;
  } | null>(null);

  useEffect(() => {
    const initStorage = async () => {
      try {
        const email = process.env.NEXT_PUBLIC_MEGA_EMAIL;
        const password = process.env.NEXT_PUBLIC_MEGA_PASSWORD;

        if (!email || !password) {
          throw new Error('MEGA credentials not configured. Please set NEXT_PUBLIC_MEGA_EMAIL and NEXT_PUBLIC_MEGA_PASSWORD in .env.local');
        }

        // Проверяем, не инициализирован ли уже
        if (getMegaStorage()) {
          console.log('✅ MEGA Storage already initialized');
          setIsInitializing(false);
          
          // Получаем информацию об аккаунте
          const info = await getAccountInfo();
          if (info) {
            setAccountInfo(info);
          }
          return;
        }

        console.log('🚀 Initializing MEGA Storage...');
        await initMegaStorage(email, password);
        
        // Получаем информацию об аккаунте
        const info = await getAccountInfo();
        if (info) {
          setAccountInfo(info);
          console.log(`💾 MEGA Storage: ${formatFileSize(info.spaceUsed)} / ${formatFileSize(info.spaceTotal)} (${info.percentUsed.toFixed(1)}% used)`);
        }
        
        setIsInitializing(false);
      } catch (err: any) {
        console.error('Failed to initialize MEGA Storage:', err);
        setError(err.message || 'Failed to initialize MEGA Storage');
        setIsInitializing(false);
      }
    };

    initStorage();
  }, []);

  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <HardDrive size={64} className="text-blue-500" />
              <Loader2 size={32} className="absolute -bottom-2 -right-2 animate-spin text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Подключение к MEGA</h2>
            <p className="text-gray-600 text-center">
              Инициализация облачного хранилища...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle size={64} className="text-red-500" />
            <h2 className="text-2xl font-bold text-gray-800">Ошибка подключения</h2>
            <p className="text-gray-600 text-center">{error}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 w-full">
              <p className="text-sm text-yellow-800">
                <strong>Инструкция:</strong>
              </p>
              <ol className="text-sm text-yellow-700 mt-2 space-y-1 list-decimal list-inside">
                <li>Создайте аккаунт на <a href="https://mega.nz" target="_blank" rel="noopener noreferrer" className="underline">mega.nz</a></li>
                <li>Добавьте credentials в .env.local</li>
                <li>Перезапустите приложение</li>
              </ol>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      
      {/* Storage Info Badge (опционально) */}
      {accountInfo && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200 z-40 hidden md:block">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-green-500" />
            <div className="text-xs">
              <div className="font-medium text-gray-800">MEGA Storage</div>
              <div className="text-gray-600">
                {formatFileSize(accountInfo.spaceAvailable)} доступно
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
