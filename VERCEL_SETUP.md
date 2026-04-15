# Настройка переменных окружения в Vercel

## Проблема
Сайт собрался, но показывает ошибку: "Application error: a client-side exception has occurred"

Это происходит потому что не настроены переменные окружения Firebase и Supabase.

## Решение

### 1. Зайдите в настройки проекта Vercel
1. Откройте https://vercel.com/dashboard
2. Выберите проект **HouseGram-Web**
3. Перейдите в **Settings** → **Environment Variables**

### 2. Добавьте Firebase переменные

Скопируйте эти переменные из вашего Firebase проекта:

```
NEXT_PUBLIC_FIREBASE_API_KEY=ваш_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ваш_проект.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ваш_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ваш_проект.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=ваш_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=ваш_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Где найти эти данные:**
1. Зайдите в Firebase Console: https://console.firebase.google.com
2. Выберите ваш проект
3. Перейдите в **Project Settings** (⚙️ иконка)
4. Прокрутите вниз до раздела **Your apps**
5. Скопируйте значения из `firebaseConfig`

### 3. Добавьте Supabase переменные

```
NEXT_PUBLIC_SUPABASE_URL=https://ваш_проект.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш_anon_key
```

**Где найти эти данные:**
1. Зайдите в Supabase Dashboard: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **Settings** → **API**
4. Скопируйте:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Добавьте платежные системы (опционально)

Если используете Cryptomus:
```
CRYPTOMUS_MERCHANT_ID=ваш_merchant_id
CRYPTOMUS_API_KEY=ваш_api_key
```

### 5. Пересоберите проект

После добавления всех переменных:
1. Перейдите в **Deployments**
2. Нажмите на последний деплой
3. Нажмите **⋯** (три точки) → **Redeploy**
4. Выберите **Use existing Build Cache** → **Redeploy**

## Проверка

После пересборки сайт должен работать без ошибок. Если ошибка остается:
1. Проверьте консоль браузера (F12)
2. Убедитесь что все переменные добавлены правильно
3. Проверьте что нет опечаток в названиях переменных

## Быстрая команда для локальной разработки

Создайте файл `.env.local` в корне проекта:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=ваш_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ваш_проект.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ваш_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ваш_проект.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=ваш_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=ваш_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ваш_проект.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш_anon_key

# Cryptomus (опционально)
CRYPTOMUS_MERCHANT_ID=ваш_merchant_id
CRYPTOMUS_API_KEY=ваш_api_key
```

**⚠️ Важно:** Не коммитьте `.env.local` в Git! Он уже добавлен в `.gitignore`.
