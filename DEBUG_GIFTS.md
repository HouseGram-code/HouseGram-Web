# Отладка функции "Мои подарки"

## Шаг 1: Пересоздайте таблицу БЕЗ RLS

1. Откройте Supabase Dashboard → SQL Editor
2. Выполните файл `supabase-received-gifts-no-rls.sql`
3. Это удалит старую таблицу и создаст новую БЕЗ Row Level Security

## Шаг 2: Проверьте консоль браузера

1. Откройте DevTools (F12)
2. Перейдите на вкладку Console
3. Отправьте подарок
4. Вы должны увидеть логи:
   ```
   Attempting to insert gift: { user_id: "...", gift_id: "...", ... }
   Gift inserted successfully: [...]
   ```

5. Если видите ошибку - скопируйте её текст

## Шаг 3: Проверьте таблицу в Supabase

1. Откройте Supabase Dashboard → Table Editor
2. Найдите таблицу `received_gifts`
3. Проверьте есть ли там записи
4. Если записей нет - проблема при вставке
5. Если записи есть - проблема при чтении

## Шаг 4: Проверьте загрузку подарков

1. Откройте "Мои подарки"
2. В консоли должны быть логи:
   ```
   Loading gifts for user: "..."
   Supabase response: { data: [...], error: null }
   Loaded gifts: [...]
   ```

3. Если `data` пустой массив - подарки не сохранились
4. Если `error` не null - проблема с доступом

## Шаг 5: Проверьте currentUser

В консоли выполните:
```javascript
// В компоненте MyGiftsView
console.log('Current user:', currentUser);
```

Убедитесь что:
- `currentUser` не null
- `currentUser.id` совпадает с ID получателя подарка

## Частые проблемы

### Проблема 1: RLS блокирует доступ
**Решение:** Используйте `supabase-received-gifts-no-rls.sql`

### Проблема 2: user_id не совпадает
**Решение:** Проверьте что вы залогинены под получателем

### Проблема 3: Таблица не создана
**Решение:** Проверьте в Table Editor наличие таблицы `received_gifts`

### Проблема 4: Ошибка при вставке
**Решение:** Проверьте текст ошибки в консоли, возможно не хватает прав

## Тестовый SQL запрос

Выполните в SQL Editor:
```sql
-- Проверка таблицы
SELECT * FROM received_gifts;

-- Вставка тестового подарка
INSERT INTO received_gifts (user_id, gift_id, name, emoji, cost, from_user_id, from_name)
VALUES ('test-user-id', 'teddy_bear', 'Плюшевый мишка', '🧸', 15, 'sender-id', 'Тестовый отправитель');

-- Проверка вставки
SELECT * FROM received_gifts WHERE user_id = 'test-user-id';
```

Замените `test-user-id` на реальный ID пользователя из таблицы `users`.
