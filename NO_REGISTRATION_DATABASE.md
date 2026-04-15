# 🚀 БЕЗ РЕГИСТРАЦИИ - САМОЕ ЛУЧШЕЕ РЕШЕНИЕ

## ✅ INDEXEDDB - ВСТРОЕННАЯ БАЗА В БРАУЗЕРЕ

### 🎁 ПРЕИМУЩЕСТВА:

- ❌ **НЕТ РЕГИСТРАЦИИ** - работает сразу
- ❌ **НЕТ СЕРВЕРА** - всё в браузере
- ❌ **НЕТ ОПЛАТЫ** - бесплатно навсегда
- ✅ **ГИГАБАЙТЫ ДАННЫХ** - до 50% места на диске
- ✅ **БЫСТРО** - мгновенный доступ
- ✅ **OFFLINE** - работает без интернета
- ✅ **БЕЗОПАСНО** - данные только у пользователя

---

## 📦 УСТАНОВКА (1 КОМАНДА)

```bash
npm install dexie
```

**Dexie.js** - самая простая библиотека для IndexedDB

---

## 🔧 НАСТРОЙКА (СКОПИРУЙ И ВСТАВЬ)

### Создайте файл: `lib/db.ts`

```typescript
import Dexie, { Table } from 'dexie';

// Интерфейсы
export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  status: 'online' | 'offline';
  last_seen: Date;
  is_official: boolean;
  stars: number;
  created_at: Date;
}

export interface ReceivedGift {
  id?: number;
  user_id: string;
  gift_id: string;
  from_user_id: string;
  created_at: Date;
}

export interface Message {
  id?: number;
  chat_id: string;
  sender_id: string;
  text: string;
  type: 'text' | 'audio' | 'file' | 'sticker' | 'gif';
  file_url?: string;
  created_at: Date;
}

// База данных
export class HouseGramDB extends Dexie {
  users!: Table<User, string>;
  received_gifts!: Table<ReceivedGift, number>;
  messages!: Table<Message, number>;

  constructor() {
    super('HouseGramDB');
    
    this.version(1).stores({
      users: 'id, username, email, status',
      received_gifts: '++id, user_id, gift_id, from_user_id',
      messages: '++id, chat_id, sender_id, created_at'
    });
  }
}

// Экспорт базы
export const db = new HouseGramDB();

// ============================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ПОЛЬЗОВАТЕЛЯМИ
// ============================================

// Получить пользователя
export async function getUser(userId: string): Promise<User | undefined> {
  return await db.users.get(userId);
}

// Создать/обновить пользователя
export async function saveUser(user: User): Promise<string> {
  await db.users.put(user);
  return user.id;
}

// Обновить баланс звезд
export async function updateUserStars(userId: string, stars: number): Promise<void> {
  await db.users.update(userId, { stars });
}

// Обновить статус
export async function updateUserStatus(userId: string, status: 'online' | 'offline'): Promise<void> {
  await db.users.update(userId, { 
    status, 
    last_seen: new Date() 
  });
}

// Поиск пользователей
export async function searchUsers(query: string): Promise<User[]> {
  return await db.users
    .filter(user => 
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.name.toLowerCase().includes(query.toLowerCase())
    )
    .limit(20)
    .toArray();
}

// ============================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ПОДАРКАМИ
// ============================================

// Добавить подарок
export async function addReceivedGift(
  userId: string, 
  giftId: string, 
  fromUserId: string
): Promise<number> {
  return await db.received_gifts.add({
    user_id: userId,
    gift_id: giftId,
    from_user_id: fromUserId,
    created_at: new Date()
  });
}

// Получить количество подарков
export async function getGiftCount(giftId: string): Promise<number> {
  return await db.received_gifts
    .where('gift_id')
    .equals(giftId)
    .count();
}

// Получить подарки пользователя
export async function getUserGifts(userId: string): Promise<ReceivedGift[]> {
  return await db.received_gifts
    .where('user_id')
    .equals(userId)
    .reverse()
    .sortBy('created_at');
}

// ============================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С СООБЩЕНИЯМИ
// ============================================

// Добавить сообщение
export async function addMessage(message: Omit<Message, 'id'>): Promise<number> {
  return await db.messages.add({
    ...message,
    created_at: new Date()
  });
}

// Получить сообщения чата
export async function getChatMessages(chatId: string, limit = 50): Promise<Message[]> {
  return await db.messages
    .where('chat_id')
    .equals(chatId)
    .reverse()
    .limit(limit)
    .toArray();
}

// Удалить сообщение
export async function deleteMessage(messageId: number): Promise<void> {
  await db.messages.delete(messageId);
}

// ============================================
// ПОДПИСКА НА ИЗМЕНЕНИЯ (REAL-TIME)
// ============================================

// Подписка на изменения пользователя
export function subscribeToUser(
  userId: string, 
  callback: (user: User | undefined) => void
): () => void {
  const interval = setInterval(async () => {
    const user = await getUser(userId);
    callback(user);
  }, 1000); // Обновление каждую секунду
  
  return () => clearInterval(interval);
}

// Подписка на новые сообщения
export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void
): () => void {
  const interval = setInterval(async () => {
    const messages = await getChatMessages(chatId);
    callback(messages);
  }, 500); // Обновление каждые 0.5 секунды
  
  return () => clearInterval(interval);
}

// ============================================
// УТИЛИТЫ
// ============================================

// Очистить всю базу
export async function clearDatabase(): Promise<void> {
  await db.users.clear();
  await db.received_gifts.clear();
  await db.messages.clear();
}

// Экспорт данных
export async function exportData(): Promise<string> {
  const users = await db.users.toArray();
  const gifts = await db.received_gifts.toArray();
  const messages = await db.messages.toArray();
  
  return JSON.stringify({
    users,
    gifts,
    messages
  }, null, 2);
}

// Импорт данных
export async function importData(jsonData: string): Promise<void> {
  const data = JSON.parse(jsonData);
  
  if (data.users) await db.users.bulkPut(data.users);
  if (data.gifts) await db.received_gifts.bulkPut(data.gifts);
  if (data.messages) await db.messages.bulkPut(data.messages);
}
```

---

## 🎯 ИСПОЛЬЗОВАНИЕ В КОМПОНЕНТАХ

### Пример: `components/SendGiftView.tsx`

```typescript
import { useState, useEffect } from 'react';
import { 
  getUser, 
  updateUserStars, 
  addReceivedGift, 
  getGiftCount,
  subscribeToUser 
} from '@/lib/db';

export default function SendGiftView() {
  const [userStars, setUserStars] = useState(0);
  const currentUserId = 'user123'; // ID текущего пользователя

  // Подписка на изменения баланса
  useEffect(() => {
    const unsubscribe = subscribeToUser(currentUserId, (user) => {
      if (user) {
        setUserStars(user.stars);
      }
    });

    return unsubscribe;
  }, [currentUserId]);

  // Отправить подарок
  const handleSendGift = async (giftId: string, recipientId: string, cost: number) => {
    try {
      // Проверяем баланс
      const user = await getUser(currentUserId);
      if (!user || user.stars < cost) {
        alert('Недостаточно звезд!');
        return;
      }

      // Списываем звезды
      await updateUserStars(currentUserId, user.stars - cost);

      // Добавляем подарок
      await addReceivedGift(recipientId, giftId, currentUserId);

      // Получаем количество подарков
      const count = await getGiftCount(giftId);
      console.log(`Подарок отправлен! Всего: ${count}`);

      alert('Подарок отправлен! ✅');
    } catch (error) {
      console.error('Ошибка отправки подарка:', error);
      alert('Ошибка отправки подарка');
    }
  };

  return (
    <div>
      <h2>Баланс: {userStars} ⚡</h2>
      <button onClick={() => handleSendGift('easter_bunny', 'user456', 50)}>
        Отправить подарок (50 ⚡)
      </button>
    </div>
  );
}
```

---

## 📊 ПРЕИМУЩЕСТВА INDEXEDDB

### ✅ БЕЗ РЕГИСТРАЦИИ
- Работает сразу после установки
- Нет аккаунтов, паролей, email

### ✅ БЕЗ СЕРВЕРА
- Всё хранится в браузере
- Нет зависимости от внешних сервисов
- Работает offline

### ✅ БЕСПЛАТНО НАВСЕГДА
- Нет лимитов
- Нет платных планов
- Нет кредитных карт

### ✅ МОЩНО
- До 50% места на диске (гигабайты!)
- Быстрые запросы с индексами
- Транзакции и ACID

### ✅ БЕЗОПАСНО
- Данные только у пользователя
- Нет утечек на сервер
- Изолировано по доменам

---

## 🔄 СИНХРОНИЗАЦИЯ (ОПЦИОНАЛЬНО)

Если нужна синхронизация между устройствами, можно добавить:

### Вариант 1: Firebase (только для синхронизации)
```typescript
import { db } from './db';
import { onSnapshot, collection } from 'firebase/firestore';

// Синхронизация с Firebase
onSnapshot(collection(firestore, 'users'), (snapshot) => {
  snapshot.docs.forEach(async (doc) => {
    await db.users.put(doc.data() as User);
  });
});
```

### Вариант 2: LocalStorage для бэкапа
```typescript
// Автоматический бэкап каждые 5 минут
setInterval(async () => {
  const data = await exportData();
  localStorage.setItem('backup', data);
}, 5 * 60 * 1000);
```

---

## 🎉 ИТОГ

**INDEXEDDB - ЛУЧШЕЕ РЕШЕНИЕ БЕЗ РЕГИСТРАЦИИ:**

✅ Работает сразу (0 настроек)  
✅ Нет регистрации  
✅ Нет сервера  
✅ Нет оплаты  
✅ Гигабайты данных  
✅ Offline режим  
✅ Быстро и безопасно  

**УСТАНОВКА:**
```bash
npm install dexie
```

**ДОКУМЕНТАЦИЯ:** https://dexie.org

---

## 📚 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

- **Dexie.js:** https://dexie.org
- **IndexedDB API:** https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Примеры:** https://github.com/dexie/Dexie.js/tree/master/samples

---

## 🆚 СРАВНЕНИЕ С ДРУГИМИ РЕШЕНИЯМИ

| Функция | IndexedDB | Supabase | Neon | Firebase |
|---------|-----------|----------|------|----------|
| **Регистрация** | ❌ НЕТ | ✅ Нужна | ✅ Нужна | ✅ Нужна |
| **Сервер** | ❌ НЕТ | ✅ Нужен | ✅ Нужен | ✅ Нужен |
| **Хранилище** | До 50% диска | 500MB | 0.5GB | 1GB |
| **Offline** | ✅ ДА | ❌ НЕТ | ❌ НЕТ | Частично |
| **Скорость** | Мгновенно | 100-500ms | 350ms | 100-300ms |
| **Цена** | $0 | $0 | $0 | $0 |
| **Синхронизация** | Вручную | ✅ Авто | ✅ Авто | ✅ Авто |

**ВЫВОД:** Если не нужна синхронизация между устройствами - **IndexedDB идеален!**
