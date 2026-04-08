# Деплой на GitHub и Vercel

## ✅ Все изменения готовы к публикации!

### Что было сделано:
- ✅ 79 файлов изменено
- ✅ 27,482 строк кода добавлено
- ✅ Git репозиторий инициализирован
- ✅ Коммит создан

## 🚀 Шаг 1: Загрузка на GitHub

### Вариант A: Через GitHub Desktop (рекомендуется)

1. Откройте **GitHub Desktop**
2. File → Add Local Repository
3. Выберите папку: `D:\HouseGram Beta Web\HouseGram-Web-main\HouseGram-Web-main`
4. Нажмите **Publish repository**
5. Выберите аккаунт **HouseGram-code**
6. Repository name: **HouseGram-Web**
7. Нажмите **Publish repository**

### Вариант B: Через командную строку

```bash
# 1. Настройте Git credentials
git config user.name "Your Name"
git config user.email "your-email@example.com"

# 2. Аутентификация через GitHub CLI (если установлен)
gh auth login

# 3. Или используйте Personal Access Token
# Создайте токен: https://github.com/settings/tokens
# Затем:
git push -u origin main
# Введите username и токен вместо пароля
```

### Вариант C: Через VS Code

1. Откройте папку в VS Code
2. Source Control (Ctrl+Shift+G)
3. Нажмите на "..." → Push
4. Войдите в GitHub при запросе

## 📦 Шаг 2: Настройка Vercel

### 1. Подключите репозиторий

1. Перейдите на https://vercel.com
2. Нажмите **Add New** → **Project**
3. Import Git Repository: **HouseGram-code/HouseGram-Web**
4. Нажмите **Import**

### 2. Настройте переменные окружения

В разделе **Environment Variables** добавьте:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_CONFIG={"projectId":"ai-studio-applet-webapp-7235b","appId":"1:1090968398877:web:39d38018e4ecaa63006af4","apiKey":"AIzaSyAZiY1Ai8O8FugQaFfuxVL33SVYrTpZTe8","authDomain":"ai-studio-applet-webapp-7235b.firebaseapp.com","storageBucket":"ai-studio-applet-webapp-7235b.firebasestorage.app","messagingSenderId":"1090968398877"}

NEXT_PUBLIC_FIREBASE_VAPID_KEY=BJOZ6Oy5f1674RmQZYJuy5ctJtyNW7vNST6MOqnYskESh9NVlb19Ucez-V75y1xLfytaV9MFuceipOcheQE5ppc

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_01gXJNYHTUX-Pvz2eGIKCw_-7qS-tWZ

# Socket.IO (для production нужен отдельный сервер)
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app
```

### 3. Настройте Build Settings

Vercel автоматически определит Next.js, но проверьте:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 4. Деплой

Нажмите **Deploy** и дождитесь завершения (~2-3 минуты)

## 🔧 Шаг 3: Деплой Socket.IO сервера

Socket.IO сервер нужно развернуть отдельно.

### Вариант A: Railway.app (рекомендуется, бесплатно)

1. Перейдите на https://railway.app
2. Нажмите **Start a New Project**
3. Выберите **Deploy from GitHub repo**
4. Выберите **HouseGram-Web**
5. В настройках:
   - **Root Directory**: оставьте пустым
   - **Start Command**: `node server/socket-server.js`
6. Добавьте переменные окружения:
   ```
   SOCKET_PORT=3001
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   ```
7. Нажмите **Deploy**
8. Скопируйте URL (например: `https://housegram-socket.railway.app`)
9. Обновите в Vercel: `NEXT_PUBLIC_SOCKET_URL=https://housegram-socket.railway.app`

### Вариант B: Render.com (бесплатно)

1. Перейдите на https://render.com
2. New → Web Service
3. Connect GitHub: **HouseGram-Web**
4. Настройки:
   - **Name**: housegram-socket
   - **Start Command**: `node server/socket-server.js`
   - **Environment**: Node
5. Добавьте переменные окружения
6. Deploy

## 🎉 Готово!

После деплоя:

1. ✅ Vercel автоматически соберет приложение
2. ✅ Получите URL: `https://housegram-web.vercel.app`
3. ✅ Автоматический деплой при каждом push в main
4. ✅ Preview deployments для pull requests

## 📝 Автоматический деплой

Теперь при каждом `git push`:
- Vercel автоматически соберет и задеплоит
- Получите уведомление в GitHub
- Preview URL для тестирования

## 🔄 Обновление кода

```bash
# 1. Внесите изменения
# 2. Коммит
git add .
git commit -m "Your message"

# 3. Push
git push origin main

# Vercel автоматически задеплоит!
```

## 🐛 Troubleshooting

### Build fails на Vercel

1. Проверьте логи в Vercel Dashboard
2. Убедитесь, что все переменные окружения добавлены
3. Проверьте `package.json` dependencies

### Socket.IO не подключается

1. Проверьте CORS настройки
2. Убедитесь, что Socket.IO сервер запущен
3. Проверьте `NEXT_PUBLIC_SOCKET_URL` в Vercel

### Supabase ошибки

1. Проверьте URL и ключ API
2. Убедитесь, что таблицы созданы (запустите `supabase-schema.sql`)
3. Проверьте RLS политики

## 📚 Полезные ссылки

- Vercel Dashboard: https://vercel.com/dashboard
- Railway Dashboard: https://railway.app/dashboard
- Supabase Dashboard: https://supabase.com/dashboard
- GitHub Repo: https://github.com/HouseGram-code/HouseGram-Web

---

**Текущий статус:**
- ✅ Код готов к деплою
- ✅ Git репозиторий настроен
- ✅ Коммит создан
- ⏳ Нужно: Push на GitHub
- ⏳ Нужно: Настроить Vercel
- ⏳ Нужно: Развернуть Socket.IO сервер
