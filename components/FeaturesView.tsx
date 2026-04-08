'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Shield, MessageSquare, Zap, Lock, Key, Check, Eye, User, Bell, Smartphone, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function FeaturesView() {
  const { setView, themeColor } = useChat();
  const [activeDemo, setActiveDemo] = useState<number | null>(null);

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-white flex flex-col z-20"
    >
      <div 
        className="text-white px-2.5 h-14 flex items-center gap-4 shrink-0 relative z-30"
        style={{ backgroundColor: themeColor }}
      >
        <button onClick={() => setView('menu')} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow text-[18px] font-medium">Возможности HouseGram</div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-6 pb-20">
        <div className="text-center py-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: themeColor + '20' }}
          >
            <Zap size={40} style={{ color: themeColor }} />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-medium text-black mb-2"
          >
            Интерактивные демонстрации
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-500 text-sm"
          >
            Нажмите на карточку, чтобы увидеть функцию в действии
          </motion.p>
        </div>

        {/* Демо 1: Смена пароля */}
        <DemoCard
          icon={<Key size={20} />}
          title="Смена пароля"
          description="Безопасное изменение пароля с проверкой"
          color="#10b981"
          isActive={activeDemo === 1}
          onClick={() => setActiveDemo(activeDemo === 1 ? null : 1)}
        >
          <PasswordChangeDemo themeColor={themeColor} />
        </DemoCard>

        {/* Демо 2: Настройки конфиденциальности */}
        <DemoCard
          icon={<Eye size={20} />}
          title="Конфиденциальность"
          description="Контроль видимости вашей информации"
          color="#8b5cf6"
          isActive={activeDemo === 2}
          onClick={() => setActiveDemo(activeDemo === 2 ? null : 2)}
        >
          <PrivacyDemo themeColor={themeColor} />
        </DemoCard>

        {/* Демо 3: Активные сессии */}
        <DemoCard
          icon={<Smartphone size={20} />}
          title="Управление сессиями"
          description="Просмотр и завершение активных устройств"
          color="#f59e0b"
          isActive={activeDemo === 3}
          onClick={() => setActiveDemo(activeDemo === 3 ? null : 3)}
        >
          <SessionsDemo themeColor={themeColor} />
        </DemoCard>

        {/* Демо 4: Код-пароль */}
        <DemoCard
          icon={<Lock size={20} />}
          title="Код-пароль"
          description="Защита приложения 4-значным кодом"
          color="#ef4444"
          isActive={activeDemo === 4}
          onClick={() => setActiveDemo(activeDemo === 4 ? null : 4)}
        >
          <PasscodeDemo themeColor={themeColor} />
        </DemoCard>

        {/* Демо 5: Умный чат-бот */}
        <DemoCard
          icon={<MessageSquare size={20} />}
          title="Умный чат-бот"
          description="AI-ассистент с реалистичным общением"
          color="#3b82f6"
          isActive={activeDemo === 5}
          onClick={() => setActiveDemo(activeDemo === 5 ? null : 5)}
        >
          <ChatBotDemo themeColor={themeColor} />
        </DemoCard>

        {/* Демо 6: Уведомления */}
        <DemoCard
          icon={<Bell size={20} />}
          title="Push-уведомления"
          description="Мгновенные уведомления о новых сообщениях"
          color="#ec4899"
          isActive={activeDemo === 6}
          onClick={() => setActiveDemo(activeDemo === 6 ? null : 6)}
        >
          <NotificationDemo themeColor={themeColor} />
        </DemoCard>
      </div>
    </motion.div>
  );
}

function DemoCard({ 
  icon, 
  title, 
  description, 
  color, 
  isActive, 
  onClick, 
  children 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  color: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div 
      layout
      className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden cursor-pointer"
      onClick={onClick}
      whileHover={{ scale: isActive ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <motion.div 
            className="p-2 rounded-lg text-white"
            style={{ backgroundColor: color }}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
          <div className="flex-grow">
            <h3 className="font-medium text-black">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <motion.div
            animate={{ rotate: isActive ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ArrowLeft size={20} className="text-gray-400 rotate-[-90deg]" />
          </motion.div>
        </div>
      </div>
      
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 bg-white"
          >
            <div className="p-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Демонстрация смены пароля
function PasswordChangeDemo({ themeColor }: { themeColor: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (step < 3) setStep(step + 1);
    }, 1500);
    return () => clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    setStep(0);
  }, []);

  return (
    <div className="space-y-3">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: step >= 0 ? 1 : 0, x: step >= 0 ? 0 : -20 }}
        className="space-y-2"
      >
        <label className="text-xs text-gray-500">Текущий пароль</label>
        <div className="relative">
          <input
            type="password"
            value="••••••••"
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          {step >= 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-2 top-2"
            >
              <Check size={20} className="text-green-500" />
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: step >= 1 ? 1 : 0, x: step >= 1 ? 0 : -20 }}
        className="space-y-2"
      >
        <label className="text-xs text-gray-500">Новый пароль</label>
        <div className="relative">
          <input
            type="password"
            value="••••••••••"
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          {step >= 2 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-2 top-2"
            >
              <Check size={20} className="text-green-500" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {step >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <Check size={20} className="text-green-600" />
          <span className="text-sm text-green-700 font-medium">Пароль успешно изменен!</span>
        </motion.div>
      )}
    </div>
  );
}

// Демонстрация настроек конфиденциальности
function PrivacyDemo({ themeColor }: { themeColor: string }) {
  const [selected, setSelected] = useState<string>('everyone');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <Eye size={16} />
        <span>Кто может видеть время последнего посещения</span>
      </div>
      
      {['everyone', 'contacts', 'nobody'].map((option, index) => (
        <motion.div
          key={option}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
            selected === option 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
          onClick={() => setSelected(option)}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {option === 'everyone' ? 'Все' : option === 'contacts' ? 'Мои контакты' : 'Никто'}
            </span>
            {selected === option && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{ color: themeColor }}
              >
                <Check size={20} />
              </motion.div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Демонстрация активных сессий
function SessionsDemo({ themeColor }: { themeColor: string }) {
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Windows PC', active: true },
    { id: 2, device: 'iPhone 13', active: true },
    { id: 3, device: 'iPad Pro', active: true }
  ]);

  const terminateSession = (id: number) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {sessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <Smartphone size={20} className="text-gray-500" />
            <div className="flex-grow">
              <div className="text-sm font-medium">{session.device}</div>
              <div className="text-xs text-gray-500">Активна сейчас</div>
            </div>
            {session.id !== 1 && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => terminateSession(session.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={18} />
              </motion.button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Демонстрация кода-пароля
function PasscodeDemo({ themeColor }: { themeColor: string }) {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    if (dots < 4) {
      const timer = setTimeout(() => setDots(dots + 1), 400);
      return () => clearTimeout(timer);
    }
  }, [dots]);

  useEffect(() => {
    setDots(0);
  }, []);

  return (
    <div className="flex flex-col items-center py-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: themeColor }}
      >
        <Lock size={32} className="text-white" />
      </motion.div>
      
      <p className="text-sm text-gray-600 mb-4">Введите код-пароль</p>
      
      <div className="flex gap-4 mb-6">
        {[0, 1, 2, 3].map(i => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ 
              scale: dots > i ? 1 : 0.5,
              backgroundColor: dots > i ? themeColor : '#e5e7eb'
            }}
            transition={{ delay: i * 0.1 }}
            className="w-4 h-4 rounded-full"
          />
        ))}
      </div>

      {dots === 4 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 text-green-600"
        >
          <Check size={20} />
          <span className="text-sm font-medium">Разблокировано</span>
        </motion.div>
      )}
    </div>
  );
}

// Демонстрация чат-бота
function ChatBotDemo({ themeColor }: { themeColor: string }) {
  const [messages, setMessages] = useState<Array<{ text: string; sent: boolean }>>([]);

  useEffect(() => {
    const sequence = [
      { text: 'Привет! 👋', sent: true, delay: 500 },
      { text: 'Здравствуйте! Я HouseGram AI. Чем могу помочь?', sent: false, delay: 1500 },
      { text: 'Расскажи о своих возможностях', sent: true, delay: 2500 },
      { text: 'Я могу отвечать на вопросы, поддерживать беседу и помогать с функциями приложения! 🚀', sent: false, delay: 4000 }
    ];

    sequence.forEach(({ text, sent, delay }) => {
      setTimeout(() => {
        setMessages(prev => [...prev, { text, sent }]);
      }, delay);
    });

    return () => setMessages([]);
  }, []);

  return (
    <div className="space-y-2 min-h-[200px]">
      <AnimatePresence>
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                msg.sent
                  ? 'bg-blue-500 text-white rounded-tr-sm'
                  : 'bg-gray-100 text-gray-800 rounded-tl-sm'
              }`}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Демонстрация уведомлений
function NotificationDemo({ themeColor }: { themeColor: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-[150px] flex items-center justify-center">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="w-full bg-white rounded-xl shadow-2xl border border-gray-200 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: themeColor }}>
                <User size={20} />
              </div>
              <div className="flex-grow">
                <div className="font-medium text-sm">Новое сообщение</div>
                <div className="text-xs text-gray-500 mt-0.5">Иван Петров</div>
                <div className="text-sm text-gray-700 mt-1">Привет! Как дела? 👋</div>
              </div>
              <Bell size={16} className="text-gray-400" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
