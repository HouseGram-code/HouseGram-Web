// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAZiY1Ai8O8FugQaFfuxVL33SVYrTpZTe8",
  authDomain: "ai-studio-applet-webapp-7235b.firebaseapp.com",
  projectId: "housegram-d070d",
  storageBucket: "ai-studio-applet-webapp-7235b.firebasestorage.app",
  messagingSenderId: "1090968398877",
  appId: "1:1090968398877:web:39d38018e4ecaa63006af4"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Хранилище для группировки уведомлений
let notificationGroups = {};

// Обработка фоновых уведомлений
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const data = payload.data || {};
  const notificationType = data.type || 'message';
  const chatId = data.chatId || 'default';
  const senderName = payload.notification?.title || 'HouseGram';
  const messageText = payload.notification?.body || 'Новое сообщение';
  
  // Группировка уведомлений
  if (!notificationGroups[chatId]) {
    notificationGroups[chatId] = {
      count: 0,
      messages: [],
      lastUpdate: Date.now()
    };
  }
  
  notificationGroups[chatId].count++;
  notificationGroups[chatId].messages.push({
    sender: senderName,
    text: messageText,
    time: Date.now()
  });
  notificationGroups[chatId].lastUpdate = Date.now();
  
  // Формируем текст уведомления
  let notificationTitle = senderName;
  let notificationBody = messageText;
  
  if (notificationGroups[chatId].count > 1) {
    notificationTitle = `${senderName} (${notificationGroups[chatId].count} сообщений)`;
    const recentMessages = notificationGroups[chatId].messages.slice(-3);
    notificationBody = recentMessages.map(m => `${m.sender}: ${m.text}`).join('\n');
  }
  
  // Определяем звук в зависимости от типа
  let soundFile = '/sounds/message.mp3';
  if (notificationType === 'channel_post') {
    soundFile = '/sounds/channel.mp3';
  }
  
  const notificationOptions = {
    body: notificationBody,
    icon: data.senderAvatar || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: chatId, // Группировка по chatId
    renotify: true, // Повторное уведомление при обновлении
    data: {
      ...data,
      url: `/?chat=${chatId}`,
      soundFile: soundFile
    },
    requireInteraction: false,
    vibrate: notificationType === 'channel_post' ? [100, 50, 100] : [200, 100, 200],
    actions: [
      {
        action: 'reply',
        title: '✍️ Ответить',
        icon: '/icons/reply.png'
      },
      {
        action: 'mark_read',
        title: '✓ Прочитано',
        icon: '/icons/check.png'
      },
      {
        action: 'open',
        title: '📱 Открыть',
        icon: '/icons/open.png'
      }
    ],
    silent: false
  };

  // Воспроизводим кастомный звук
  if (data.playSound !== 'false') {
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'PLAY_SOUND',
          sound: soundFile
        });
      });
    });
  }

  // Отправляем статистику доставки
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NOTIFICATION_DELIVERED',
        chatId: chatId,
        timestamp: Date.now(),
        notificationType: notificationType
      });
    });
  });

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event.action);
  
  const data = event.notification.data || {};
  const chatId = data.chatId || '';
  
  event.notification.close();

  if (event.action === 'reply') {
    // Открываем приложение с фокусом на поле ввода
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'OPEN_CHAT_AND_FOCUS',
              chatId: chatId
            });
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(`/?chat=${chatId}&action=reply`);
        }
      })
    );
  } else if (event.action === 'mark_read') {
    // Отмечаем как прочитанное
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clients => {
        if (clients.length > 0) {
          clients[0].postMessage({
            type: 'MARK_AS_READ',
            chatId: chatId
          });
        }
      })
    );
    
    // Очищаем группу уведомлений
    delete notificationGroups[chatId];
    
  } else if (event.action === 'open' || !event.action) {
    // Открываем приложение
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'OPEN_CHAT',
              chatId: chatId
            });
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(data.url || `/?chat=${chatId}`);
        }
      })
    );
    
    // Очищаем группу уведомлений
    delete notificationGroups[chatId];
  } else if (event.action === 'close') {
    // Просто закрываем
    delete notificationGroups[chatId];
  }
  
  // Отправляем статистику клика
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NOTIFICATION_CLICKED',
        chatId: chatId,
        action: event.action || 'open',
        timestamp: Date.now()
      });
    });
  });
});

// Очистка старых групп уведомлений (каждые 5 минут)
setInterval(() => {
  const now = Date.now();
  const FIVE_MINUTES = 5 * 60 * 1000;
  
  Object.keys(notificationGroups).forEach(chatId => {
    if (now - notificationGroups[chatId].lastUpdate > FIVE_MINUTES) {
      delete notificationGroups[chatId];
    }
  });
}, 60000); // Проверяем каждую минуту
