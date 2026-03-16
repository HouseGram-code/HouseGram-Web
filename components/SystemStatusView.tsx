'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Activity, AlertTriangle, Ban, Settings as SettingsIcon, CheckCircle } from 'lucide-react';

export default function SystemStatusView() {
  const { setView, themeColor, isGlassEnabled, systemStatus } = useChat();

  const getStatusConfig = () => {
    switch (systemStatus?.status) {
      case 'red':
        return {
          icon: Ban,
          color: 'text-red-500',
          bg: 'bg-red-50',
          border: 'border-red-200',
          title: 'Сбой системы',
          description: 'В данный момент наблюдается критический сбой. Некоторые функции могут быть недоступны. Мы уже работаем над устранением проблемы и приносим извинения за неудобства.'
        };
      case 'yellow':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-500',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          title: 'Повышенная нагрузка',
          description: 'Сейчас наблюдается высокая нагрузка на серверы. Возможны небольшие задержки при отправке сообщений или загрузке медиафайлов. Система работает, но медленнее обычного.'
        };
      case 'blue':
        return {
          icon: SettingsIcon,
          color: 'text-blue-500',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          title: 'Восстановление',
          description: 'Системы восстанавливаются после сбоя. Большинство функций уже работает в штатном режиме, но возможны кратковременные перебои. Спасибо за ваше терпение.'
        };
      case 'green':
      default:
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bg: 'bg-green-50',
          border: 'border-green-200',
          title: 'Система работает нормально',
          description: 'Все службы и серверы функционируют в штатном режиме. Задержек и сбоев не наблюдается. Приятного общения!'
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-gray-100 z-40 flex flex-col"
    >
      <div 
        className={`text-white px-2.5 h-12 flex items-center gap-4 shrink-0 absolute top-0 left-0 w-full z-10 transition-colors ${isGlassEnabled ? 'backdrop-blur-md border-b border-black/10' : ''}`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'CC' : themeColor }}
      >
        <button onClick={() => setView('settings')} className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="text-[17px] font-medium flex-grow">Статистика мессенджера</div>
      </div>

      <div className="flex-grow overflow-y-auto pt-16 p-4">
        <div className={`rounded-2xl p-6 shadow-sm border ${config.bg} ${config.border} flex flex-col items-center text-center transition-all duration-500`}>
          <div className={`w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-5 ${config.color}`}>
            <StatusIcon size={40} />
          </div>
          <h2 className="text-[22px] font-bold text-gray-900 mb-3">{config.title}</h2>
          <p className="text-[15px] text-gray-700 leading-relaxed mb-4">
            {systemStatus?.message || config.description}
          </p>
          
          <div className="w-full h-px bg-black/5 my-4"></div>
          
          <div className="w-full text-left">
            <h3 className="text-[14px] font-semibold text-gray-900 uppercase tracking-wider mb-3 opacity-80">Что это значит для вас:</h3>
            <ul className="text-[14px] text-gray-700 space-y-2">
              {systemStatus?.status === 'red' && (
                <>
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></div>Сообщения могут не отправляться</li>
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></div>Медиафайлы временно недоступны</li>
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></div>Мы уже чиним сервера</li>
                </>
              )}
              {systemStatus?.status === 'yellow' && (
                <>
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0"></div>Сообщения отправляются с задержкой</li>
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0"></div>Долгая загрузка фото и видео</li>
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0"></div>Рекомендуем подождать пару минут</li>
                </>
              )}
              {systemStatus?.status === 'blue' && (
                <>
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>Основные функции уже работают</li>
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>Синхронизация истории восстанавливается</li>
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>Скоро все будет идеально</li>
                </>
              )}
              {(!systemStatus?.status || systemStatus?.status === 'green') && (
                <>
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></div>Мгновенная доставка сообщений</li>
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></div>Быстрая загрузка медиа</li>
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></div>Все сервисы онлайн</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
