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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Политика конфиденциальности</h2>
          <p className="text-[14px] text-gray-500 mb-4">
            Последнее обновление: 7 апреля 2026
          </p>
          <p className="text-[15px] text-gray-600 leading-relaxed">
            В HouseGram мы серьезно относимся к защите вашей конфиденциальности. Эта политика объясняет, как мы собираем, используем и защищаем вашу личную информацию.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Почему мы похожи на Telegram?</h3>
          <p className="text-[15px] text-gray-600 leading-relaxed mb-3">
            HouseGram Web — это аналог будущего мессенджера HouseGram. Мы вдохновляемся лучшими решениями на рынке, чтобы предоставить вам привычный и удобный интерфейс.
          </p>
          <p className="text-[15px] text-gray-600 leading-relaxed font-medium">
            Мы не воруем и не копируем чужой код. Все элементы интерфейса созданы с нуля с уважением к оригинальному дизайну, который стал стандартом индустрии.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Какие данные мы собираем</h3>
            <div className="space-y-3 text-[15px] text-gray-600 leading-relaxed">
              <p>
                <strong>Информация учетной записи:</strong> Имя пользователя, адрес электронной почты, номер телефона (если предоставлен), фотография профиля.
              </p>
              <p>
                <strong>Контент сообщений:</strong> Текстовые сообщения, медиафайлы (фото, видео, аудио), стикеры и другой контент, который вы отправляете.
              </p>
              <p>
                <strong>Технические данные:</strong> IP-адрес, тип устройства, браузер, операционная система, данные о использовании приложения.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Как мы используем ваши данные</h3>
            <div className="space-y-3 text-[15px] text-gray-600 leading-relaxed">
              <p>
                <strong>Предоставление сервиса:</strong> Для обеспечения обмена сообщениями между вами и вашими контактами.
              </p>
              <p>
                <strong>Улучшение качества:</strong> Для анализа и улучшения функциональности приложения.
              </p>
              <p>
                <strong>Безопасность:</strong> Для защиты от мошенничества, спама и других злоупотреблений.
              </p>
              <p>
                <strong>Поддержка:</strong> Для ответа на ваши вопросы и решения технических проблем.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Защита данных</h3>
            <div className="space-y-3 text-[15px] text-gray-600 leading-relaxed">
              <p>
                Мы применяем современные методы шифрования для защиты ваших данных при передаче и хранении. Доступ к вашей личной информации имеют только авторизованные сотрудники.
              </p>
              <p>
                Все медиафайлы и сообщения хранятся в защищенном облачном хранилище Firebase с применением шифрования на уровне транспорта и хранения.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Передача данных третьим лицам</h3>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Мы не продаем и не передаем ваши личные данные третьим лицам для маркетинговых целей. Данные могут быть переданы только:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[15px] text-gray-600 ml-4 mt-3">
              <li>Поставщикам облачных услуг (Firebase, Google Cloud)</li>
              <li>По требованию закона или судебного решения</li>
              <li>Для защиты наших прав и безопасности пользователей</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Хранение данных</h3>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Ваши данные хранятся до тех пор, пока вы используете HouseGram Web. Вы можете в любой момент удалить свою учетную запись и все связанные данные через настройки приложения.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Ваши права</h3>
            <p className="text-[15px] text-gray-600 leading-relaxed mb-3">
              Вы имеете право:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[15px] text-gray-600 ml-4">
              <li>Получить доступ к своим личным данным</li>
              <li>Исправить неточную информацию</li>
              <li>Удалить свою учетную запись и данные</li>
              <li>Ограничить обработку ваших данных</li>
              <li>Экспортировать свои данные</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Cookies и аналитика</h3>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Мы используем cookies для улучшения работы приложения и анализа использования. Вы можете управлять настройками cookies в своем браузере.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Изменения в политике</h3>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Мы можем обновлять эту политику конфиденциальности. О существенных изменениях мы уведомим вас через приложение или по электронной почте.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Контакты</h3>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Если у вас есть вопросы о нашей политике конфиденциальности, свяжитесь с нами через раздел "Информация" в настройках приложения.
            </p>
          </section>
        </div>

        <div className="mt-4 bg-green-50 rounded-xl p-5 border border-green-100">
          <h3 className="text-[16px] font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <ShieldCheck size={20} className="text-green-600" />
            Ваша конфиденциальность — наш приоритет
          </h3>
          <p className="text-[14px] text-gray-600 leading-relaxed">
            Мы постоянно работаем над улучшением защиты ваших данных и соблюдением лучших практик в области информационной безопасности.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
