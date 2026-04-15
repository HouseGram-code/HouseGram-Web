@echo off
echo ========================================
echo Настройка Git для автоматической отправки
echo ========================================

set /p TOKEN="Введите ваш GitHub Personal Access Token: "
set /p EMAIL="Введите ваш email: "

git config --global user.name "HouseGram-code"
git config --global user.email "%EMAIL%"
git remote set-url origin https://%TOKEN%@github.com/HouseGram-code/HouseGram-Web.git

echo.
echo Готово! Git настроен для автоматической отправки
pause
