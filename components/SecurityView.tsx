'use client';

import { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Lock, Key, Delete } from 'lucide-react';

export default function SecurityView() {
  const { setView, themeColor, isGlassEnabled, passcode, updatePasscode } = useChat();
  const [isSetting, setIsSetting] = useState(false);
  const [step, setStep] = useState<'enter' | 'confirm' | 'disable'>('enter');
  const [tempCode, setTempCode] = useState('');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

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
          {!isSetting ? (
            <motion.div 
              key="main"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white border-y border-gray-100 mb-4"
            >
              <div className="px-4 py-2 text-[14px] font-medium" style={{ color: themeColor }}>Безопасность</div>
              
              <div 
                className="flex items-center px-4 py-3 gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={handleStartSetting}
              >
                <div className="text-gray-500"><Key size={24} /></div>
                <div className="flex flex-col flex-grow">
                  <span className="text-[16px] text-black">Код-пароль</span>
                  <span className="text-[13px] text-gray-500">{passcode ? 'Вкл' : 'Выкл'}</span>
                </div>
              </div>
              <div className="px-4 py-3 text-[13px] text-gray-500 bg-gray-50">
                Если вы установите код-пароль, при каждом входе в приложение будет запрашиваться пароль.
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
