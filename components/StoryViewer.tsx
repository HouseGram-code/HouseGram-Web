/**
 * StoryViewer - Просмотр историй как в Telegram
 */

'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const story = stories[currentIndex];
  const duration = story.mediaType === 'video' ? 15000 : 5000; // 15 сек для видео, 5 сек для фото

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
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  }, [currentIndex]);

  const handlePause = () => {
    setIsPaused(true);
    if (videoRef.current) videoRef.current.pause();
  };

  const handleResume = () => {
    setIsPaused(false);
    if (videoRef.current) videoRef.current.play();
  };

  const isOwnStory = story.userId === currentUserId;

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

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Media content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {story.mediaType === 'image' ? (
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
    </motion.div>
  );
}
