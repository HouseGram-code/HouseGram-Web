'use client';

import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';

export default function TermsView() {
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
        <button onClick={() => setView('info')} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow text-[18px] font-medium">Условия использования</div>
      </div>

      <div className="flex-grow overflow-y-auto p-5 no-scrollbar bg-gray-50">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-4">
            <FileText size={32} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Условия использования HouseGram Web</h2>
          <p className="text-[14px] text-gray-500">
            Последнее обновление: 7 апреля 2026
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle size={20} style={{ color: themeColor }} />
              1. Принятие условий
            </h3>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Используя HouseGram Web, вы соглашаетесь с настоящими условиями использования. Если вы не согласны с какими-либо условиями, пожалуйста, не используйте наш сервис.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle size={20} style={{ color: themeColor }} />
              2. Описание сервиса
            </h3>
            <p className="text-[15px] text-gray-600 leading-relaxed mb-3">
              HouseGram Web — это веб-приложение для обмена мгновенными сообщениями, которое позволяет пользователям:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[15px] text-gray-600 ml-4">
              <li>Отправлять текстовые сообщения</li>
              <li>Обмениваться медиафайлами (изображения, видео, аудио)</li>
              <li>Создавать и использовать стикеры</li>
              <li>Настраивать интерфейс приложения</li>
              <li>Сохранять важные сообщения в "Избранное"</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle size={20} style={{ color: themeColor }} />
              3. Учетная запись пользователя
            </h3>
            <p className="text-[15px] text-gray-600 leading-relaxed mb-3">
              Для использования HouseGram Web вам необходимо создать учетную запись. Вы обязуетесь:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[15px] text-gray-600 ml-4">
              <li>Предоставлять точную и актуальную информацию</li>
              <li>Поддерживать безопасность вашей учетной записи</li>
              <li>Немедленно уведомлять нас о любом несанкционированном использовании</li>
              <li>Не передавать доступ к вашей учетной записи третьим лицам</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle size={20} style={{ color: themeColor }} />
              4. Правила поведения
            </h3>
            <p className="text-[15px] text-gray-600 leading-relaxed mb-3">
              При использовании HouseGram Web запрещается:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[15px] text-gray-600 ml-4">
              <li>Распространять незаконный, оскорбительный или вредоносный контент</li>
              <li>Нарушать права интеллектуальной собственности</li>
              <li>Использовать сервис для спама или мошенничества</li>
              <li>Пытаться получить несанкционированный доступ к системе</li>
              <li>Использовать автоматизированные средства без разрешения</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle size={20} style={{ color: themeColor }} />
              5. Контент пользователей
            </h3>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Вы сохраняете все права на контент, который публикуете в HouseGram Web. Однако, размещая контент, вы предоставляете нам лицензию на его использование для обеспечения работы сервиса.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle size={20} style={{ color: themeColor }} />
              6. Конфиденциальность
            </h3>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Мы серьезно относимся к защите вашей конфиденциальности. Подробная информация о том, как мы собираем и используем ваши данные, доступна в нашей Политике конфиденциальности.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle size={20} style={{ color: themeColor }} />
              7. Ограничение ответственности
            </h3>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              HouseGram Web предоставляется "как есть". Мы не гарантируем бесперебойную работу сервиса и не несем ответственности за любые убытки, возникшие в результате использования или невозможности использования сервиса.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle size={20} style={{ color: themeColor }} />
              8. Изменения условий
            </h3>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Мы оставляем за собой право изменять настоящие условия в любое время. Продолжая использовать сервис после внесения изменений, вы соглашаетесь с новыми условиями.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle size={20} style={{ color: themeColor }} />
              9. Прекращение использования
            </h3>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Вы можете прекратить использование HouseGram Web в любое время, удалив свою учетную запись. Мы также оставляем за собой право приостановить или прекратить ваш доступ при нарушении условий.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle size={20} style={{ color: themeColor }} />
              10. Контактная информация
            </h3>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Если у вас есть вопросы по поводу настоящих условий, свяжитесь с нами через раздел "Информация" в настройках приложения.
            </p>
          </section>
        </div>

        <div className="mt-6 bg-gray-100 rounded-xl p-5">
          <p className="text-[13px] text-gray-500 text-center leading-relaxed">
            Используя HouseGram Web, вы подтверждаете, что прочитали и поняли настоящие условия использования и соглашаетесь их соблюдать.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
