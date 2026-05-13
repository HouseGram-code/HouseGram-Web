@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 БЫСТРЫЙ ДЕПЛОЙ НА VERCEL
echo ========================================

echo.
echo Отправляем изменения на GitHub...
git add .
git commit -m "Config: добавлены реальные ключи Firebase и Supabase"
git push origin main --force

echo.
echo ✅ Изменения отправлены на GitHub!
echo.
echo Vercel автоматически начнет сборку через несколько секунд.
echo Откройте: https://vercel.com/dashboard
echo.
echo ⚠️ ВАЖНО: Добавьте переменные окружения в Vercel!
echo Откройте файл VERCEL_ENV_COPY.txt и следуйте инструкциям.
echo.
pause
