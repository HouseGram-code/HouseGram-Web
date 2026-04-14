@echo off
echo ========================================
echo АВТОМАТИЧЕСКАЯ отправка на GitHub
echo ========================================

git add .
git commit -m "Auto update: %date% %time%"
git push origin main --force

echo.
echo Готово! Изменения отправлены
timeout /t 2 >nul
exit
