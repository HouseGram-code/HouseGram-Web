# Исправление ошибок Firebase

## Проблема
Ошибка: `WebChannelConnection RPC 'Listen' stream errored`

Это происходит когда Firebase Firestore пытается подключиться, но возникают проблемы с сетью или правами доступа.

## Решение

### 1. Создайте документ settings/global в Firestore

Откройте Firebase Console → Firestore Database → Добавьте документ:

```
Collection: settings
Document ID: global
Fields:
  - maintenanceMode: false (boolean)
```

### 2. Проверьте Firestore Rules

Убедитесь что правила разрешают чтение settings/global:

```javascript
match /settings/global {
  allow read: if true; // Anyone can read maintenance mode
  allow write: if isAdmin();
}
```

### 3. Проверьте сетевое подключение

Ошибка может возникать из-за:
- Блокировки firewall
- Проблем с CORS
- Временных проблем с сетью Google

### 4. Временное решение

Если ошибка не критична и не мешает работе приложения, можно игнорировать её. Она не влияет на:
- Отправку подарков (работает через Supabase)
- Просмотр подарков (работает через Supabase)
- Обмен подарков на молнии (работает через Supabase)

## Проверка

После создания документа settings/global ошибка должна исчезнуть. Если ошибка остается:

1. Откройте DevTools → Console
2. Проверьте есть ли другие ошибки
3. Проверьте Network tab - есть ли failed requests к firestore.googleapis.com

## Альтернатива

Если хотите полностью избавиться от Firebase, можно мигрировать все данные на Supabase. Это большая работа, но устранит все проблемы с Firebase.
