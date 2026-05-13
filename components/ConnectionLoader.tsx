'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface ConnectionLoaderProps {
  isVisible: boolean;
  onComplete: () => void;
}

const connectionSteps = [
  { text: 'Подключение к серверу...', duration: 1500 },
  { text: 'Синхронизация данных...', duration: 1200 },
  { text: 'Загрузка чатов...', duration: 800 },
  { text: 'Обновление...', duration: 600 },
];

export default function ConnectionLoader({ isVisible, onComplete }: ConnectionLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    if (!isVisible) return;

    let timeoutId: NodeJS.Timeout;
    
    const processSteps = async () => {
      for (let i = 0; i < connectionSteps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => {
          timeoutId = setTimeout(resolve, connectionSteps[i].duration);
        });
      }
      
      // Показываем успешное подключение
      setConnectionStatus('connected');
      setIsConnected(true);
      
      // Завершаем через короткое время
      timeoutId = setTimeout(() => {
        onComplete();
      }, 800);
    };

    processSteps();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 flex items-center justify-center"
      >
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0.2, 0.8, 0.2],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center text-white px-8">
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-4">
              <motion.div
                animate={
                  connectionStatus === 'connecting'
                    ? { rotate: 360 }
                    : connectionStatus === 'connected'
                    ? { scale: [1, 1.2, 1] }
                    : {}
                }
                transition={
                  connectionStatus === 'connecting'
                    ? { duration: 2, repeat: Infinity, ease: "linear" }
                    : { duration: 0.6 }
                }
              >
                {connectionStatus === 'connecting' && (
                  <RefreshCw size={40} className="text-white" />
                )}
                {connectionStatus === 'connected' && (
                  <CheckCircle size={40} className="text-green-300" />
                )}
                {connectionStatus === 'error' && (
                  <AlertCircle size={40} className="text-red-300" />
                )}
              </motion.div>
            </div>
            
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-3xl font-bold mb-2"
            >
              HouseGram
            </motion.h1>
          </motion.div>

          {/* Connection Status */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mb-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={connectionStatus === 'connected' ? 'connected' : currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-lg font-medium mb-4"
              >
                {connectionStatus === 'connected' 
                  ? 'Подключено!' 
                  : connectionSteps[currentStep]?.text || 'Подключение...'
                }
              </motion.div>
            </AnimatePresence>

            {/* Progress Bar */}
            <div className="w-64 h-1 bg-white/20 rounded-full mx-auto overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ 
                  width: connectionStatus === 'connected' 
                    ? '100%' 
                    : `${((currentStep + 1) / connectionSteps.length) * 100}%` 
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            {/* Connection Quality Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="flex items-center justify-center gap-2 mt-4 text-sm text-white/80"
            >
              <motion.div
                animate={{ 
                  scale: connectionStatus === 'connecting' ? [1, 1.2, 1] : 1,
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: connectionStatus === 'connecting' ? Infinity : 0 
                }}
              >
                {connectionStatus === 'connected' ? (
                  <Wifi size={16} className="text-green-300" />
                ) : (
                  <WifiOff size={16} className="text-white/60" />
                )}
              </motion.div>
              <span>
                {connectionStatus === 'connected' 
                  ? 'Отличное соединение' 
                  : 'Установка соединения...'
                }
              </span>
            </motion.div>
          </motion.div>

          {/* Dots Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex justify-center gap-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-white/60 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 1.5,
                  repeat: connectionStatus === 'connecting' ? Infinity : 0,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Bottom Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-8 left-0 right-0 text-center text-white/70 text-sm px-8"
        >
          {connectionStatus === 'connected' 
            ? 'Добро пожаловать в HouseGram!' 
            : 'Подождите, идет подключение к серверу...'
          }
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}