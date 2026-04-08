'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Lock, Key, Delete, Shield, Smartphone, LogOut, AlertTriangle } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

export default function SecurityView() {
  const { setView, themeColor, isGlassEnabled, passcode, updatePasscode, logout } = useChat();
  const [isSetting, setIsSetting] = useState(false);
  const [step, setStep] = useState<'enter' | 'confirm' | 'disable'>('enter');
  const [tempCode, setTempCode] = useState('');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showActiveSessions, setShowActiveSessions] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  
  useEffect(() => {
    if (showActiveSessions) {
      loadActiveSessions();
    }
  }, [showActiveSessions]);

  const loadActiveSessions = async () => {
    // Имитация активных сессий (в реальном приложении это будет из Firebase)
    const sessions = [
      {
        id: '1',
        device: 'Windows PC',
        location: 'Москва, Россия',
        lastActive: new Date(),
        current: true
      }
    ];
    setActiveSessions(sessions);
  };

  const terminateSession = async (sessionId: string) => {
    if (confirm('Завершить эту сессию?')) {
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };

  const terminateAllSessions = async () => {
    if (confirm('Завершить все сессии кроме текущей? Вам придется войти заново на всех устройствах.')) {
      setActiveSessions(prev => prev.filter(s => s.current));
      await logout();
    }
  };

  const handleStartSetting = () => {
    if (passcode) {
      setStep('disable');
    } else {
      setStep('enter');
    }
    setInput('');
    setIsSetting(true);
  };

  const handlePress = (num: string) => {
    if (input.length < 4) {
      const newInput = input + num;
      setInput(newInput);
      
      if (newInput.length === 4) {
        setTimeout(() => {
          if (step === 'enter') {
            setTempCode(newInput);
            setStep('confirm');
            setInput('');
          } else if (step === 'confirm') {
            if (newInput === tempCode) {
              updatePasscode(newInput);
              setIsSetting(false);
            } else {
              setError(true);
              setTimeout(() => {
                setInput('');
                setError(false);
              }, 500);
            }
          } else if (step === 'disable') {
            if (newInput === passcode) {
              updatePasscode(null);
              setIsSetting(false);
            } else {
              setError(true);
              setTimeout(() => {
                setInput('');
                setError(false);
              }, 500);
            }
          }
        }, 100);
      }
    }
  };

  const handleDelete = () => {
    setInput(prev => prev.slice(0, -1));
  };

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-white flex flex-col z-20"
    >
      <div 
        className={`text-white px-2.5 h-14 flex items-center gap-4 shrink-0 relative z-30 transition-colors ${isGlassEnabled ? 'backdrop-blur-md border-b border-black/10' : ''}`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'CC' : themeColor }}
      >
        <button onClick={() => isSetting ? setIsSetting(false) : setView('settings')} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow text-[18px] font-medium">Конфиденциальность</div>
      </div>

      <div className="flex-grow overflow-y-auto pt-4 pb-10 no-scrollbar bg-gray-50 relative">
        <AnimatePresence mode="wait">
          {showPasswordChange ? (
            <PasswordChangeView 
              themeColor={themeColor}
              onBack={() => setShowPasswordChange(false)}
            />
          ) : showActiveSessions ? (
            <ActiveSessionsView 
              themeColor={themeColor}
              sessions={activeSessions}
              onBack={() => setShowActiveSessions(false)}
              onTerminate={terminateSession}
              onTerminateAll={terminateAllSessions}
            />
          ) : !isSetting ? (
            <motion.div 
              key="main"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-white border-y border-gray-100 mb-4">
                <div className="px-4 py-2 text-[14px] font-medium" style={{ color: themeColor }}>Безопасность</div>
                
                <div 
                  className="flex items-center px-4 py-3 gap-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                  onClick={handleStartSetting}
                >
                  <div className="text-gray-500"><Key size={24} /></div>
                  <div className="flex flex-col flex-grow">
                    <span className="text-[16px] text-black">Код-пароль</span>
                    <span className="text-[13px] text-gray-500">{passcode ? 'Вкл' : 'Выкл'}</span>
                  </div>
                </div>

                <div 
                  className="flex items-center px-4 py-3 gap-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                  onClick={() => setShowPasswordChange(true)}
                >
                  <div className="text-gray-500"><Shield size={24} /></div>
                  <div className="flex flex-col flex-grow">
                    <span className="text-[16px] text-black">Изменить пароль</span>
                    <span className="text-[13px] text-gray-500">Обновить пароль аккаунта</span>
                  </div>
                </div>

                <div 
                  className="flex items-center px-4 py-3 gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setShowActiveSessions(true)}
                >
                  <div className="text-gray-500"><Smartphone size={24} /></div>
                  <div className="flex flex-col flex-grow">
                    <span className="text-[16px] text-black">Активные сессии</span>
                    <span className="text-[13px] text-gray-500">{activeSessions.length} устройств</span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 text-[13px] text-gray-500 bg-gray-50">
                Защитите свой аккаунт с помощью дополнительных мер безопасности.
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="numpad"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 bg-white flex flex-col items-center justify-center pb-20 z-40"
            >
              <div className="mb-8 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-white" style={{ backgroundColor: themeColor }}>
                  <Lock size={32} />
                </div>
                <h2 className="text-xl font-medium text-gray-900">
                  {step === 'enter' ? 'Введите новый код' : step === 'confirm' ? 'Повторите код' : 'Введите текущий код'}
                </h2>
              </div>

              <motion.div
                animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="flex gap-4 mb-12"
              >
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-4 h-4 rounded-full border-2 transition-colors ${input.length > i ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`} style={input.length > i ? { backgroundColor: themeColor, borderColor: themeColor } : {}} />
                ))}
              </motion.div>

              <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button key={num} onClick={() => handlePress(num.toString())} className="w-16 h-16 rounded-full bg-gray-100 text-2xl font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors">
                    {num}
                  </button>
                ))}
                <div />
                <button onClick={() => handlePress('0')} className="w-16 h-16 rounded-full bg-gray-100 text-2xl font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors">
                  0
                </button>
                <button onClick={handleDelete} className="w-16 h-16 rounded-full bg-transparent flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors">
                  <Delete size={28} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function PasswordChangeView({ themeColor, onBack }: { themeColor: string; onBack: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage('Заполните все поля');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Новые пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        setMessage('Пользователь не найден');
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      setMessage('Пароль успешно изменен');
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        setMessage('Неверный текущий пароль');
      } else if (error.code === 'auth/weak-password') {
        setMessage('Слишком слабый пароль');
      } else {
        setMessage('Ошибка при смене пароля');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="bg-white border-y border-gray-100"
    >
      <div className="px-4 py-2 text-[14px] font-medium" style={{ color: themeColor }}>Изменить пароль</div>
      
      <div className="px-4 py-4 space-y-4">
        <div>
          <label className="text-[13px] text-gray-500 mb-1 block">Текущий пароль</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            placeholder="Введите текущий пароль"
          />
        </div>

        <div>
          <label className="text-[13px] text-gray-500 mb-1 block">Новый пароль</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            placeholder="Введите новый пароль"
          />
        </div>

        <div>
          <label className="text-[13px] text-gray-500 mb-1 block">Подтвердите пароль</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            placeholder="Повторите новый пароль"
          />
        </div>

        {message && (
          <div className={`text-[13px] p-2 rounded ${message.includes('успешно') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-[15px] hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="flex-1 px-4 py-2 text-white rounded-md text-[15px] hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: themeColor }}
          >
            {loading ? 'Изменение...' : 'Изменить'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ActiveSessionsView({ 
  themeColor, 
  sessions, 
  onBack, 
  onTerminate, 
  onTerminateAll 
}: { 
  themeColor: string; 
  sessions: any[]; 
  onBack: () => void;
  onTerminate: (id: string) => void;
  onTerminateAll: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
    >
      <div className="bg-white border-y border-gray-100 mb-4">
        <div className="px-4 py-2 text-[14px] font-medium" style={{ color: themeColor }}>Активные сессии</div>
        
        {sessions.map(session => (
          <div key={session.id} className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className="text-gray-500 mt-1">
                <Smartphone size={24} />
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <span className="text-[16px] text-black font-medium">{session.device}</span>
                  {session.current && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: themeColor }}>
                      Текущая
                    </span>
                  )}
                </div>
                <div className="text-[13px] text-gray-500 mt-1">{session.location}</div>
                <div className="text-[12px] text-gray-400 mt-0.5">
                  Активна: {session.lastActive.toLocaleString('ru-RU')}
                </div>
              </div>
              {!session.current && (
                <button
                  onClick={() => onTerminate(session.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <LogOut size={20} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {sessions.length > 1 && (
        <div className="px-4 py-3">
          <button
            onClick={onTerminateAll}
            className="w-full px-4 py-3 bg-red-500 text-white rounded-md text-[15px] hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <AlertTriangle size={20} />
            Завершить все сессии
          </button>
        </div>
      )}

      <div className="px-4 py-3 text-[13px] text-gray-500 bg-gray-50">
        Здесь отображаются все устройства, на которых выполнен вход в ваш аккаунт.
      </div>
    </motion.div>
  );
}
