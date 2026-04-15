import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { getMessaging } from 'firebase/messaging';

let messaging: Messaging | null = null;

// Статистика уведомлений
interface NotificationStats {
  delivered: number;
  clicked: number;
  dismissed: number;
  byType: {
    message: number;
    channel_post: number;
  };
}

let notificationStats: NotificationStats = {
  delivered: 0,
  clicked: 0,
  dismissed: 0,
  byType: {
    message: 0,
    channel_post: 0
  }
};

// Загрузка статистики из localStorage
if (typeof window !== 'undefined') {
  const savedStats = localStorage.getItem('housegram_notification_stats');
  if (savedStats) {
    try {
      notificationStats = JSON.parse(savedStats);
    } catch (e) {
      console.error('Failed to parse notification stats:', e);
    }
  }
}

// Сохранение статистики
const saveStats = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('housegram_notification_stats', JSON.stringify(notificationStats));
  }
};

// Воспроизведение кастомного звука
const playNotificationSound = (soundFile: string) => {
  try {
    const audio = new Audio(soundFile);
    audio.volume = 0.5;
    audio.play().catch(e => console.error('Failed to play sound:', e));
  } catch (e) {
    console.error('Error playing notification sound:', e);
  }
};

// Инициализация FCM
export const initializeNotifications = async (userId: string): Promise<string | null> => {
  try {
    // Проверяем поддержку уведомлений
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    // Проверяем поддержку Service Worker
    if (!('serviceWorker' in navigator)) {
      console.log('This browser does not support service workers');
      return null;
    }

    // Запрашиваем разрешение на уведомления
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Ждём пока пользователь войдёт в систему
    if (!auth.currentUser) {
      console.log('User not authenticated, cannot initialize notifications');
      return null;
    }

    messaging = getMessaging();

    // Регистрируем Service Worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered:', registration);

    // Ждём активации Service Worker через готовый Promise
    await navigator.serviceWorker.ready;
    console.log('Service Worker is active');
    
    // Проверяем VAPID ключ
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('VAPID key is not set! Check NEXT_PUBLIC_FIREBASE_VAPID_KEY in .env.local');
      return null;
    }
    console.log('VAPID key found:', vapidKey.substring(0, 20) + '...');

    // Слушаем сообщения от Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, chatId, action, notificationType, soundFile } = event.data;
      
      if (type === 'NOTIFICATION_DELIVERED') {
        notificationStats.delivered++;
        if (notificationType && notificationStats.byType[notificationType as keyof typeof notificationStats.byType] !== undefined) {
          notificationStats.byType[notificationType as keyof typeof notificationStats.byType]++;
        }
        saveStats();
      } else if (type === 'NOTIFICATION_CLICKED') {
        notificationStats.clicked++;
        saveStats();
      } else if (type === 'PLAY_SOUND' && soundFile) {
        playNotificationSound(soundFile);
      } else if (type === 'OPEN_CHAT' && chatId) {
        // Открываем чат
        window.dispatchEvent(new CustomEvent('openChat', { detail: { chatId } }));
      } else if (type === 'OPEN_CHAT_AND_FOCUS' && chatId) {
        // Открываем чат и фокусируемся на поле ввода
        window.dispatchEvent(new CustomEvent('openChatAndFocus', { detail: { chatId } }));
      } else if (type === 'MARK_AS_READ' && chatId) {
        // Отмечаем как прочитанное
        window.dispatchEvent(new CustomEvent('markAsRead', { detail: { chatId } }));
      }
    });

    // Получаем FCM токен
    try {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (token) {
        console.log('FCM Token:', token);
        
        // Сохраняем токен в Firestore
        await updateDoc(doc(db, 'users', userId), {
          fcmToken: token,
          fcmTokenUpdatedAt: new Date()
        });

        return token;
      }
    } catch (tokenError: any) {
      console.error('Error getting FCM token:', tokenError);
      
      // Если ошибка связана с VAPID ключом
      if (tokenError.code === 'messaging/invalid-vapid-key') {
        console.error('Invalid VAPID key. Please check NEXT_PUBLIC_FIREBASE_VAPID_KEY');
      }
      
      // Пробуем без указания Service Worker (браузер выберет сам)
      try {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
        
        if (token) {
          console.log('FCM Token (fallback):', token);
          await updateDoc(doc(db, 'users', userId), {
            fcmToken: token,
            fcmTokenUpdatedAt: new Date()
          });
          return token;
        }
      } catch (fallbackError) {
        console.error('Fallback token error:', fallbackError);
      }
    }

    return null;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return null;
  }
};

// Обработка уведомлений на переднем плане
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    
    const data = payload.data || {};
    const notificationType = data.type || 'message';
    
    // Воспроизводим звук
    const soundFile = notificationType === 'channel_post' ? '/sounds/channel.mp3' : '/sounds/message.mp3';
    playNotificationSound(soundFile);
    
    // Показываем уведомление даже когда приложение открыто
    if (Notification.permission === 'granted') {
      const notificationTitle = payload.notification?.title || 'HouseGram';
      const notificationOptions = {
        body: payload.notification?.body || 'Новое сообщение',
        icon: data.senderAvatar || '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: data.chatId || 'default',
        data: payload.data,
        requireInteraction: false,
        vibrate: notificationType === 'channel_post' ? [100, 50, 100] : [200, 100, 200]
      };

      const notification = new Notification(notificationTitle, notificationOptions);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (data.chatId) {
          window.dispatchEvent(new CustomEvent('openChat', { detail: { chatId: data.chatId } }));
        }
      };
      
      // Статистика
      notificationStats.delivered++;
      if (notificationType && notificationStats.byType[notificationType as keyof typeof notificationStats.byType] !== undefined) {
        notificationStats.byType[notificationType as keyof typeof notificationStats.byType]++;
      }
      saveStats();
    }

    callback(payload);
  });
};

// Отправка уведомления о новом сообщении
export const sendMessageNotification = async (
  recipientUserId: string,
  senderName: string,
  messageText: string,
  chatId: string,
  senderAvatar?: string
) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', recipientUserId));
    
    if (!userDoc.exists()) {
      console.log('User not found');
      return;
    }

    const fcmToken = userDoc.data().fcmToken;
    if (!fcmToken) {
      console.log('User does not have FCM token');
      return;
    }

    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: fcmToken,
        title: senderName,
        body: messageText.substring(0, 100),
        data: {
          chatId,
          type: 'message',
          senderAvatar: senderAvatar || ''
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    console.log('Message notification sent successfully');
  } catch (error) {
    console.error('Error sending message notification:', error);
  }
};

// Отправка уведомления о новом посте в канале
export const sendChannelPostNotification = async (
  channelId: string,
  channelName: string,
  postText: string,
  channelAvatar?: string
) => {
  try {
    // Получаем всех подписчиков канала
    const channelDoc = await getDoc(doc(db, 'channels', channelId));
    
    if (!channelDoc.exists()) {
      console.log('Channel not found');
      return;
    }

    const subscribers = channelDoc.data().subscribers || [];
    const createdBy = channelDoc.data().createdBy;
    
    // Отправляем уведомления всем подписчикам (кроме автора)
    const notifications = subscribers
      .filter((userId: string) => userId !== createdBy)
      .map(async (userId: string) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (!userDoc.exists()) return;
          
          const fcmToken = userDoc.data().fcmToken;
          if (!fcmToken) return;

          await fetch('/api/send-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: fcmToken,
              title: `📢 ${channelName}`,
              body: postText.substring(0, 100),
              data: {
                chatId: channelId,
                type: 'channel_post',
                senderAvatar: channelAvatar || ''
              }
            })
          });
        } catch (error) {
          console.error(`Failed to send notification to user ${userId}:`, error);
        }
      });

    await Promise.all(notifications);
    console.log('Channel post notifications sent successfully');
  } catch (error) {
    console.error('Error sending channel post notifications:', error);
  }
};

// Получение статистики уведомлений
export const getNotificationStats = (): NotificationStats => {
  return { ...notificationStats };
};

// Сброс статистики
export const resetNotificationStats = () => {
  notificationStats = {
    delivered: 0,
    clicked: 0,
    dismissed: 0,
    byType: {
      message: 0,
      channel_post: 0
    }
  };
  saveStats();
};

// Проверка статуса разрешения уведомлений
export const checkNotificationPermission = (): NotificationPermission | null => {
  if (!('Notification' in window)) {
    return null;
  }
  return Notification.permission;
};

// Запрос разрешения на уведомления
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};
