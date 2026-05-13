'use client';

import { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { Delete, Lock } from 'lucide-react';

export default function PasscodeScreen() {
  const { passcode, setIsLocked, themeColor } = useChat();
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handlePress = (num: string) => {
    if (input.length < 4) {
      const newInput = input + num;
      setInput(newInput);
      if (newInput.length === 4) {
        setTimeout(() => {
          if (newInput === passcode) {
            setIsLocked(false);
          } else {
            setError(true);
            setTimeout(() => {
              setInput('');
              setError(false);
            }, 500);
          }
        }, 100);
      }
    }
  };

  const handleDelete = () => {
    setInput(prev => prev.slice(0, -1));
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xl">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-white" style={{ backgroundColor: themeColor }}>
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-medium text-gray-900">Введите код-пароль</h2>
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
    </div>
  );
}
