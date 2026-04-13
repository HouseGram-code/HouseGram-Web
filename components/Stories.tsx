/**
 * Stories - Истории как в Telegram
 */

'use client';

import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  imageUrl: string;
  timestamp: number;
  viewed: boolean;
}

export default function Stories() {
  const [stories] = useState<Story[]>([
    // Пока пустой массив - истории будут загружаться из Firebase
  ]);

  return (
    <div className="px-4 py-3 border-b border-gray-100 bg-white">
      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        {/* Кнопка создания истории */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                <Plus size={24} className="text-blue-500" strokeWidth={2.5} />
              </div>
            </div>
          </div>
          <span className="text-[11px] text-gray-600 font-medium">Ваша история</span>
        </motion.div>

        {/* Истории пользователей */}
        {stories.map((story) => (
          <motion.div
            key={story.id}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
          >
            <div className="relative">
              {/* Градиентная рамка для непросмотренных историй */}
              <div className={`w-16 h-16 rounded-full ${
                !story.viewed 
                  ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500' 
                  : 'bg-gray-300'
              } p-[2px]`}>
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                  {story.userAvatar ? (
                    <img 
                      src={story.userAvatar} 
                      alt={story.userName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-[18px]">
                      {story.userName[0]}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <span className="text-[11px] text-gray-600 font-medium max-w-[64px] truncate">
              {story.userName}
            </span>
          </motion.div>
        ))}

        {/* Заглушка если нет историй */}
        {stories.length === 0 && (
          <div className="flex items-center justify-center w-full py-2">
            <p className="text-[13px] text-gray-400">
              Пока нет историй. Будьте первым!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
