# Руководство по пригласительным ссылкам

## Обзор

Система пригласительных ссылок позволяет создавать уникальные ссылки для приглашения пользователей в каналы, как в Telegram.

## Как это работает

### 1. Создание канала

При создании канала автоматически генерируется:
- Уникальный 8-символьный код приглашения (например: `aB3xY9Zk`)
- Пригласительная ссылка: `https://house-gram-site.vercel.app/join/aB3xY9Zk`

### 2. Структура данных

#### Коллекция `channels`
```javascript
{
  id: "channel_1234567890",
  name: "Мой канал",
  description: "Описание канала",
  avatarUrl: "https://...",
  createdBy: "user_uid",
  createdAt: timestamp,
  subscribersCount: 1,
  link: "https://house-gram-site.vercel.app/join/aB3xY9Zk",
  inviteCode: "aB3xY9Zk",
  subscribers: ["user_uid"]
}
```

#### Коллекция `invites`
```javascript
{
  // Document ID = inviteCode
  channelId: "channel_1234567890",
  createdAt: timestamp,
  createdBy: "user_uid"
}
```

### 3. Страница приглашения

URL: `/join/[inviteCode]`

Функции:
- ✅ Показывает информацию о канале (название, описание, количество подписчиков)
- ✅ Проверяет, подписан ли пользователь уже
- ✅ Кнопка "Присоединиться" или "Открыть приложение"
- ✅ Кнопка "Отмена" для отклонения приглашения
- ✅ Красивый градиентный дизайн
- ✅ Адаптивная верстка

### 4. Информация о канале

В `ChannelInfoView` доступны:
- **Копировать** - копирует ссылку в буфер обмена
- **Поделиться** - использует Web Share API (если доступен)
- **Открыть** - открывает ссылку в новой вкладке

## Использование

### Создание канала с приглашением

```typescript
const inviteCode = generateInviteCode(); // Генерирует 8-символьный код
const link = `https://house-gram-site.vercel.app/join/${inviteCode}`;

// Создаем канал
await setDoc(doc(db, 'channels', channelId), {
  // ... другие поля
  link,
  inviteCode,
  subscribers: [currentUserId]
});

// Создаем документ приглашения
await setDoc(doc(db, 'invites', inviteCode), {
  channelId,
  createdAt: serverTimestamp(),
  createdBy: currentUserId
});
```

### Присоединение к каналу

```typescript
await updateDoc(doc(db, 'channels', channelId), {
  subscribers: arrayUnion(userId),
  subscribersCount: increment(1)
});
```

## Безопасность

### Firestore Rules

```javascript
match /invites/{inviteCode} {
  allow read: if true; // Любой может прочитать приглашение
  
  allow create: if isAuthenticated() && isNotBanned() &&
                request.resource.data.createdBy == request.auth.uid;
  
  allow delete: if isAuthenticated() && (
    request.auth.uid == resource.data.createdBy ||
    isAdmin()
  );
}
```

## Особенности

### ✅ Реализовано

- Генерация уникальных кодов приглашений
- Красивая страница приглашения с градиентами
- Проверка подписки пользователя
- Кнопки "Присоединиться" / "Отмена"
- Копирование, поделиться, открыть ссылку
- Адаптивный дизайн
- Интеграция с Firebase
- Правила безопасности Firestore

### 🔄 Можно улучшить

- Ограничение срока действия приглашений
- Ограничение количества использований
- Статистика переходов по ссылке
- QR-коды для приглашений
- Персонализированные приглашения
- Предпросмотр Open Graph для соцсетей

## Примеры использования

### Поделиться каналом

1. Откройте информацию о канале
2. Нажмите "Поделиться"
3. Выберите способ отправки (если поддерживается Web Share API)
4. Или скопируйте ссылку вручную

### Присоединиться к каналу

1. Получите ссылку приглашения
2. Откройте её в браузере
3. Увидите информацию о канале
4. Нажмите "Присоединиться"
5. Автоматически перенаправит в приложение

## Технические детали

### Генерация кода

```typescript
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
```

### Проверка существования

```typescript
const inviteDoc = await getDoc(doc(db, 'invites', inviteCode));
if (!inviteDoc.exists()) {
  // Приглашение не найдено
}
```

### Web Share API

```typescript
if (navigator.share) {
  await navigator.share({
    title: `Присоединяйтесь к каналу "${channelName}"`,
    text: description,
    url: inviteLink
  });
}
```

## Домен

Текущий домен: `house-gram-site.vercel.app`

Все ссылки используют этот домен для единообразия и работы на production.

## Поддержка

Система полностью интегрирована с:
- Firebase Firestore
- Next.js App Router
- Dynamic Routes
- TypeScript
- Framer Motion (анимации)

Готово к использованию! 🚀
