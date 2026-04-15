@echo off
echo ========================================
echo Настройка переменных окружения в Vercel
echo ========================================

echo.
echo Устанавливаем Vercel CLI...
call npm install -g vercel

echo.
echo Логинимся в Vercel...
call vercel login

echo.
echo Добавляем переменные окружения...

call vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
echo AIzaSyDo2yWS2PFYCceBoiGnDXiI_-kAC_ZX3pc

call vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
echo housegram-d070d.firebaseapp.com

call vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
echo housegram-d070d

call vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
echo housegram-d070d.firebasestorage.app

call vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
echo 812659108162

call vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
echo 1:812659108162:web:3282da59b84348eb7900db

call vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production
echo G-1GLFYH9CG6

echo.
echo ВАЖНО: Добавьте Supabase URL вручную!
echo Найдите его в Supabase Dashboard - Settings - API
echo.

call vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo sb_publishable_Y7gXsSIbeuQaWumd--CR1w_FUO1c6hNPublishable

echo.
echo ========================================
echo Готово! Теперь запустите: vercel --prod
echo ========================================
pause
