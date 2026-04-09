# Настройка политик Storage через Dashboard

## Шаг 1: Запустите упрощённый SQL

1. Откройте **SQL Editor** в Supabase Dashboard
2. Скопируйте код из файла `supabase-storage-simple.sql`
3. Вставьте и нажмите **Run**

## Шаг 2: Настройте политики через UI

### 2.1 Откройте Storage Policies

1. Перейдите в **Storage** (левое меню)
2. Кликните на bucket **files**
3. Перейдите на вкладку **Policies**

### 2.2 Создайте политику для загрузки

1. Нажмите **New Policy**
2. Выберите **For full customization**
3. Заполните:
   - **Policy name**: `Authenticated users can upload`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **USING expression**: оставьте пустым
   - **WITH CHECK expression**: 
     ```sql
     bucket_id = 'files'
     ```
4. Нажмите **Review** → **Save policy**

### 2.3 Создайте политику для просмотра

1. Нажмите **New Policy**
2. Выберите **For full customization**
3. Заполните:
   - **Policy name**: `Anyone can view files`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `public`
   - **USING expression**: 
     ```sql
     bucket_id = 'files'
     ```
   - **WITH CHECK expression**: оставьте пустым
4. Нажмите **Review** → **Save policy**

### 2.4 Создайте политику для удаления

1. Нажмите **New Policy**
2. Выберите **For full customization**
3. Заполните:
   - **Policy name**: `Users can delete own files`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **USING expression**: 
     ```sql
     bucket_id = 'files' AND 
     auth.uid()::text = (storage.foldername(name))[1]
     ```
   - **WITH CHECK expression**: оставьте пустым
4. Нажмите **Review** → **Save policy**

### 2.5 Создайте политику для обновления

1. Нажмите **New Policy**
2. Выберите **For full customization**
3. Заполните:
   - **Policy name**: `Users can update own files`
   - **Allowed operation**: `UPDATE`
   - **Target roles**: `authenticated`
   - **USING expression**: 
     ```sql
     bucket_id = 'files' AND 
     auth.uid()::text = (storage.foldername(name))[1]
     ```
   - **WITH CHECK expression**: 
     ```sql
     bucket_id = 'files' AND 
     auth.uid()::text = (storage.foldername(name))[1]
     ```
4. Нажмите **Review** → **Save policy**

## Шаг 3: Проверка

После создания всех политик вы должны увидеть 4 политики:
- ✅ Authenticated users can upload (INSERT)
- ✅ Anyone can view files (SELECT)
- ✅ Users can delete own files (DELETE)
- ✅ Users can update own files (UPDATE)

## Альтернатива: Быстрая настройка через шаблоны

Если доступны шаблоны политик:

1. Нажмите **New Policy**
2. Выберите шаблон **Enable insert for authenticated users only**
3. Примените для операции INSERT
4. Повторите для других операций

## Проверка работы

Запустите в SQL Editor:

```sql
-- Проверка bucket
SELECT * FROM storage.buckets WHERE id = 'files';

-- Проверка политик (может не работать без прав)
-- SELECT * FROM storage.policies WHERE bucket_id = 'files';

-- Проверка метаданных
SELECT * FROM file_metadata LIMIT 5;

-- Ваша статистика
SELECT * FROM get_user_file_stats(auth.uid());
```

## Что дальше?

После настройки политик:
1. ✅ Bucket создан
2. ✅ Политики настроены
3. ✅ Метаданные готовы
4. ✅ Квоты работают

Теперь можно тестировать загрузку файлов в приложении!

## Troubleshooting

### Не могу создать политику
- Убедитесь, что вы владелец проекта
- Попробуйте обновить страницу
- Проверьте, что bucket `files` существует

### Политика не работает
- Проверьте синтаксис SQL выражений
- Убедитесь, что пользователь авторизован
- Проверьте логи в Dashboard → Logs

### Ошибка "permission denied"
- Проверьте, что политика для INSERT создана
- Убедитесь, что `Target roles` = `authenticated`
- Проверьте, что bucket публичный
