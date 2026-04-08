# 🔥 БЫСТРОЕ ИСПРАВЛЕНИЕ: Missing or insufficient permissions

## ⚡ Проблема
При открытии приложения появляется ошибка:
```
FirebaseError: Missing or insufficient permissions
```

## ✅ Решение (5 минут)

### Вариант 1: Обновить правила Firestore (рекомендуется)

1. Откройте https://console.firebase.google.com/project/housegram-d070d/firestore/rules

2. Найдите строку (примерно строка 70):
   ```javascript
   // User can update their own profile (name, username, bio) but not role/isBanned.
   ```

3. Замените комментарий на:
   ```javascript
   // User can update their own profile (name, username, bio, status, lastSeen) but not role/isBanned.
   ```

4. Нажмите **Publish** (Опубликовать)

5. Обновите страницу приложения (F5)

### Вариант 2: Использовать тестовые правила (только для разработки!)

⚠️ **ВНИМАНИЕ:** Это небезопасно для production!

1. Откройте https://console.firebase.google.com/project/housegram-d070d/firestore/rules

2. Временно замените правила на:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

3. Нажмите **Publish**

4. ⚠️ **НЕ ЗАБУДЬТЕ** вернуть нормальные правила из файла `firestore.rules` после тестирования!

## 🔍 Что произошло?

Мы добавили функцию обновления статуса пользователя (online/offline), но забыли обновить правила Firestore, которые разрешают это действие.

Правила Firestore контролируют, кто и что может делать с данными. Без правильных правил Firebase блокирует все операции.

## 📝 Технические детали

Приложение пытается обновить:
- `status` - статус пользователя (online/offline)
- `lastSeen` - время последнего визита

Но текущие правила разрешают обновлять только:
- `name`, `username`, `bio`, `phone`, `avatarUrl`

Нужно добавить разрешение на обновление `status` и `lastSeen`.

## ✨ После исправления

После обновления правил:
- ✅ Статусы пользователей будут обновляться
- ✅ Будет показываться "в сети" / "был(а) X назад"
- ✅ Ошибка исчезнет
- ✅ Приложение заработает нормально

## 🆘 Если не помогло

1. Проверьте консоль браузера (F12) на другие ошибки
2. Убедитесь, что вы вошли в аккаунт
3. Попробуйте выйти и войти заново
4. Очистите кеш браузера (Ctrl+Shift+Delete)

## 📞 Контакты

Если проблема не решается, проверьте:
- Firebase Console → Firestore → Rules
- Убедитесь, что правила опубликованы
- Проверьте, что используется правильный проект (housegram-d070d)
