# Обновление Firebase Storage Rules

## Шаги для обновления правил вручную:

### 1. Откройте Firebase Console
Перейдите по ссылке: https://console.firebase.google.com/project/housegram-d070d/storage/rules

### 2. Скопируйте и вставьте эти правила:

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    
    // Правила для историй (stories)
    match /stories/{userId}/{fileName} {
      // Все авторизованные пользователи могут читать истории
      allow read: if request.auth != null;
      
      // Пользователи могут загружать только свои истории
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Пользователи могут удалять только свои истории
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Правила для аватаров пользователей
    match /avatars/{userId}/{fileName} {
      allow read: if true; // Публичное чтение
      allow write: if true; // Разрешаем загрузку через API
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Правила для изображений (images) - для загрузки через API
    match /images/{userId}/{fileName} {
      allow read: if true; // Публичное чтение
      allow write: if true; // Разрешаем загрузку через API
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Правила для файлов в чатах
    match /chats/{chatId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      allow delete: if request.auth != null;
    }
    
    // Правила для подарков
    match /gifts/{fileName} {
      allow read: if request.auth != null;
      allow write: if false; // Только через админ панель
      allow delete: if false;
    }
  }
}
```

### 3. Нажмите кнопку "Опубликовать" (Publish)

### 4. Готово!

После этого загрузка файлов через API должна работать.

## Что изменилось:

- ✅ Добавлены правила для папки `images/{userId}/{fileName}`
- ✅ Разрешено публичное чтение для `avatars` и `images`
- ✅ Разрешена загрузка через API (без аутентификации) для `avatars` и `images`
- ✅ Правильная структура путей: `{тип}/{userId}/{имяФайла}`

## Альтернатива - через командную строку:

Если хотите использовать CLI, сначала нужно переавторизоваться:

```bash
firebase login --reauth
firebase deploy --only storage
```
