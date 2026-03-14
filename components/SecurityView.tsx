'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Lock } from 'lucide-react';

export default function SecurityView() {
  const { setView, themeColor, isGlassEnabled } = useChat();

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

      <div className="flex-grow overflow-y-auto pt-14 p-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <Lock size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-[20px] font-medium text-center mb-2">Безопасность</h2>
          <p className="text-[15px] text-gray-600 text-center">
            Управляйте активными сессиями, двухфакторной аутентификацией и другими настройками безопасности.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
