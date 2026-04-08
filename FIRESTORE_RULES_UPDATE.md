# Обновление правил Firestore

## Проблема
Ошибка "Missing or insufficient permissions" при обновлении статуса пользователя.

## Решение

Нужно обновить правила Firestore в Firebase Console.

### Шаг 1: Откройте Firebase Console
1. Перейдите на https://console.firebase.google.com
2. Выберите проект **housegram-d070d**

### Шаг 2: Откройте Firestore Rules
1. В левом меню выберите **Firestore Database**
2. Перейдите на вкладку **Rules** (Правила)

### Шаг 3: Замените правила

Найдите секцию `match /users/{userId}` и замените её на:

```javascript
match /users/{userId} {
  allow read: if isAuthenticated();
  
  // User can create their own profile
  allow create: if isOwner(userId) && isValidUser(request.resource.data) && (
    (request.resource.data.role == 'user' && request.resource.data.isBanned == false) ||
    (request.auth.token.email == 'veraloktushina1958@gmail.com')
  );
  
  // User can update their own profile (including status and lastSeen)
  allow update: if isAuthenticated() && isValidUser(request.resource.data) && (
    isAdmin() || 
    (isOwner(userId) && isNotBanned() && 
     (!('role' in resource.data) || request.resource.data.role == resource.data.role) && 
     (!('isBanned' in resource.data) || request.resource.data.isBanned == resource.data.isBanned) &&
     (!('createdAt' in resource.data) || request.resource.data.createdAt == resource.data.createdAt))
  );
  
  allow delete: if isAdmin();
}
```

### Шаг 4: Опубликуйте правила
1. Нажмите кнопку **Publish** (Опубликовать)
2. Подтвердите изменения

### Шаг 5: Проверьте
1. Обновите страницу приложения (F5)
2. Ошибка должна исчезнуть

## Что изменилось

Добавлена возможность обновлять поля `status` и `lastSeen` для собственного профиля пользователя.

Теперь пользователи могут:
- ✅ Обновлять свой статус (online/offline)
- ✅ Обновлять время последнего визита (lastSeen)
- ✅ Обновлять имя, username, bio, avatarUrl
- ❌ НЕ могут изменять role (роль)
- ❌ НЕ могут изменять isBanned (бан)
- ❌ НЕ могут изменять createdAt (дата создания)

## Альтернатива (временное решение)

Если не можете обновить правила сейчас, можно временно отключить обновление статуса:

В файле `context/ChatContext.tsx` закомментируйте строки:
```typescript
// try { await updateDoc(doc(db, 'users', currentUser.uid), { status: 'online', lastSeen: serverTimestamp() }); } catch (e) {}
```

Но это не рекомендуется, так как статусы не будут обновляться.

## Полный файл правил

Полный файл правил находится в `firestore.rules` в корне проекта.
