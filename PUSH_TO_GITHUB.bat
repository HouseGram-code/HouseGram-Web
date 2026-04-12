@echo off
chcp 65001 >nul
echo ========================================
echo   HouseGram Web - Push to GitHub
echo ========================================
echo.

echo Проверка статуса git...
git status
echo.

set /p commit_msg="Введите сообщение коммита (или Enter для автоматического): "

if "%commit_msg%"=="" (
    set commit_msg=feat: Добавлена система ручного пополнения молний через поддержку
)

echo.
echo Добавление файлов...
git add .
echo.

echo Создание коммита: %commit_msg%
git commit -m "%commit_msg%"
echo.

echo Отправка на GitHub...
echo.
echo Если потребуется, введите ваши учетные данные GitHub.
echo Для Personal Access Token: https://github.com/settings/tokens
echo.

git push -u origin main

echo.
echo ========================================
echo   Готово! Проверьте GitHub:
echo   https://github.com/HouseGram-code/HouseGram-Web
echo ========================================
echo.
pause
