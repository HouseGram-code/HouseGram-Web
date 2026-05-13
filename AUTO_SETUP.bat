@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 АВТОМАТИЧЕСКАЯ НАСТРОЙКА HOUSEGRAM
echo ========================================

echo.
echo Шаг 1: Проверка Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js не установлен!
    echo Скачайте с https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js установлен

echo.
echo Шаг 2: Установка зависимостей...
call npm install
if errorlevel 1 (
    echo ❌ Ошибка установки зависимостей
    pause
    exit /b 1
)
echo ✅ Зависимости установлены

echo.
echo Шаг 3: Проверка .env.local...
if exist .env.local (
    echo ✅ Файл .env.local найден
) else (
    echo ❌ Файл .env.local не найден
    echo Создаю файл...
    copy .env.example .env.local
)

echo.
echo Шаг 4: Установка Vercel CLI...
call npm install -g vercel
if errorlevel 1 (
    echo ⚠️ Не удалось установить Vercel CLI глобально
    echo Попробуем локально...
    call npm install vercel --save-dev
)
echo ✅ Vercel CLI установлен

echo.
echo Шаг 5: Логин в Vercel...
echo Откроется браузер для входа в Vercel...
timeout /t 3 >nul
call vercel login

echo.
echo Шаг 6: Связывание проекта с Vercel...
call vercel link

echo.
echo Шаг 7: Добавление переменных окружения...
echo.

echo Добавляем Firebase переменные...
echo AIzaSyDo2yWS2PFYCceBoiGnDXiI_-kAC_ZX3pc | call vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
echo housegram-d070d.firebaseapp.com | call vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
echo housegram-d070d | call vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
echo housegram-d070d.firebasestorage.app | call vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
echo 812659108162 | call vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
echo 1:812659108162:web:3282da59b84348eb7900db | call vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
echo G-1GLFYH9CG6 | call vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production

echo.
echo Добавляем Supabase переменные...
echo https://advrigpttccbigwzfcci.supabase.co | call vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdnJpZ3B0dGNjYmlnd3pmY2NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4OTk3NzAsImV4cCI6MjA1MDQ3NTc3MH0.sb_publishable_Y7gXsSIbeuQaWumd--CR1w_FUO1c6hNPublishable | call vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

echo.
echo ✅ Переменные окружения добавлены!

echo.
echo Шаг 8: Деплой на Vercel...
echo Запускаем продакшн деплой...
call vercel --prod

echo.
echo ========================================
echo ✅ ГОТОВО! Проект развернут на Vercel!
echo ========================================
echo.
echo Ваш сайт доступен по ссылке выше ☝️
echo.
pause
