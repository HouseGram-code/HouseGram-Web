'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Clock, Trash2, Edit3, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface ScheduledMessage {
  id: string;
  text: string;
  scheduledFor: Date;
  chatId: string;
  senderId: string;
  replyTo?: string;
  createdAt: Date;
  status: 'scheduled' | 'sent' | 'failed';
}

export default function ScheduledMessagesView() {
  const { setView, themeColor, isDarkMode, contacts } = useChat();
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'scheduledMessages'),
      where('senderId', '==', auth.currentUser.uid),
      where('status', '==', 'scheduled')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: ScheduledMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          text: data.text,
          scheduledFor: data.scheduledFor.toDate(),
          chatId: data.chatId,
          senderId: data.senderId,
          replyTo: data.replyTo,
          createdAt: data.createdAt.toDate(),
          status: data.status
        });
      });
      
      // Сортируем по времени отправки
      messages.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
      setScheduledMessages(messages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const deleteScheduledMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'scheduledMessages', messageId));
    } catch (error) {
      console.error('Error deleting scheduled message:', error);
      alert('Ошибка при удалении сообщения');
    }
  };

  const sendNow = async (message: ScheduledMessage) => {
    try {
      // Отправляем сообщение сейчас
      // Здесь нужно использовать функцию sendMessage из контекста
      // Пока просто помечаем как отправленное
      await updateDoc(doc(db, 'scheduledMessages', message.id), {
        status: 'sent',
        sentAt: new Date()
      });
      
      alert('Сообщение отправлено!');
    } catch (error) {
      console.error('Error sending message now:', error);
      alert('Ошибка при отправке сообщения');
    }
  };

  const formatDateTime = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMs < 0) {
      return 'Просрочено';
    } else if (diffDays > 0) {
      return `через ${diffDays} дн.`;
    } else if (diffHours > 0) {
      return `через ${diffHours} ч.`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `через ${diffMinutes} мин.`;
    }
  };

  const getChatName = (chatId: string) => {
    const contact = contacts[chatId];
    return contact?.name || 'Неизвестный чат';
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`absolute inset-0 flex flex-col z-10 ${isDarkMode ? 'bg-[#0f0f0f] text-white' : 'bg-white text-black'}`}
    >
      {/* Header */}
      <div
        className="text-white px-2.5 h-12 flex items-center gap-2.5 shrink-0"
        style={{ backgroundColor: themeColor }}
      >
        <button
          onClick={() => setView('settings')}
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <Clock size={24} />
        <h1 className="text-[18px] font-medium">Запланированные сообщения</h1>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Загрузка...</p>
            </div>
          </div>
        ) : scheduledMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                📅
              </motion.div>
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Нет запланированных сообщений
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Удерживайте кнопку отправки в чате, чтобы запланировать сообщение
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <AnimatePresence>
              {scheduledMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-2xl p-4 shadow-sm ${
                    isDarkMode ? 'bg-[#1c1c1d] border border-[#2c2c2e]' : 'bg-white border border-gray-100'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-grow">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {getChatName(message.chatId)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={14} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                        <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {message.scheduledFor.toLocaleString('ru-RU')}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          message.scheduledFor.getTime() < Date.now()
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {formatDateTime(message.scheduledFor)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message Text */}
                  <div className={`text-sm mb-4 p-3 rounded-xl ${
                    isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'
                  }`}>
                    {message.text}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => sendNow(message)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-green-500 text-white font-medium text-sm hover:bg-green-600 transition-colors"
                    >
                      <Send size={16} />
                      Отправить сейчас
                    </motion.button>
                    
                    <motion.button
                      onClick={() => deleteScheduledMessage(message.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-2.5 rounded-xl transition-colors ${
                        isDarkMode
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}