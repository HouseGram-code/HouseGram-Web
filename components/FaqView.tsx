'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, HelpCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqView() {
  const { setView, themeColor, isGlassEnabled } = useChat();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqItems: FaqItem[] = [
    {
      question: 'Что такое HouseGram Web?',
      answer: 'HouseGram Web — это веб-версия мессенджера HouseGram, которая позволяет общаться с друзьями и близкими прямо из браузера. Никаких установок не требуется!'
    },
    {
      question: 'Безопасны ли мои сообщения?',
      answer: 'Да! Мы используем современные методы шифрования для защиты ваших данных. Все сообщения и медиафайлы надежно защищены от несанкционированного доступа.'
    },
    {
      question: 'Как создать свой стикер?',
      answer: 'Откройте любой чат, нажмите на иконку смайлика 🙂, перейдите во вкладку "Стикеры" и нажмите кнопку "+". Выберите изображение, введите название и готово!'
    },
    {
      question: 'Можно ли изменить тему оформления?',
      answer: 'Конечно! Перейдите в Настройки → Оформление чата. Там вы можете выбрать цвет темы, обои для чата и включить эффект стекла.'
    },
    {
      question: 'Как отправить голосовое сообщение?',
      answer: 'В любом чате нажмите и удерживайте кнопку микрофона. Говорите ваше сообщение, затем отпустите кнопку для отправки.'
    },
    {
      question: 'Что такое "Избранное"?',
      answer: 'Избранное — это личное хранилище для важных сообщений, файлов и медиа. Только вы можете видеть содержимое избранного.'
    },
    {
      question: 'Можно ли редактировать отправленные сообщения?',
      answer: 'Да! Нажмите и удерживайте на своем сообщении, затем выберите "Редактировать". Отредактированные сообщения будут помечены.'
    },
    {
      question: 'Как переслать сообщение?',
      answer: 'Нажмите и удерживайте на сообщении, выберите "Переслать", затем выберите чат, в который хотите переслать сообщение.'
    },
    {
      question: 'Поддерживаются ли GIF-анимации?',
      answer: 'Да! В панели эмодзи есть вкладка "GIF", где вы можете выбрать и отправить анимированные изображения.'
    },
    {
      question: 'Как удалить чат?',
      answer: 'Откройте чат, нажмите на три точки в правом верхнем углу и выберите "Удалить чат". Это действие нельзя отменить.'
    },
    {
      question: 'Можно ли использовать HouseGram на телефоне?',
      answer: 'Да! HouseGram Web адаптирован для мобильных устройств. Просто откройте сайт в браузере вашего телефона.'
    },
    {
      question: 'Как связаться с поддержкой?',
      answer: 'Если у вас возникли проблемы или вопросы, вы можете написать нам через раздел "Информация" в настройках.'
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
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
        <button onClick={() => setView('info')} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow text-[18px] font-medium">Вопросы и ответы</div>
      </div>

      <div className="flex-grow overflow-y-auto p-5 no-scrollbar bg-gray-50">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4" style={{ color: themeColor, backgroundColor: themeColor + '1A' }}>
            <HelpCircle size={32} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Часто задаваемые вопросы</h2>
          <p className="text-[15px] text-gray-600 leading-relaxed">
            Здесь вы найдете ответы на самые популярные вопросы о HouseGram Web.
          </p>
        </div>

        <div className="space-y-2">
          {faqItems.map((item, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-[15px] font-medium text-gray-900 pr-4">{item.question}</span>
                <ChevronDown 
                  size={20} 
                  className={`text-gray-400 transition-transform flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''}`}
                />
              </button>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-5 pb-4 border-t border-gray-100"
                >
                  <p className="text-[15px] text-gray-600 leading-relaxed pt-3">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 bg-blue-50 rounded-xl p-5 border border-blue-100">
          <h3 className="text-[16px] font-semibold text-gray-900 mb-2">Не нашли ответ?</h3>
          <p className="text-[14px] text-gray-600 leading-relaxed">
            Если ваш вопрос не указан выше, свяжитесь с нашей службой поддержки через раздел "Информация" в настройках.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
