@echo off
echo ========================================
echo   HouseGram Web - Push to GitHub
echo ========================================
echo.

echo Checking git status...
git status
echo.

echo Adding DEPLOY_TO_GITHUB.md...
git add DEPLOY_TO_GITHUB.md
git add PUSH_TO_GITHUB.bat
git commit -m "docs: Add deployment instructions"
echo.

echo Pushing to GitHub...
echo.
echo Please enter your GitHub credentials when prompted.
echo If you don't have a Personal Access Token, create one at:
echo https://github.com/settings/tokens
echo.

git push -u origin main

echo.
echo ========================================
echo   Done! Check GitHub:
echo   https://github.com/HouseGram-code/HouseGram-Web
echo ========================================
echo.
pause
