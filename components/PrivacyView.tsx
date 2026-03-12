'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PrivacyView() {
  const { setView, themeColor, isGlassEnabled } = useChat();

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
        <button onClick={() => setView('settings')} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow text-[18px] font-medium">Правила и политика</div>
      </div>

      <div className="flex-grow overflow-y-auto p-5 no-scrollbar bg-gray-50">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4" style={{ color: themeColor, backgroundColor: themeColor + '1A' }}>
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Почему мы похожи на Telegram?</h2>
          <p className="text-[15px] text-gray-600 leading-relaxed mb-4">
            HouseGram Web — это аналог будущего мессенджера HouseGram. Мы вдохновляемся лучшими решениями на рынке, чтобы предоставить вам привычный и удобный интерфейс.
          </p>
          <p className="text-[15px] text-gray-600 leading-relaxed font-medium">
            Мы не воруем и не копируем чужой код. Все элементы интерфейса созданы с нуля с уважением к оригинальному дизайну, который стал стандартом индустрии.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Политика конфиденциальности</h3>
          <div className="space-y-4 text-[15px] text-gray-600 leading-relaxed">
            <p>
              <strong>1. Сбор данных:</strong> Мы собираем только те данные, которые необходимы для работы приложения. Ваши сообщения и медиафайлы надежно защищены.
            </p>
            <p>
              <strong>2. Использование:</strong> Ваши данные используются исключительно для обеспечения связи между вами и вашими контактами. Мы не передаем информацию третьим лицам.
            </p>
            <p>
              <strong>3. Безопасность:</strong> Мы применяем современные методы шифрования для защиты вашей личной информации от несанкционированного доступа.
            </p>
            <p>
              <strong>4. Хранение:</strong> Вы можете в любой момент удалить свою учетную запись и все связанные с ней данные из наших систем.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
