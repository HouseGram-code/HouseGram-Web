import { ArrowLeft, Info, Shield, HelpCircle, FileText, Globe, Github, Heart } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import Image from 'next/image';

export default function InfoView() {
  const { setView, themeColor } = useChat();

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-[#f4f4f5] flex flex-col z-20"
    >
      {/* Header */}
      <div 
        className="text-white px-2.5 h-14 flex items-center gap-4 shrink-0 relative z-30 shadow-sm"
        style={{ backgroundColor: themeColor }}
      >
        <button onClick={() => setView('menu')} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow text-[18px] font-medium">Информация</div>
      </div>

      <div className="flex-grow overflow-y-auto pb-6">
        {/* Logo and Version */}
        <div className="flex flex-col items-center justify-center py-10 bg-white border-b border-gray-200">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center text-white mb-4 shadow-lg"
            style={{ backgroundColor: themeColor }}
          >
            <Globe size={48} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">HouseGram Web</h1>
          <p className="text-gray-500 mt-1">Версия 1.0.0 (Beta)</p>
        </div>

        {/* Links Section */}
        <div className="mt-4 bg-white border-y border-gray-200">
          <div className="px-4 py-3 flex items-center gap-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors">
            <HelpCircle size={24} className="text-blue-500" />
            <div className="flex-grow">
              <div className="text-[16px] text-gray-900">Вопросы и ответы</div>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center gap-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors">
            <Shield size={24} className="text-green-500" />
            <div className="flex-grow">
              <div className="text-[16px] text-gray-900">Политика конфиденциальности</div>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center gap-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors">
            <FileText size={24} className="text-orange-500" />
            <div className="flex-grow">
              <div className="text-[16px] text-gray-900">Условия использования</div>
            </div>
          </div>
        </div>

        {/* Developer Info */}
        <div className="mt-4 bg-white border-y border-gray-200">
          <div className="px-4 py-4">
            <h2 className="text-[14px] font-medium text-gray-500 uppercase tracking-wider mb-4">О разработчиках</h2>
            <p className="text-[15px] text-gray-700 leading-relaxed">
              HouseGram Web — это современный, быстрый и безопасный мессенджер, созданный с фокусом на удобство использования и приватность.
            </p>
            <div className="mt-4 flex items-center gap-2 text-gray-500 text-[14px]">
              Сделано с <Heart size={16} className="text-red-500 fill-red-500" /> командой HouseGram
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-4 bg-white border-y border-gray-200">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="px-4 py-3 flex items-center gap-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors">
            <Github size={24} className="text-gray-800" />
            <div className="flex-grow">
              <div className="text-[16px] text-gray-900">Исходный код (GitHub)</div>
            </div>
          </a>
        </div>

        <div className="p-6 text-center text-gray-400 text-[13px]">
          © 2026 HouseGram. Все права защищены.
        </div>
      </div>
    </motion.div>
  );
}
