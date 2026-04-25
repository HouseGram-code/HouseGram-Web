/**
 * Stories - Истории как в Telegram
 */

'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, updateDoc, doc, arrayUnion, getDoc, onSnapshot } from 'firebase/firestore';
import { uploadFile } from '@/lib/storage-wrapper';
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

export default function Stories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [viewingStories, setViewingStories] = useState<Story[] | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadStories();

    // Подписка на обновления историй в реальном времени
    const storiesRef = collection(db, 'stories');
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    const q = query(
      storiesRef,
      where('timestamp', '>', twentyFourHoursAgo),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedStories: Story[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        updatedStories.push({ id: doc.id, ...data } as Story);
      });

      // Обновляем только если изменилось
      setStories(prev => {
        if (prev.length !== updatedStories.length) return updatedStories;
        // Простая проверка
        const prevIds = new Set(prev.map(s => s.id));
        const hasChanges = updatedStories.some(s => !prevIds.has(s.id));
        return hasChanges ? updatedStories : prev;
      });
    }, (error) => {
      console.error('Stories real-time subscription error:', error);
    });

    return () => unsubscribe();
  }, []);

  const loadStories = async () => {
    try {
      const storiesRef = collection(db, 'stories');
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      const q = query(
        storiesRef,
        where('timestamp', '>', twentyFourHoursAgo),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const loadedStories: Story[] = [];
      
      // Собираем уникальных userId для загрузки их данных
      const userIds = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedStories.push({ id: doc.id, ...data } as Story);
        if (data.userId) {
          userIds.add(data.userId);
        }
      });
      
      // Загружаем актуальные данные пользователей
      const userAvatars: Record<string, string | undefined> = {};
      const userNames: Record<string, string> = {};
      
      for (const userId of userIds) {
        try {
          const userDocRef = doc(db, 'users', userId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            userAvatars[userId] = userData.avatarUrl;
            userNames[userId] = userData.name || 'Пользователь';
          }
        } catch (err) {
          console.error(`Error loading user ${userId}:`, err);
        }
      }
      
      // Обновляем истории актуальными данными
      const updatedStories = loadedStories.map(story => ({
        ...story,
        userAvatar: userAvatars[story.userId] || story.userAvatar,
        userName: userNames[story.userId] || story.userName
      }));
      
      setStories(updatedStories);
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  };

  const handleCreateStory = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*'; // Только фото
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && auth.currentUser) {
        setUploading(true);
        try {
          // Проверяем, что это изображение
          if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, загрузите изображение');
            setUploading(false);
            return;
          }
          
          // Проверяем размер файла (макс 10MB)
          if (file.size > 10 * 1024 * 1024) {
            alert('Размер файла не должен превышать 10MB');
            setUploading(false);
            return;
          }
          
          console.log('Uploading story file:', file.name, file.type, file.size);
          
          // Загружаем файл в Supabase Storage
          const uploadResult = await uploadFile(file, auth.currentUser.uid, 'image');
          
          console.log('Upload result:', uploadResult);
          
          // Проверяем доступность URL перед созданием истории
          try {
            const response = await fetch(uploadResult.url, { method: 'HEAD', mode: 'cors' });
            if (!response.ok) {
              console.warn('File URL may not be accessible:', response.status);
            }
          } catch (fetchError) {
            console.warn('Could not verify file URL:', fetchError);
          }
          
          // Получаем данные пользователя из документа пользователя
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          const userDocSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', auth.currentUser.uid)));
          
          let avatarUrl = null;
          let userName = 'Пользователь';
          
          if (!userDocSnap.empty) {
            const userData = userDocSnap.docs[0].data();
            avatarUrl = userData.avatarUrl || null;
            userName = userData.name || 'Пользователь';
          } else {
            // Если не нашли по __name__, пробуем получить напрямую по ID
            try {
              const directUserDoc = await getDoc(userDocRef);
              if (directUserDoc.exists()) {
                const userData = directUserDoc.data();
                avatarUrl = userData.avatarUrl || null;
                userName = userData.name || 'Пользователь';
              }
            } catch (err) {
              console.log('Could not fetch user data directly');
            }
          }
          
          console.log('Creating story with mediaUrl:', uploadResult.url);
          
          // Создаем историю в Firestore
          await addDoc(collection(db, 'stories'), {
            userId: auth.currentUser.uid,
            userName: userName,
            userAvatar: avatarUrl,
            mediaUrl: uploadResult.url,
            mediaType: 'image',
            timestamp: Date.now(),
            views: 0,
            viewedBy: []
          });
          
          console.log('Story created successfully');
          
          // Перезагружаем истории
          await loadStories();
        } catch (error) {
          console.error('Error uploading story:', error);
          alert('Ошибка при загрузке истории: ' + (error as Error).message);
        } finally {
          setUploading(false);
        }
      }
    };
    input.click();
  };

  const handleViewStory = async (story: Story) => {
    // Группируем истории по пользователям
    const userStories = stories.filter(s => s.userId === story.userId);
    setViewingStories(userStories);
    setCurrentStoryIndex(userStories.findIndex(s => s.id === story.id));
    
    // Отмечаем как просмотренную
    if (auth.currentUser && !story.viewedBy.includes(auth.currentUser.uid)) {
      try {
        const storyRef = doc(db, 'stories', story.id);
        await updateDoc(storyRef, {
          views: story.views + 1,
          viewedBy: arrayUnion(auth.currentUser.uid)
        });
      } catch (error) {
        console.error('Error updating story views:', error);
      }
    }
  };

  const closeViewer = () => {
    setViewingStories(null);
    loadStories(); // Обновляем счетчики
  };

  // Группируем истории по пользователям
  const groupedStories = stories.reduce((acc, story) => {
    if (!acc[story.userId]) {
      acc[story.userId] = [];
    }
    acc[story.userId].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  const userStoryGroups = Object.values(groupedStories).map(group => group[0]);

  return (
    <div className="px-4 py-3 border-b border-gray-100 bg-white">
      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        {/* Кнопка создания истории */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          onClick={handleCreateStory}
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
        {userStoryGroups.map((story) => {
          const isViewed = auth.currentUser && story.viewedBy.includes(auth.currentUser.uid);
          
          return (
            <motion.div
              key={story.userId}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleViewStory(story)}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
            >
              <div className="relative">
                {/* Градиентная рамка для непросмотренных историй */}
                <div className={`w-16 h-16 rounded-full ${
                  !isViewed 
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
          );
        })}

        {/* Заглушка если нет историй */}
        {stories.length === 0 && !uploading && (
          <div className="flex items-center justify-center w-full py-2">
            <p className="text-[13px] text-gray-400">
              Пока нет историй. Будьте первым!
            </p>
          </div>
        )}

        {/* Индикатор загрузки */}
        {uploading && (
          <div className="flex items-center justify-center w-full py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Story Viewer */}
      <AnimatePresence>
        {viewingStories && auth.currentUser && (
          <StoryViewer
            stories={viewingStories}
            currentIndex={currentStoryIndex}
            onClose={closeViewer}
            onNext={() => setCurrentStoryIndex(prev => Math.min(prev + 1, viewingStories.length - 1))}
            onPrev={() => setCurrentStoryIndex(prev => Math.max(prev - 1, 0))}
            currentUserId={auth.currentUser.uid}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
