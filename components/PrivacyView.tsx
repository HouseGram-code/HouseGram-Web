'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';

export default function PrivacyView() {
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
        <div className="text-[17px] font-medium flex-grow">Правила и политика</div>
      </div>

      <div className="flex-grow overflow-y-auto pt-16 p-4">
        <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
          <Shield size={48} className="text-blue-500 mx-auto mb-4" />
          <h2 className="text-[20px] font-bold text-center mb-2 text-gray-900">Ваши данные защищены</h2>
          <p className="text-[15px] text-gray-600 text-center mb-6">
            Мы используем сквозное шифрование для всех ваших сообщений. Никто, кроме вас и вашего собеседника, не может прочитать их.
          </p>
          
          <div className="w-full h-px bg-gray-100 my-6"></div>
          
          <h3 className="text-[18px] font-bold text-gray-900 mb-4">5 главных правил платформы:</h3>
          
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-green-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-gray-900 block">1. Уважение к пользователям</span>
                <span className="text-[14px] text-gray-600">Запрещены любые формы оскорблений, угроз и дискриминации.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-green-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-gray-900 block">2. Никакого спама</span>
                <span className="text-[14px] text-gray-600">Массовая рассылка рекламы и навязчивых сообщений строго запрещена.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-green-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-gray-900 block">3. Запрет на нелегальный контент</span>
                <span className="text-[14px] text-gray-600">Публикация и распространение противозаконных материалов ведет к бану.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-green-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-gray-900 block">4. Защита личных данных</span>
                <span className="text-[14px] text-gray-600">Не делитесь своими паролями и кодами доступа с третьими лицами.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-green-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-gray-900 block">5. Право на модерацию</span>
                <span className="text-[14px] text-gray-600">Администрация оставляет за собой право блокировать нарушителей правил.</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
