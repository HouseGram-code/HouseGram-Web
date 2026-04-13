/**
 * StoryViewer - Просмотр историй как в Telegram
 */

'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, ChevronLeft, ChevronRight, MoreVertical, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { supabase } from '@/lib/supabase';

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

interface StoryViewerProps {
  stories: Story[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentUserId: string;
}

export default function StoryViewer({ 
  stories, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrev,
  currentUserId 
}: StoryViewerProps) {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const story = stories[currentIndex];
  const duration = story.mediaType === 'video' ? 15000 : 5000; // 15 сек для видео, 5 сек для фото
  const isOwnStory = story.userId === currentUserId;

  const handleDeleteStory = async () => {
    if (!isOwnStory) return;
    
    setShowDeleteConfirm(true);
    setShowMenu(false);
  };

  const confirmDelete = async () => {
    try {
      // Удаляем из Firestore
      await deleteDoc(doc(db, 'stories', story.id));
      
      // Удаляем файл из Supabase Storage (если используется)
      // Извлекаем путь из URL
      const urlParts = story.mediaUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const folder = story.mediaType === 'video' ? 'videos' : 'images';
      const filePath = `${folder}/${story.userId}/${fileName}`;
      
      try {
        await supabase.storage.from('files').remove([filePath]);
      } catch (e) {
        console.log('File already deleted or not found');
      }
      
      // Закрываем просмотр
      onClose();
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Ошибка при удалении истории');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            onNext();
          } else {
            onClose();
          }
          return 0;
        }
        return prev + (100 / (duration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, currentIndex, duration]);

  useEffect(() => {
    setProgress(0);
    setVideoError(false);
    
    console.log('Story changed:', {
      mediaType: story.mediaType,
      mediaUrl: story.mediaUrl,
      timestamp: story.timestamp
    });
    
    // Безопасное воспроизведение видео
    if (videoRef.current && story.mediaType === 'video') {
      const video = videoRef.current;
      video.currentTime = 0;
      
      console.log('Setting video src:', story.mediaUrl);
      
      // Добавляем обработчики событий для отладки
      const handleLoadedData = () => {
        console.log('Video loaded successfully');
        setVideoError(false);
      };
      
      const handleError = (e: Event) => {
        console.error('Video error event:', e);
        const videoElement = e.target as HTMLVideoElement;
        if (videoElement.error) {
          console.error('Video error code:', videoElement.error.code);
          console.error('Video error message:', videoElement.error.message);
          console.error('Video error MEDIA_ERR codes:', {
            MEDIA_ERR_ABORTED: 1,
            MEDIA_ERR_NETWORK: 2,
            MEDIA_ERR_DECODE: 3,
            MEDIA_ERR_SRC_NOT_SUPPORTED: 4
          });
          
          // Показываем ошибку пользователю
          if (videoElement.error.code === 4) {
            setVideoError(true);
          }
        }
      };
      
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);
      
      // Загружаем видео
      video.load();
      
      // Пытаемся воспроизвести после загрузки
      video.addEventListener('canplay', () => {
        console.log('Video can play, attempting to play...');
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => console.log('Video playing successfully'))
            .catch((error) => {
              if (error.name !== 'AbortError') {
                console.error('Video play error:', error);
              }
            });
        }
      }, { once: true });
      
      // Cleanup
      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('error', handleError);
        video.pause();
      };
    }
  }, [currentIndex, story.mediaType, story.mediaUrl]);

  const handlePause = () => {
    setIsPaused(true);
    if (videoRef.current && story.mediaType === 'video') {
      videoRef.current.pause();
    }
  };

  const handleResume = () => {
    setIsPaused(false);
    if (videoRef.current && story.mediaType === 'video') {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name !== 'AbortError') {
            console.error('Video resume error:', error);
          }
        });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onMouseDown={handlePause}
      onMouseUp={handleResume}
      onTouchStart={handlePause}
      onTouchEnd={handleResume}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white"
              initial={{ width: '0%' }}
              animate={{ 
                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%' 
              }}
              transition={{ duration: 0.1 }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-2">
          {story.userAvatar ? (
            <img 
              src={story.userAvatar} 
              alt={story.userName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-sm">
              {story.userName[0]}
            </div>
          )}
          <div>
            <div className="text-white font-medium text-sm">{story.userName}</div>
            <div className="text-white/70 text-xs">
              {new Date(story.timestamp).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Кнопка меню (три точки) для владельца */}
          {isOwnStory && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              >
                <MoreVertical size={20} />
              </button>
              
              {/* Меню удаления */}
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute right-0 top-10 bg-white rounded-lg shadow-xl overflow-hidden min-w-[150px]"
                  >
                    <button
                      onClick={handleDeleteStory}
                      className="w-full px-4 py-3 flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={18} />
                      <span className="font-medium">Удалить</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Media content */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {videoError ? (
          <div className="text-center p-8">
            <div className="text-white text-[18px] font-semibold mb-4">
              ⚠️ Ошибка воспроизведения
            </div>
            <div className="text-white/70 text-[14px] mb-6">
              Видео в неподдерживаемом формате.<br />
              Пожалуйста, загрузите видео в формате MP4 или WebM.
            </div>
            {isOwnStory && (
              <button
                onClick={handleDeleteStory}
                className="px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                Удалить это видео
              </button>
            )}
          </div>
        ) : story.mediaType === 'image' ? (
          <img 
            src={story.mediaUrl} 
            alt="Story"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            src={story.mediaUrl}
            className="max-w-full max-h-full object-contain"
            playsInline
            muted
            loop
            preload="metadata"
            crossOrigin="anonymous"
            controls={false}
            style={{ backgroundColor: 'black', width: '100%', height: '100%' }}
            onError={(e) => {
              console.error('Video element error:', e);
              const video = e.currentTarget;
              console.error('Video src:', video.src);
              console.error('Video currentSrc:', video.currentSrc);
              console.error('Video error:', video.error);
              if (video.error) {
                console.error('Error code:', video.error.code);
                console.error('Error message:', video.error.message);
              }
            }}
            onLoadedMetadata={(e) => {
              console.log('Video metadata loaded');
              const video = e.currentTarget;
              console.log('Video duration:', video.duration);
              console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
            }}
            onLoadedData={() => console.log('Video data loaded')}
            onCanPlay={() => console.log('Video can play')}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="absolute inset-0 flex">
        <div 
          className="flex-1 cursor-pointer" 
          onClick={(e) => {
            e.stopPropagation();
            if (currentIndex > 0) onPrev();
          }}
        />
        <div 
          className="flex-1 cursor-pointer" 
          onClick={(e) => {
            e.stopPropagation();
            if (currentIndex < stories.length - 1) {
              onNext();
            } else {
              onClose();
            }
          }}
        />
      </div>

      {/* Views counter (only for own stories) */}
      {isOwnStory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 text-white"
        >
          <Eye size={16} />
          <span className="text-sm font-medium">{story.views}</span>
        </motion.div>
      )}

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      {currentIndex < stories.length - 1 && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Подтверждение удаления */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
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
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
