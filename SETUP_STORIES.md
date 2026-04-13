# Настройка историй (Stories)

## ✅ Шаг 1: Обновить Firestore Rules - ВЫПОЛНЕНО

Правила успешно применены!

## ⚠️ Шаг 2: Настроить CORS для Firebase Storage - ТРЕБУЕТСЯ ВРУЧНУЮ

### Способ 1: Через Google Cloud Console (РЕКОМЕНДУЕТСЯ)

1. Откройте https://console.cloud.google.com/storage/browser
2. Войдите с аккаунтом veraloktushina1958@gmail.com
3. Выберите bucket `housegram-d070d.firebasestorage.app`
4. Нажмите на три точки → "Edit CORS configuration"
5. Вставьте этот JSON:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "X-Requested-With"]
  }
]
```

6. Сохраните

### Способ 2: Через Firebase Console

1. Откройте https://console.firebase.google.com/project/housegram-d070d/storage
2. Перейдите в Storage → Files
3. Нажмите на "Rules" вверху
4. Добавьте правила для доступа к файлам:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /stories/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Проверка

После применения CORS:
1. Обновите страницу приложения (Ctrl+F5)
2. Попробуйте создать историю (загрузить фото/видео)
3. Проверьте, что истории отображаются и открываются

## Что было добавлено:

- ✅ Компонент Stories с кнопкой создания
- ✅ Загрузка фото/видео в Firebase Storage
- ✅ Полноэкранный просмотр с прогресс-барами
- ✅ Счетчик просмотров (глаз) для своих историй
- ✅ Автоудаление через 24 часа
- ✅ Группировка по пользователям
- ✅ Firestore Rules применены
- ⚠️ CORS нужно настроить вручную (см. выше)

