# Исправление ошибки изменения значка (Badge)

## Проблема
При попытке изменить официальный значок пользователя в админ-панели возникала ошибка:
```
Error toggling badge: FirebaseError: Missing or insufficient permissions
```

## Причина
В правилах Firestore (`firestore.rules`) отсутствовало:
1. Валидация поля `isOfficial` в функции `isValidUser`
2. Защита от изменения поля `isOfficial` обычными пользователями

## Решение

### Изменения в `firestore.rules` и `firestore.rules.complete`:

1. **Добавлена валидация поля `isOfficial`** в функцию `isValidUser`:
```javascript
(!('isOfficial' in data) || data.isOfficial == null || data.isOfficial is bool)
```

2. **Добавлена защита от изменения поля обычными пользователями**:
```javascript
(!('isOfficial' in resource.data) || request.resource.data.isOfficial == resource.data.isOfficial)
```

Теперь:
- ✅ Администраторы могут изменять поле `isOfficial` у любого пользователя
- ✅ Обычные пользователи НЕ могут изменять свой статус `isOfficial`
- ✅ Поле `isOfficial` корректно валидируется как boolean

## Как применить изменения

1. Разверните обновленные правила в Firebase:
```bash
firebase deploy --only firestore:rules
```

2. После развертывания функция `toggleOfficialBadge` в `AdminView.tsx` будет работать корректно.

## Проверка
После применения изменений администратор сможет:
- Включать/выключать официальный значок для пользователей
- Видеть синий значок с галочкой рядом с именем официальных аккаунтов
