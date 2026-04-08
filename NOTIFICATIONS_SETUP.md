# Настройка Push-уведомлений

## Что реализовано

✅ Firebase Cloud Messaging (FCM) для push-уведомлений  
✅ Service Worker для фоновых уведомлений  
✅ Уведомления работают даже когда браузер закрыт  
✅ Автоматическая отправка уведомлений при новых сообщениях  
✅ Звук и вибрация при получении уведомления  
✅ Клик по уведомлению открывает приложение  

## Настройка Firebase Cloud Messaging

### Шаг 1: Получите VAPID ключ

1. Откройте [Firebase Console](https://console.firebase.google.com)
2. Выберите ваш проект
3. Перейдите в Project Settings (⚙️) → Cloud Messaging
4. В разделе "Web Push certificates" нажмите "Generate key pair"
5. Скопируйте сгенерированный ключ

### Шаг 2: Создайте Service Account

1. В Firebase Console перейдите в Project Settings → Service Accounts
2. Нажмите "Generate new private key"
3. Сохраните JSON файл
4. Из этого файла вам понадобятся:
   - `project_id`
   - `client_email`
   - `private_key`

### Шаг 3: Обновите переменные окружения

Откройте файл `.env.local` и замените значения:

```env
# Firebase Cloud Messaging
NEXT_PUBLIC_FIREBASE_VAPID_KEY=ваш-vapid-ключ

# Firebase Admin SDK
FIREBASE_PROJECT_ID=ваш-project-id
FIREBASE_CLIENT_EMAIL=ваш-service-account@project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nваш-private-key\n-----END PRIVATE KEY-----\n"
```

**Важно:** В `FIREBASE_PRIVATE_KEY` сохраните переносы строк как `\n`

### Шаг 4: Обновите Service Worker

Откройте `public/firebase-messaging-sw.js` и замените конфигурацию Firebase на вашу:

```javascript
const firebaseConfig = {
  apiKey: "ваш-api-key",
  authDomain: "ваш-project.firebaseapp.com",
  projectId: "ваш-project-id",
  storageBucket: "ваш-project.appspot.com",
  messagingSenderId: "ваш-sender-id",
  appId: "ваш-app-id"
};
```

### Шаг 5: Добавьте иконки для уведомлений

Создайте следующие файлы в папке `public/`:

- `icon-192x192.png` - основная иконка (192x192px)
- `badge-72x72.png` - значок для уведомлений (72x72px)

## Как это работает

### 1. Инициализация

При входе пользователя:
- Запрашивается разрешение на уведомления
- Регистрируется Service Worker
- Получается FCM токен
- Токен сохраняется в Firestore

### 2. Отправка сообщения

Когда пользователь отправляет сообщение:
- Сообщение сохраняется в Firestore
- Получается FCM токен получателя
- Отправляется запрос на `/api/send-notification`
- API отправляет push-уведомление через FCM

### 3. Получение уведомления

Когда приходит уведомление:
- **Приложение открыто:** Показывается уведомление в браузере
- **Приложение закрыто:** Service Worker показывает уведомление
- **Клик по уведомлению:** Открывается/фокусируется приложение

## Тестирование

### 1. Разрешите уведомления

При первом входе браузер запросит разрешение на уведомления. Нажмите "Разрешить".

### 2. Проверьте FCM токен

Откройте консоль браузера (F12) и найдите сообщение:
```
FCM Token: ваш-токен
```

Если токен есть - уведомления настроены правильно.

### 3. Отправьте тестовое сообщение

1. Откройте приложение в двух вкладках/браузерах
2. Войдите под разными аккаунтами
3. Отправьте сообщение с одного аккаунта
4. На втором должно прийти уведомление

### 4. Проверьте фоновые уведомления

1. Закройте вкладку с приложением
2. Отправьте сообщение с другого устройства
3. Должно прийти системное уведомление

## Устранение неполадок

### Уведомления не приходят

1. **Проверьте разрешения браузера:**
   - Chrome: Настройки → Конфиденциальность → Уведомления
   - Убедитесь что сайт в списке разрешенных

2. **Проверьте Service Worker:**
   - Откройте DevTools → Application → Service Workers
   - Должен быть зарегистрирован `firebase-messaging-sw.js`

3. **Проверьте переменные окружения:**
   - Убедитесь что все ключи правильно скопированы
   - Проверьте что нет лишних пробелов

4. **Проверьте консоль:**
   - Откройте DevTools → Console
   - Ищите ошибки связанные с FCM или Service Worker

### Service Worker не регистрируется

1. **Проверьте HTTPS:**
   - Service Workers работают только на HTTPS (или localhost)
   - Убедитесь что используете `https://` или `localhost`

2. **Очистите кэш:**
   - DevTools → Application → Clear storage
   - Нажмите "Clear site data"
   - Перезагрузите страницу

### Ошибка "Failed to send notification"

1. **Проверьте Firebase Admin SDK:**
   - Убедитесь что Service Account создан
   - Проверьте что `FIREBASE_PRIVATE_KEY` правильно экранирован

2. **Проверьте FCM токен:**
   - Откройте Firestore
   - Найдите документ пользователя
   - Проверьте что поле `fcmToken` существует

## Дополнительные возможности

### Кастомизация уведомлений

Отредактируйте `lib/notifications.ts`:

```typescript
const notificationOptions = {
  body: 'Ваш текст',
  icon: '/your-icon.png',
  badge: '/your-badge.png',
  vibrate: [200, 100, 200], // Паттерн вибрации
  requireInteraction: false, // Не требовать действия
  actions: [ // Кнопки действий
    { action: 'reply', title: 'Ответить' },
    { action: 'close', title: 'Закрыть' }
  ]
};
```

### Отключение уведомлений

Пользователь может отключить уведомления в настройках приложения:
- Настройки → Уведомления → Выключить

## Безопасность

- ✅ FCM токены хранятся в Firestore с правами доступа
- ✅ API endpoint проверяет валидность токена
- ✅ Private key хранится только на сервере
- ✅ VAPID key публичный, но привязан к домену

## Поддержка браузеров

- ✅ Chrome 50+
- ✅ Firefox 44+
- ✅ Edge 17+
- ✅ Safari 16+ (macOS 13+)
- ❌ iOS Safari (не поддерживает Web Push)

## Лимиты

- FCM бесплатно: неограниченно
- Размер payload: до 4KB
- Время жизни уведомления: до 4 недель

## Полезные ссылки

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications](https://web.dev/push-notifications-overview/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
