# Настройка CORS для Firebase Storage

## Проблема
При загрузке файлов в Firebase Storage возникает ошибка CORS:
```
Access to XMLHttpRequest has been blocked by CORS policy
```

## Решение

### Вариант 1: Через Google Cloud Console (Рекомендуется)

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите проект `housegram-d070d`
3. Перейдите в **Cloud Storage** → **Buckets**
4. Найдите bucket `housegram-d070d.firebasestorage.app`
5. Нажмите на три точки → **Edit bucket permissions**
6. Добавьте CORS конфигурацию:

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

### Вариант 2: Через gsutil (Командная строка)

1. Установите [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)

2. Авторизуйтесь:
```bash
gcloud auth login
```

3. Установите проект:
```bash
gcloud config set project housegram-d070d
```

4. Примените CORS конфигурацию:
```bash
gsutil cors set firebase-storage-cors.json gs://housegram-d070d.firebasestorage.app
```

5. Проверьте конфигурацию:
```bash
gsutil cors get gs://housegram-d070d.firebasestorage.app
```

### Вариант 3: Альтернативное решение - использовать только MEGA

Если CORS настроить не получается, можно:
1. Создать новый аккаунт MEGA с правильным паролем
2. Обновить credentials в `.env.local`
3. MEGA не требует CORS настройки

## Проверка

После применения CORS:
1. Перезагрузите страницу
2. Попробуйте загрузить баннер
3. Проверьте консоль - ошибок CORS быть не должно

## Текущий статус

- ✅ MEGA fallback работает
- ❌ Firebase Storage требует CORS настройки
- ✅ Кнопка редактирования баннера видна
