'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Server, User, Key, Eye, EyeOff, Wifi, WifiOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { initializeMatrixClient, getMatrixClient, MatrixClientManager } from '@/lib/matrix-client';

interface MatrixSetupViewProps {
  onBack: () => void;
}

export default function MatrixSetupView({ onBack }: MatrixSetupViewProps) {
  const { themeColor, isGlassEnabled } = useChat();
  const [step, setStep] = useState<'auto-connecting' | 'auth' | 'connecting' | 'success'>('auto-connecting');
  const [homeserverUrl, setHomeserverUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matrixClient, setMatrixClient] = useState<MatrixClientManager | null>(null);
  const [autoConnectStatus, setAutoConnectStatus] = useState('Поиск лучшего сервера...');

  // Популярные Matrix серверы для автоматического выбора
  const popularServers = [
    { name: 'Matrix.org', url: 'https://matrix.org', description: 'Официальный сервер Matrix', priority: 1 },
    { name: 'Element.io', url: 'https://matrix-client.matrix.org', description: 'Сервер от создателей Element', priority: 2 },
    { name: 'Tchncs.de', url: 'https://matrix.tchncs.de', description: 'Европейский сервер', priority: 3 },
    { name: 'Privacytools.io', url: 'https://matrix.privacytools.io', description: 'Фокус на приватности', priority: 4 },
  ];

  // Автоматический выбор лучшего сервера
  useEffect(() => {
    const autoSelectServer = async () => {
      if (step !== 'auto-connecting') return;

      try {
        setAutoConnectStatus('Тестирование серверов...');
        
        // Тестируем серверы по приоритету
        for (const server of popularServers) {
          setAutoConnectStatus(`Проверяем ${server.name}...`);
          
          try {
            // Простая проверка доступности сервера
            const response = await fetch(`${server.url}/_matrix/client/versions`, {
              method: 'GET',
              timeout: 5000,
            } as any);
            
            if (response.ok) {
              setHomeserverUrl(server.url);
              setAutoConnectStatus(`Выбран сервер: ${server.name}`);
              
              // Небольшая задержка для показа результата
              setTimeout(() => {
                setStep('auth');
              }, 1000);
              return;
            }
          } catch (err) {
            console.log(`Server ${server.name} not available:`, err);
            continue;
          }
        }
        
        // Если ни один сервер не доступен, используем matrix.org по умолчанию
        setHomeserverUrl('https://matrix.org');
        setAutoConnectStatus('Используем Matrix.org по умолчанию');
        setTimeout(() => {
          setStep('auth');
        }, 1000);
        
      } catch (error) {
        console.error('Auto server selection failed:', error);
        setHomeserverUrl('https://matrix.org');
        setStep('auth');
      }
    };

    autoSelectServer();
  }, [step]);

  useEffect(() => {
    // Проверяем есть ли уже подключенный Matrix клиент
    const existingClient = getMatrixClient();
    if (existingClient && existingClient.isReady()) {
      setMatrixClient(existingClient);
      setStep('success');
      return;
    }

    // Проверяем сохраненные настройки
    const savedConfig = localStorage.getItem('matrix_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.accessToken && config.userId && config.homeserverUrl) {
          // Автоматически подключаемся с сохраненными данными
          setAutoConnectStatus('Восстанавливаем подключение...');
          autoReconnect(config);
          return;
        }
      } catch (error) {
        console.error('Failed to parse saved Matrix config:', error);
        localStorage.removeItem('matrix_config');
      }
    }
  }, []);

  const autoReconnect = async (config: any) => {
    try {
      setStep('connecting');
      
      const client = initializeMatrixClient({
        homeserverUrl: config.homeserverUrl,
        accessToken: config.accessToken,
        userId: config.userId,
        deviceId: config.deviceId,
      });

      await client.initialize();
      setMatrixClient(client);
      setStep('success');
    } catch (error: any) {
      console.error('Auto reconnect failed:', error);
      localStorage.removeItem('matrix_config');
      setError('Не удалось восстановить подключение');
      setStep('auto-connecting');
    }
  };

  const handleConnect = async () => {
    if (!homeserverUrl.trim() || !username.trim() || !password.trim()) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setStep('connecting');

    try {
      // Создаем новый Matrix клиент
      const client = initializeMatrixClient({
        homeserverUrl: homeserverUrl.trim(),
      });

      if (isLogin) {
        await client.login(username.trim(), password.trim());
      } else {
        await client.register(username.trim(), password.trim());
      }

      setMatrixClient(client);
      setStep('success');
      
      // Сохраняем настройки в localStorage
      localStorage.setItem('matrix_config', JSON.stringify({
        homeserverUrl: homeserverUrl.trim(),
        userId: client.getUserId(),
        accessToken: client.getAccessToken(),
      }));

    } catch (error: any) {
      console.error('Matrix connection error:', error);
      setError(error.message || 'Ошибка подключения к Matrix');
      setStep('auth');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (matrixClient) {
      try {
        await matrixClient.logout();
        setMatrixClient(null);
        localStorage.removeItem('matrix_config');
        setStep('auto-connecting');
        setUsername('');
        setPassword('');
        setError(null);
      } catch (error) {
        console.error('Matrix disconnect error:', error);
      }
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-tg-bg-light flex flex-col z-10"
    >
      {/* Header */}
      <motion.div
        className={`text-tg-header-text px-4 h-14 flex items-center gap-3 shrink-0 transition-colors ${
          isGlassEnabled ? 'backdrop-blur-xl border-b border-white/20 shadow-xl' : 'shadow-lg'
        }`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'DD' : themeColor }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="p-2 rounded-full hover:bg-white/15 active:bg-white/25 transition-all duration-200"
        >
          <ArrowLeft size={24} />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Matrix Setup</h1>
          <p className="text-sm opacity-80">Настройка децентрализованного мессенджера</p>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto p-4">
        {step === 'auto-connecting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="mx-auto mb-4"
              >
                <Server size={64} className="text-blue-500" />
              </motion.div>
              <h2 className="text-xl font-semibold mb-2">Автоматическая настройка</h2>
              <p className="text-gray-600 text-sm mb-4">
                Ищем лучший Matrix сервер для вас
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="text-blue-700 font-medium">{autoConnectStatus}</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-gray-800">Что мы проверяем:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 bg-blue-500 rounded-full"
                  />
                  Скорость подключения
                </div>
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-green-500 rounded-full"
                  />
                  Доступность сервера
                </div>
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-purple-500 rounded-full"
                  />
                  Совместимость функций
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('auth')}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors mt-6"
            >
              Пропустить автоматическую настройку →
            </button>
          </motion.div>
        )}

        {step === 'auth' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <User size={64} className="mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-semibold mb-2">Авторизация</h2>
              <p className="text-gray-600 text-sm">
                Войдите в существующий аккаунт или создайте новый
              </p>
              <div className="text-xs text-gray-500 mt-2">
                Сервер: {homeserverUrl}
              </div>
            </div>

            {/* Переключатель вход/регистрация */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  isLogin ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'
                }`}
              >
                Вход
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  !isLogin ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'
                }`}
              >
                Регистрация
              </button>
            </div>

            {/* Форма */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@username:matrix.org"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConnect}
                disabled={isConnecting || !username.trim() || !password.trim()}
                className="w-full py-3 bg-blue-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors font-medium"
              >
                {isLogin ? 'Войти' : 'Зарегистрироваться'}
              </motion.button>
            </div>

            <button
              onClick={() => setStep('auto-connecting')}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Изменить сервер
            </button>
          </motion.div>
        )}

        {step === 'connecting' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-64 space-y-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 size={48} className="text-blue-500" />
            </motion.div>
            <h3 className="text-lg font-semibold">Подключение к Matrix...</h3>
            <p className="text-gray-600 text-center">
              Устанавливаем соединение с сервером {homeserverUrl}
            </p>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
              >
                <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
              </motion.div>
              <h2 className="text-xl font-semibold mb-2 text-green-700">Успешно подключено!</h2>
              <p className="text-gray-600 text-sm">
                Matrix клиент готов к использованию
              </p>
            </div>

            {/* Информация о подключении */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-700">
                <Wifi size={16} />
                <span className="font-medium">Статус подключения</span>
              </div>
              <div className="text-sm text-green-600">
                <div>Сервер: {homeserverUrl}</div>
                <div>Пользователь: {matrixClient?.getUserId()}</div>
              </div>
            </div>

            {/* Возможности */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-800">Теперь вы можете:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Отправлять файлы до 50MB
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Создавать зашифрованные чаты
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Подключаться к Matrix комнатам
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Общаться с пользователями других серверов
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBack}
                className="w-full py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
              >
                Начать использовать
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDisconnect}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Отключиться
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}