'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

export default function SystemStatusView() {
  const { setView, systemStatus, themeColor } = useChat();

  const getStatusConfig = () => {
    switch (systemStatus.status) {
      case 'green':
        return {
          icon: <CheckCircle2 size={64} className="text-green-500" />,
          title: 'В норме',
          color: 'bg-green-500',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          description: 'Все системы работают стабильно. Задержек в доставке сообщений нет.'
        };
      case 'yellow':
        return {
          icon: <AlertTriangle size={64} className="text-yellow-500" />,
          title: 'Нагрузка',
          color: 'bg-yellow-500',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          description: 'Наблюдается повышенная нагрузка на серверы. Возможны небольшие задержки при отправке медиафайлов.'
        };
      case 'red':
        return {
          icon: <XCircle size={64} className="text-red-500" />,
          title: 'Сбой',
          color: 'bg-red-500',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          description: 'Произошел критический сбой. Часть функций временно недоступна. Мы уже работаем над решением.'
        };
      case 'blue':
        return {
          icon: <RefreshCw size={64} className="text-blue-500 animate-spin-slow" />,
          title: 'Восстановление',
          color: 'bg-blue-500',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          description: 'Системы восстанавливаются после сбоя. Полная работоспособность будет восстановлена в ближайшее время.'
        };
      default:
        return {
          icon: <Activity size={64} className="text-gray-500" />,
          title: 'Неизвестно',
          color: 'bg-gray-500',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          description: 'Статус системы неизвестен.'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-tg-bg-light flex flex-col z-20"
    >
      <div 
        className="text-white px-4 h-14 flex items-center gap-4 shrink-0 shadow-sm"
        style={{ backgroundColor: themeColor }}
      >
        <button 
          onClick={() => setView('settings')} 
          className="p-1.5 -ml-1.5 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-medium">Состояние мессенджера</h1>
      </div>

      <div className="flex-grow overflow-y-auto p-6 flex flex-col items-center">
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className={`w-40 h-40 rounded-full ${config.bgColor} flex items-center justify-center mb-6 relative`}
        >
          <motion.div
            animate={{ 
              boxShadow: ['0px 0px 0px 0px rgba(0,0,0,0)', `0px 0px 0px 20px ${config.bgColor.replace('bg-', '').replace('-50', '')}33`, '0px 0px 0px 40px rgba(0,0,0,0)']
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full"
          />
          {config.icon}
        </motion.div>

        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-3xl font-bold mb-2 ${config.textColor}`}
        >
          {config.title}
        </motion.h2>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 text-center mb-8 text-[16px] leading-relaxed"
        >
          {systemStatus.message || config.description}
        </motion.p>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6"
        >
          <h3 className="font-medium text-gray-900 mb-4 text-[17px]">Что означают статусы?</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-medium text-[15px] text-gray-900">Зеленый (В норме)</p>
                <p className="text-[14px] text-gray-500">Мессенджер работает без сбоев. Сообщения и медиа доставляются моментально.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-medium text-[15px] text-gray-900">Желтый (Нагрузка)</p>
                <p className="text-[14px] text-gray-500">Высокая активность пользователей. Возможны задержки при загрузке тяжелых файлов.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-medium text-[15px] text-gray-900">Красный (Сбой)</p>
                <p className="text-[14px] text-gray-500">Критическая ошибка на сервере. Некоторые функции могут быть недоступны.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-medium text-[15px] text-gray-900">Синий (Восстановление)</p>
                <p className="text-[14px] text-gray-500">Сбой устранен, системы возвращаются в штатный режим работы.</p>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
