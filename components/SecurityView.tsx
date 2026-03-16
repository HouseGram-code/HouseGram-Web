'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Lock, KeyRound } from 'lucide-react';
import { useState } from 'react';

export default function SecurityView() {
  const { setView, themeColor, isGlassEnabled, passcode, updatePasscode } = useChat();
  const [isSettingPasscode, setIsSettingPasscode] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');

  const handleDigit = (digit: string) => {
    if (newPasscode.length < 4) {
      const updated = newPasscode + digit;
      setNewPasscode(updated);
      if (updated.length === 4) {
        updatePasscode(updated);
        setIsSettingPasscode(false);
        setNewPasscode('');
      }
    }
  };

  const handleClear = () => {
    setNewPasscode('');
  };

  const handleRemovePasscode = () => {
    updatePasscode(null);
  };

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
        <div className="text-[17px] font-medium flex-grow">Безопасность</div>
      </div>

      <div className="flex-grow overflow-y-auto pt-16 p-4">
        {!isSettingPasscode ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
            <div className="px-4 py-2 text-[14px] font-medium text-gray-500 bg-gray-50 border-b border-gray-100">Код-пароль</div>
            
            {passcode ? (
              <div 
                className="flex items-center px-4 py-3 gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={handleRemovePasscode}
              >
                <div className="text-red-500"><Lock size={24} /></div>
                <div className="flex flex-col flex-grow">
                  <span className="text-[16px] text-red-500">Выключить код-пароль</span>
                </div>
              </div>
            ) : (
              <div 
                className="flex items-center px-4 py-3 gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsSettingPasscode(true)}
              >
                <div className="text-blue-500"><KeyRound size={24} /></div>
                <div className="flex flex-col flex-grow">
                  <span className="text-[16px] text-black">Включить код-пароль</span>
                  <span className="text-[13px] text-gray-500">Требовать код при входе в приложение</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center">
            <h2 className="text-[18px] font-medium mb-6">Задайте 4-значный код</h2>
            <div className="flex gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full ${i < newPasscode.length ? 'bg-blue-500' : 'bg-gray-200'}`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 w-full max-w-[240px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Отмена', '0', 'C'].map(digit => (
                <button 
                  key={digit}
                  onClick={() => {
                    if (digit === 'C') handleClear();
                    else if (digit === 'Отмена') { setIsSettingPasscode(false); setNewPasscode(''); }
                    else handleDigit(digit);
                  }}
                  className={`h-14 rounded-full flex items-center justify-center text-[20px] font-medium transition-colors ${digit === 'Отмена' || digit === 'C' ? 'text-[14px] text-gray-500 hover:bg-gray-100' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {digit}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-4 shadow-sm mt-4">
          <Lock size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-[20px] font-medium text-center mb-2">Безопасность</h2>
          <p className="text-[15px] text-gray-600 text-center">
            Управляйте активными сессиями, двухфакторной аутентификацией и другими настройками безопасности.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
