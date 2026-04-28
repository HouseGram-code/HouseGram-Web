'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Calendar, Send } from 'lucide-react';

interface ScheduleMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: Date) => void;
  themeColor: string;
  isDarkMode?: boolean;
}

export default function ScheduleMessageModal({
  isOpen,
  onClose,
  onSchedule,
  themeColor,
  isDarkMode = false
}: ScheduleMessageModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [quickOption, setQuickOption] = useState<string | null>(null);

  // Инициализация с текущим временем + 1 час
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(now.getHours() + 1);
      
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
      setSelectedTime(tomorrow.toTimeString().slice(0, 5));
      setQuickOption(null);
    }
  }, [isOpen]);

  const quickOptions = [
    {
      id: 'in1hour',
      label: 'Через 1 час',
      getDate: () => {
        const date = new Date();
        date.setHours(date.getHours() + 1);
        return date;
      }
    },
    {
      id: 'in3hours',
      label: 'Через 3 часа',
      getDate: () => {
        const date = new Date();
        date.setHours(date.getHours() + 3);
        return date;
      }
    },
    {
      id: 'tomorrow9am',
      label: 'Завтра в 9:00',
      getDate: () => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        date.setHours(9, 0, 0, 0);
        return date;
      }
    },
    {
      id: 'tomorrow6pm',
      label: 'Завтра в 18:00',
      getDate: () => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        date.setHours(18, 0, 0, 0);
        return date;
      }
    }
  ];

  const handleQuickOption = (option: typeof quickOptions[0]) => {
    setQuickOption(option.id);
    const date = option.getDate();
    setSelectedDate(date.toISOString().split('T')[0]);
    setSelectedTime(date.toTimeString().slice(0, 5));
  };

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) return;
    
    const scheduledDate = new Date(`${selectedDate}T${selectedTime}`);
    const now = new Date();
    
    if (scheduledDate <= now) {
      alert('Время отправки должно быть в будущем');
      return;
    }
    
    onSchedule(scheduledDate);
    onClose();
  };

  const getScheduledDateTime = () => {
    if (!selectedDate || !selectedTime) return null;
    return new Date(`${selectedDate}T${selectedTime}`);
  };

  const formatScheduledTime = () => {
    const date = getScheduledDateTime();
    if (!date) return '';
    
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `через ${diffDays} дн.`;
    } else if (diffHours > 0) {
      return `через ${diffHours} ч.`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `через ${diffMinutes} мин.`;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ${
            isDarkMode ? 'bg-[#1c1c1d] text-white' : 'bg-white text-gray-900'
          }`}
        >
          {/* Header */}
          <div 
            className="px-6 py-4 text-white relative overflow-hidden"
            style={{ backgroundColor: themeColor }}
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <Clock size={24} />
                <h2 className="text-[20px] font-semibold">Запланировать</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-32 h-32 rounded-full bg-white/10"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.1, 0.3],
                  }}
                  transition={{
                    duration: 3 + i,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Quick Options */}
            <div className="mb-6">
              <h3 className={`text-[16px] font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Быстрый выбор
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {quickOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => handleQuickOption(option)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 rounded-xl text-[14px] font-medium transition-all ${
                      quickOption === option.id
                        ? `text-white shadow-lg`
                        : isDarkMode
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: quickOption === option.id ? themeColor : undefined
                    }}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Custom Date & Time */}
            <div className="mb-6">
              <h3 className={`text-[16px] font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Выбрать время
              </h3>
              
              <div className="space-y-3">
                {/* Date Input */}
                <div>
                  <label className={`block text-[13px] font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Дата
                  </label>
                  <div className="relative">
                    <Calendar size={18} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setQuickOption(null);
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-[15px] ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-white focus:border-gray-600'
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-gray-300'
                      } focus:outline-none transition-colors`}
                    />
                  </div>
                </div>

                {/* Time Input */}
                <div>
                  <label className={`block text-[13px] font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Время
                  </label>
                  <div className="relative">
                    <Clock size={18} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => {
                        setSelectedTime(e.target.value);
                        setQuickOption(null);
                      }}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-[15px] ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-white focus:border-gray-600'
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-gray-300'
                      } focus:outline-none transition-colors`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            {selectedDate && selectedTime && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl mb-6 ${
                  isDarkMode ? 'bg-gray-800/50' : 'bg-blue-50'
                }`}
              >
                <div className={`text-[13px] font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                  Сообщение будет отправлено:
                </div>
                <div className={`text-[15px] font-semibold ${isDarkMode ? 'text-white' : 'text-blue-800'}`}>
                  {getScheduledDateTime()?.toLocaleString('ru-RU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className={`text-[12px] ${isDarkMode ? 'text-gray-500' : 'text-blue-500'}`}>
                  {formatScheduledTime()}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Отмена
              </button>
              <motion.button
                onClick={handleSchedule}
                disabled={!selectedDate || !selectedTime}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2 ${
                  !selectedDate || !selectedTime
                    ? 'opacity-50 cursor-not-allowed'
                    : 'shadow-lg hover:shadow-xl'
                }`}
                style={{ 
                  backgroundColor: (!selectedDate || !selectedTime) ? '#9CA3AF' : themeColor 
                }}
              >
                <Send size={18} />
                Запланировать
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}