'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Server, Wifi, Database, MessageSquare, Bell, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

type ServerStatus = 'online' | 'error' | 'warning' | 'loading' | 'recovering';

interface ServiceStatus {
  name: string;
  status: ServerStatus;
  icon: React.ReactNode;
  description: string;
  responseTime?: number;
}

export default function ServerStatusView() {
  const { setView, themeColor, isGlassEnabled } = useChat();
  const [isChecking, setIsChecking] = useState(false);
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Firebase Auth', status: 'loading', icon: <Wifi size={24} />, description: 'Аутентификация' },
    { name: 'Firestore Database', status: 'loading', icon: <Database size={24} />, description: 'База данных' },
    { name: 'Messaging', status: 'loading', icon: <MessageSquare size={24} />, description: 'Сообщения' },
    { name: 'Notifications', status: 'loading', icon: <Bell size={24} />, description: 'Уведомления' },
  ]);

  const checkServerStatus = async () => {
    setIsChecking(true);
    const newServices = [...services];

    // Check Firebase Auth
    try {
      const startAuth = Date.now();
      if (auth.currentUser) {
        await auth.currentUser.reload();
        newServices[0] = { ...newServices[0], status: 'online', responseTime: Date.now() - startAuth };
      } else {
        newServices[0] = { ...newServices[0], status: 'warning', responseTime: Date.now() - startAuth };
      }
    } catch (error) {
      newServices[0] = { ...newServices[0], status: 'error' };
    }

    // Check Firestore
    try {
      const startDb = Date.now();
      await getDocs(query(collection(db, 'users'), limit(1)));
      newServices[1] = { ...newServices[1], status: 'online', responseTime: Date.now() - startDb };
    } catch (error) {
      newServices[1] = { ...newServices[1], status: 'error' };
    }

    // Check Messaging (simulate)
    try {
      const startMsg = Date.now();
      await getDocs(query(collection(db, 'messages'), limit(1)));
      newServices[2] = { ...newServices[2], status: 'online', responseTime: Date.now() - startMsg };
    } catch (error) {
      newServices[2] = { ...newServices[2], status: 'error' };
    }

    // Check Notifications
    try {
      const startNotif = Date.now();
      if ('Notification' in window) {
        const permission = Notification.permission;
        if (permission === 'granted') {
          newServices[3] = { ...newServices[3], status: 'online', responseTime: Date.now() - startNotif };
        } else if (permission === 'denied') {
          newServices[3] = { ...newServices[3], status: 'error', responseTime: Date.now() - startNotif };
        } else {
          newServices[3] = { ...newServices[3], status: 'warning', responseTime: Date.now() - startNotif };
        }
      } else {
        newServices[3] = { ...newServices[3], status: 'error' };
      }
    } catch (error) {
      newServices[3] = { ...newServices[3], status: 'error' };
    }

    setServices(newServices);
    setIsChecking(false);
  };

  useEffect(() => {
    checkServerStatus();
  }, []);

  const getStatusColor = (status: ServerStatus) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'loading': return 'bg-blue-500';
      case 'recovering': return 'bg-cyan-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: ServerStatus) => {
    switch (status) {
      case 'online': return 'Работает';
      case 'error': return 'Сбой';
      case 'warning': return 'Нагрузка';
      case 'loading': return 'Проверка...';
      case 'recovering': return 'Восстановление';
      default: return 'Неизвестно';
    }
  };

  const getStatusIcon = (status: ServerStatus) => {
    switch (status) {
      case 'online': return '✓';
      case 'error': return '✕';
      case 'warning': return '!';
      case 'loading': return '⟳';
      case 'recovering': return '↻';
      default: return '?';
    }
  };

  const overallStatus = services.every(s => s.status === 'online') ? 'online' 
    : services.some(s => s.status === 'error') ? 'error'
    : services.some(s => s.status === 'warning') ? 'warning'
    : 'loading';

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-gray-50 flex flex-col z-30"
    >
      <div 
        className={`text-white px-2.5 h-12 flex items-center gap-4 shrink-0 ${isGlassEnabled ? 'backdrop-blur-md border-b border-black/10' : ''}`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'CC' : themeColor }}
      >
        <button onClick={() => setView('settings')} className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="text-[17px] font-medium flex-grow">Статус сервера</div>
        <button 
          onClick={checkServerStatus}
          disabled={isChecking}
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={24} className={isChecking ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar pb-10">
        {/* Overall Status Card */}
        <div className="p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${getStatusColor(overallStatus)} rounded-2xl p-6 text-white shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Server size={32} />
                <div>
                  <div className="text-2xl font-bold">Общий статус</div>
                  <div className="text-sm opacity-90">{getStatusText(overallStatus)}</div>
                </div>
              </div>
              <div className="text-5xl font-bold opacity-80">
                {getStatusIcon(overallStatus)}
              </div>
            </div>
            <div className="text-sm opacity-90">
              {overallStatus === 'online' && 'Все системы работают нормально'}
              {overallStatus === 'error' && 'Обнаружены проблемы с сервисами'}
              {overallStatus === 'warning' && 'Некоторые сервисы под нагрузкой'}
              {overallStatus === 'loading' && 'Проверка состояния сервисов...'}
            </div>
          </motion.div>
        </div>

        {/* Services List */}
        <div className="px-4">
          <div className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Сервисы</div>
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            {services.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 p-4 ${index !== services.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className={`${getStatusColor(service.status)} rounded-full p-3 text-white`}>
                  {service.icon}
                </div>
                <div className="flex-grow">
                  <div className="font-medium text-gray-900">{service.name}</div>
                  <div className="text-sm text-gray-500">{service.description}</div>
                  {service.responseTime && (
                    <div className="text-xs text-gray-400 mt-1">
                      Время отклика: {service.responseTime}ms
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className={`${getStatusColor(service.status)} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                    {getStatusText(service.status)}
                  </div>
                  <div className={`w-3 h-3 ${getStatusColor(service.status)} rounded-full ${service.status === 'online' ? 'animate-pulse' : ''}`} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="px-4 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="text-sm text-blue-900">
              <div className="font-medium mb-2">Легенда статусов:</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Зеленый - Работает нормально</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Красный - Сбой сервиса</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Желтый - Высокая нагрузка</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Синий - Проверка статуса</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                  <span>Голубой - Восстановление</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
