# Исправление конфигурации Supabase

## Проблема
Ошибка: `POST https://your-project.supabase.co/storage/v1/object/files/... net::ERR_NAME_NOT_RESOLVED`

Это означает, что в `.env.local` используется неправильный URL Supabase.

## Решение

### 1. Получите правильные ключи из Supabase Dashboard

1. Откройте https://app.supabase.com
2. Выберите проект `ddboijlsxltjpoptgmft`
3. Перейдите в **Settings** → **API**
4. Скопируйте:
   - **Project URL** (например: `https://ddboijlsxltjpoptgmft.supabase.co`)
   - **anon public** key (длинный JWT токен)

### 2. Обновите `.env.local`

Откройте файл `.env.local` и замените:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ddboijlsxltjpoptgmft.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш_anon_public_ключ_из_dashboard
```

### 3. Перезапустите сервер разработки

```bash
# Остановите сервер (Ctrl+C)
# Запустите снова
npm run dev
```

### 4. Проверьте работу

1. Откройте приложение
2. Попробуйте загрузить файл
3. Проверьте консоль - ошибок быть не должно

## Дополнительно: Проблемы с GIF

Ошибки `GET https://media.giphy.com/media/.../200w.gif 404` означают, что некоторые GIF из коллекции удалены с Giphy.

### Решение:

Обновите файл `lib/stickers.ts` - удалите несуществующие GIF или замените на рабочие.

## Проверка конфигурации

Запустите в консоли браузера (F12):

```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
```

Должно показать правильный URL вашего проекта.

## Если всё ещё не работает

1. Проверьте, что SQL скрипт `supabase-storage-complete.sql` выполнен
2. Проверьте, что bucket `files` создан в Storage
3. Проверьте, что 4 политики созданы в Storage → files → Policies
4. Очистите кэш браузера (Ctrl+Shift+Delete)
5. Перезапустите dev сервер

## Быстрая проверка Supabase

```bash
# В терминале
curl https://ddboijlsxltjpoptgmft.supabase.co/rest/v1/
```

Если получите ответ - Supabase работает.
Если ошибка - проверьте URL проекта.
