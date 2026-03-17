'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { useState } from 'react';

export default function PasscodeScreen() {
  const { setIsLocked, passcode } = useChat();
  const [input, setInput] = useState('');

  const handleDigit = (digit: string) => {
    const p = passcode || '';
    const newInput = input + digit;
    setInput(newInput);
    if (newInput === p) {
      setIsLocked(false);
    } else if (newInput.length >= p.length) {
      setInput('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center p-6"
    >
      <h2 className="text-[20px] font-medium mb-8">Введите код-пароль</h2>
      <div className="flex gap-4 mb-12">
        {[...Array((passcode || '').length)].map((_, i) => (
          <div key={i} className={`w-4 h-4 rounded-full ${i < input.length ? 'bg-black' : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'C'].map(digit => (
          <button 
            key={digit}
            onClick={() => digit === 'C' ? setInput('') : digit !== '' && handleDigit(digit)}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-[24px] font-medium transition-colors ${digit === '' ? 'invisible' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {digit}
          </button>
        ))}
      </div>
      <button 
        onClick={() => {
          localStorage.removeItem('passcode');
          window.location.reload();
        }}
        className="mt-12 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        Забыли код-пароль? (Сбросить)
      </button>
    </motion.div>
  );
}
