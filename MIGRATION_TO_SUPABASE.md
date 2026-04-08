# Миграция с Firebase на Supabase

## Шаг 1: Настройка Supabase

### 1.1 Создание проекта
1. Зайдите на https://supabase.com
2. Создайте новый проект
3. Сохраните URL проекта и anon key

### 1.2 Настройка переменных окружения
Создайте файл `.env.local` в корне проекта:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 1.3 Выполнение SQL схемы
1. Откройте Supabase Dashboard → SQL Editor
2. Скопируйте содержимое файла `supabase-schema.sql`
3. Выполните SQL запрос

### 1.4 Создание Storage Bucket
1. Откройте Supabase Dashboard → Storage
2. Создайте новый bucket с именем `files`
3. Установите `Public bucket: true`
4. Или выполните SQL:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('files', 'files', true);
```

### 1.5 Настройка Authentication
1. Откройте Supabase Dashboard → Authentication → Providers
2. Включите Email provider
3. Включите Google OAuth (опционально):
   - Добавьте Client ID и Client Secret из Google Cloud Console
   - Добавьте redirect URL: `https://your-project.supabase.co/auth/v1/callback`

## Шаг 2: Изменения в коде

### 2.1 Замена импортов
Все импорты Firebase заменены на Supabase adapter:

**Было:**
```typescript
import { auth, db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
```

**Стало:**
```typescript
import { auth, db, storage } from '@/lib/supabase-adapter';
```

### 2.2 Основные изменения API

#### Authentication
```typescript
// Было (Firebase)
onAuthStateChanged(auth, (user) => { ... });

// Стало (Supabase)
auth.onAuthStateChanged((user) => { ... });
```

#### Database
```typescript
// Было (Firebase)
const docRef = doc(db, 'users', userId);
const docSnap = await getDoc(docRef);

// Стало (Supabase)
const { data, error } = await db.getUser(userId);
```

#### Storage
```typescript
// Было (Firebase)
const storageRef = ref(storage, path);
await uploadBytes(storageRef, file);
const url = await getDownloadURL(storageRef);

// Стало (Supabase)
const { url } = await storage.uploadFile(path, file);
```

## Шаг 3: Миграция данных (опционально)

Если у вас уже есть данные в Firebase:

### 3.1 Экспорт из Firebase
1. Firebase Console → Firestore Database → Import/Export
2. Экспортируйте данные в JSON

### 3.2 Импорт в Supabase
Используйте скрипт миграции (создайте `scripts/migrate.ts`):

```typescript
import { supabase } from '@/lib/supabase';
import firebaseData from './firebase-export.json';

async function migrate() {
  // Миграция пользователей
  for (const user of firebaseData.users) {
    await supabase.from('users').insert({
      id: user.uid,
      email: user.email,
      name: user.name,
      // ... остальные поля
    });
  }
  
  // Миграция сообщений
  for (const message of firebaseData.messages) {
    await supabase.from('messages').insert({
      // ... поля сообщения
    });
  }
}

migrate();
```

## Шаг 4: Тестирование

### 4.1 Проверка функциональности
- [ ] Регистрация нового пользователя
- [ ] Вход существующего пользователя
- [ ] Отправка сообщений
- [ ] Загрузка файлов
- [ ] Создание каналов
- [ ] Real-time обновления

### 4.2 Проверка производительности
- Supabase обычно быстрее Firebase благодаря PostgreSQL
- Real-time работает через WebSockets
- Индексы уже настроены в схеме

## Шаг 5: Удаление Firebase (опционально)

После успешной миграции:

1. Удалите Firebase зависимости:
```bash
npm uninstall firebase firebase-admin
```

2. Удалите файлы:
- `lib/firebase.ts`
- `lib/notifications.ts` (если не используется)
- `firestore.rules`
- `firebase.json`

3. Обновите `next.config.ts`:
Удалите `firebase` из `optimizePackageImports`

## Преимущества Supabase

✅ **PostgreSQL** - мощная реляционная БД
✅ **Бесплатный план** - 500MB БД, 1GB storage, 2GB bandwidth
✅ **Real-time** - WebSocket подписки из коробки
✅ **Row Level Security** - встроенная безопасность на уровне строк
✅ **REST API** - автоматически генерируется
✅ **Storage** - встроенное хранилище файлов
✅ **Auth** - полноценная система аутентификации
✅ **Открытый исходный код** - можно развернуть самостоятельно

## Поддержка

Если возникли проблемы:
1. Проверьте логи в Supabase Dashboard → Logs
2. Проверьте RLS политики в Dashboard → Authentication → Policies
3. Проверьте переменные окружения
4. Документация: https://supabase.com/docs

## Откат на Firebase

Если нужно вернуться к Firebase:
1. Восстановите файл `lib/firebase.ts`
2. Измените импорты обратно
3. Установите Firebase: `npm install firebase`
