/**
 * MyStoriesView - Мои истории
 */

'use client';

import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Eye, Trash2, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firestore/firestore';
import { supabase } from '@/lib/supabase';
import StoryViewer from './StoryViewer';

interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  timestamp: number;
  views: number;
  viewedBy: string[];
}

export default function MyStoriesView() {
  const { setView, themeColor } = useChat();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingStories, setViewingStories] = useState<Story[] | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadMyStories();
  }, []);

  const loadMyStories = async () => {
    if (!auth.currentUser) return;
    
    try {
      const storiesRef = collection(db, 'stories');
      const q = query(
        storiesRef,
        where('userId', '==', auth.currentUser.uid),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const loadedStories: Story[] = [];
      
      snapshot.forEach((doc) => {
        loadedStories.push({ id: doc.id, ...doc.data() } as Story);
      });
      
      setStories(loadedStories);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId: string, mediaUrl: string, mediaType: string) => {
    try {
      // Удаляем из Firestore
      await deleteDoc(doc(db, 'stories', storyId));
      
      // Удаляем файл из Supabase Storage
      const urlParts = mediaUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const folder = mediaType === 'video' ? 'videos' : 'images';
      const filePath = `${folder}/${auth.currentUser?.uid}/${fileName}`;
      
      try {
        await supabase.storage.from('files').remove([filePath]);
      } catch (e) {
        console.log('File already deleted or not found');
      }
      
      // Обновляем список
      setStories(stories.filter(s => s.id !== storyId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Ошибка при удалении истории');
    }
  };

  const handleViewStory = (story: Story) => {
    setViewingStories([story]);
    setCurrentStoryIndex(0);
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} мин назад`;
    } else if (hours < 24) {
      return `${hours} ч назад`;
    } else {
      return new Date(timestamp).toLocaleDateString('ru');
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }} 
      animate={{ x: 0 }} 
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-white flex flex-col z-20"
    >
      {/* Header */}
      <div 
        className="text-white px-4 h-14 flex items-center gap-4 shrink-0"
        style={{ backgroundColor: themeColor }}
      >
        <button onClick={() => setView('settings')} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-grow text-[19px] font-semibold">Мои истории</div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <Calendar size={64} className="opacity-30 mb-4" />
            <p className="text-[18px] font-semibold text-gray-700 mb-2">Нет историй</p>
            <p className="text-[14px] text-gray-500 text-center">
              Создайте свою первую историю на главной странице
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {stories.map((story) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Превью */}
                  <div 
                    onClick={() => handleViewStory(story)}
                    className="relative w-20 h-20 rounded-xl overflow-hidden cursor-pointer shrink-0"
                  >
                    {story.mediaType === 'image' ? (
                      <img 
                        src={story.mediaUrl} 
                        alt="Story" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video 
                        src={story.mediaUrl} 
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                        <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-gray-800 border-b-[6px] border-b-transparent ml-1"></div>
                      </div>
                    </div>
                  </div>

                  {/* Информация */}
                  <div className="flex-grow">
                    <div className="text-[15px] font-medium text-gray-900">
                      {story.mediaType === 'video' ? 'Видео' : 'Фото'}
                    </div>
                    <div className="text-[13px] text-gray-500 mt-1">
                      {formatTime(story.timestamp)}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Eye size={14} className="text-gray-400" />
                      <span className="text-[13px] text-gray-600">{story.views} просмотров</span>
                    </div>
                  </div>

                  {/* Кнопка удаления */}
                  <button
                    onClick={() => setDeleteConfirm(story.id)}
                    className="p-2 rounded-full hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={20} className="text-red-500" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Подтверждение удаления */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-[18px] font-semibold text-gray-900 mb-2">
                Удалить историю?
              </h3>
              <p className="text-[14px] text-gray-600 mb-6">
                Это действие нельзя отменить. История будет удалена навсегда.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    const story = stories.find(s => s.id === deleteConfirm);
                    if (story) {
                      handleDeleteStory(story.id, story.mediaUrl, story.mediaType);
                    }
                  }}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Viewer */}
      <AnimatePresence>
        {viewingStories && auth.currentUser && (
          <StoryViewer
            stories={viewingStories}
            currentIndex={currentStoryIndex}
            onClose={() => setViewingStories(null)}
            onNext={() => setCurrentStoryIndex(prev => Math.min(prev + 1, viewingStories.length - 1))}
            onPrev={() => setCurrentStoryIndex(prev => Math.max(prev - 1, 0))}
            currentUserId={auth.currentUser.uid}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
