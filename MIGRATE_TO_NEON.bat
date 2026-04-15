@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 МИГРАЦИЯ НА NEON (1 КЛИК)
echo ========================================
echo.

echo 📋 ШАГ 1: Установка Neon SDK...
call npm install @neondatabase/serverless
if errorlevel 1 (
    echo ❌ Ошибка установки
    pause
    exit /b 1
)
echo ✅ Neon SDK установлен
echo.

echo 📋 ШАГ 2: Откройте Neon Console...
echo.
echo 1. Откройте: https://console.neon.tech
echo 2. Создайте проект (Create Project)
echo 3. Скопируйте Connection String
echo.
echo Пример: postgresql://user:pass@ep-name.eu-central-1.aws.neon.tech/neondb
echo.
set /p DATABASE_URL="Вставьте Connection String: "

echo.
echo 📋 ШАГ 3: Обновление .env.local...
(
echo # Firebase Configuration
echo NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDo2yWS2PFYCceBoiGnDXiI_-kAC_ZX3pc
echo NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=housegram-d070d.firebaseapp.com
echo NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://housegram-d070d-default-rtdb.firebaseio.com
echo NEXT_PUBLIC_FIREBASE_PROJECT_ID=housegram-d070d
echo NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=housegram-d070d.firebasestorage.app
echo NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=812659108162
echo NEXT_PUBLIC_FIREBASE_APP_ID=1:812659108162:web:3282da59b84348eb7900db
echo NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-1GLFYH9CG6
echo.
echo # Neon Database
echo DATABASE_URL=%DATABASE_URL%
) > .env.local
echo ✅ .env.local обновлен
echo.

echo 📋 ШАГ 4: Создание SQL файла для Neon...
(
echo -- Таблица пользователей
echo CREATE TABLE IF NOT EXISTS users ^(
echo   id TEXT PRIMARY KEY,
echo   email TEXT UNIQUE NOT NULL,
echo   name TEXT NOT NULL,
echo   username TEXT UNIQUE NOT NULL,
echo   avatar_url TEXT,
echo   bio TEXT,
echo   phone TEXT,
echo   status TEXT DEFAULT 'offline',
echo   last_seen TIMESTAMP DEFAULT NOW^(^),
echo   is_official BOOLEAN DEFAULT false,
echo   stars INTEGER DEFAULT 0,
echo   created_at TIMESTAMP DEFAULT NOW^(^)
echo ^);
echo.
echo -- Таблица полученных подарков
echo CREATE TABLE IF NOT EXISTS received_gifts ^(
echo   id SERIAL PRIMARY KEY,
echo   user_id TEXT NOT NULL REFERENCES users^(id^),
echo   gift_id TEXT NOT NULL,
echo   from_user_id TEXT NOT NULL REFERENCES users^(id^),
echo   created_at TIMESTAMP DEFAULT NOW^(^)
echo ^);
echo.
echo -- Индексы
echo CREATE INDEX IF NOT EXISTS idx_users_username ON users^(username^);
echo CREATE INDEX IF NOT EXISTS idx_received_gifts_user ON received_gifts^(user_id^);
echo CREATE INDEX IF NOT EXISTS idx_received_gifts_gift ON received_gifts^(gift_id^);
) > neon-schema.sql
echo ✅ neon-schema.sql создан
echo.

echo 📋 ШАГ 5: Создание Neon клиента...
mkdir lib 2>nul
(
echo import { neon } from '@neondatabase/serverless';
echo.
echo const sql = neon^(process.env.DATABASE_URL!^);
echo.
echo // Получить пользователя
echo export async function getUser^(userId: string^) {
echo   const result = await sql`SELECT * FROM users WHERE id = ${userId}`;
echo   return result[0];
echo }
echo.
echo // Обновить баланс звезд
echo export async function updateUserStars^(userId: string, stars: number^) {
echo   await sql`UPDATE users SET stars = ${stars} WHERE id = ${userId}`;
echo }
echo.
echo // Добавить подарок
echo export async function addReceivedGift^(userId: string, giftId: string, fromUserId: string^) {
echo   await sql`
echo     INSERT INTO received_gifts ^(user_id, gift_id, from_user_id^)
echo     VALUES ^(${userId}, ${giftId}, ${fromUserId}^)
echo   `;
echo }
echo.
echo // Получить количество подарков
echo export async function getGiftCount^(giftId: string^) {
echo   const result = await sql`
echo     SELECT COUNT^(*^) as count 
echo     FROM received_gifts 
echo     WHERE gift_id = ${giftId}
echo   `;
echo   return parseInt^(result[0].count^);
echo }
echo.
echo // Подписка на изменения ^(через polling^)
echo export async function subscribeToUser^(userId: string, callback: ^(user: any^) =^> void^) {
echo   const interval = setInterval^(async ^(^) =^> {
echo     const user = await getUser^(userId^);
echo     callback^(user^);
echo   }, 1000^);
echo   
echo   return ^(^) =^> clearInterval^(interval^);
echo }
) > lib\neon.ts
echo ✅ lib/neon.ts создан
echo.

echo ========================================
echo ✅ МИГРАЦИЯ ЗАВЕРШЕНА!
echo ========================================
echo.
echo 📋 СЛЕДУЮЩИЕ ШАГИ:
echo.
echo 1. Откройте Neon Console: https://console.neon.tech
echo 2. Перейдите в SQL Editor
echo 3. Скопируйте содержимое файла: neon-schema.sql
echo 4. Вставьте в SQL Editor и нажмите Run
echo 5. Обновите Vercel переменные:
echo    - Добавьте: DATABASE_URL = %DATABASE_URL%
echo 6. Redeploy в Vercel
echo.
echo 🎉 Готово! Теперь используется Neon вместо Supabase
echo.
pause
