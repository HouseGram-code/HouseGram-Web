import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore';

// ============================================
// ТИПЫ
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  status: 'online' | 'offline';
  last_seen: Timestamp;
  is_official: boolean;
  stars: number;
  gifts_sent: number;
  gifts_received: number;
  created_at: Timestamp;
}

export interface ReceivedGift {
  id: string;
  user_id: string;
  gift_id: string;
  name: string;
  emoji: string;
  cost: number;
  from_user_id: string;
  from_name: string;
  can_convert: boolean;
  received_at: Timestamp;
}

// ============================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ПОЛЬЗОВАТЕЛЯМИ
// ============================================

/**
 * Получить пользователя по ID
 */
export async function getUser(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Создать или обновить пользователя
 */
export async function createOrUpdateUser(
  userId: string,
  data: Partial<User>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Создаем нового пользователя
      await setDoc(userRef, {
        id: userId,
        email: data.email || 'user@example.com',
        name: data.name || 'User',
        username: data.username || '@user',
        status: 'offline',
        last_seen: serverTimestamp(),
        is_official: false,
        stars: 100, // Начальный баланс
        gifts_sent: 0,
        gifts_received: 0,
        created_at: serverTimestamp(),
        ...data
      });
    } else {
      // Обновляем существующего
      await updateDoc(userRef, {
        ...data,
        last_seen: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
}

/**
 * Обновить баланс звезд
 */
export async function updateUserStars(
  userId: string,
  amount: number
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      stars: increment(amount)
    });
  } catch (error) {
    console.error('Error updating stars:', error);
    throw error;
  }
}

/**
 * Получить баланс звезд
 */
export async function getUserStars(userId: string): Promise<number> {
  try {
    const user = await getUser(userId);
    return user?.stars || 0;
  } catch (error) {
    console.error('Error getting user stars:', error);
    return 0;
  }
}

/**
 * Подписка на изменения баланса пользователя
 */
export function subscribeToUserStars(
  userId: string,
  callback: (stars: number) => void
): () => void {
  const userRef = doc(db, 'users', userId);
  
  const unsubscribe = onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback(data.stars || 0);
    }
  }, (error) => {
    console.error('Error subscribing to user stars:', error);
  });
  
  return unsubscribe;
}

// ============================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ПОДАРКАМИ
// ============================================

/**
 * Отправить подарок
 */
export async function sendGift(
  fromUserId: string,
  toUserId: string,
  giftId: string,
  giftName: string,
  giftEmoji: string,
  giftCost: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Проверяем баланс отправителя
    const sender = await getUser(fromUserId);
    if (!sender) {
      return { success: false, error: 'Отправитель не найден' };
    }
    
    if (sender.stars < giftCost) {
      return { success: false, error: 'Недостаточно звезд' };
    }
    
    // 2. Создаем получателя если его нет
    const receiver = await getUser(toUserId);
    if (!receiver) {
      await createOrUpdateUser(toUserId, {
        email: `${toUserId}@temp.com`,
        name: 'User',
        username: `@${toUserId.substring(0, 10)}`
      });
    }
    
    // 3. Списываем звезды у отправителя
    await updateDoc(doc(db, 'users', fromUserId), {
      stars: increment(-giftCost),
      gifts_sent: increment(1)
    });
    
    // 4. Обновляем статистику получателя
    await updateDoc(doc(db, 'users', toUserId), {
      gifts_received: increment(1)
    });
    
    // 5. Добавляем подарок в коллекцию получателя
    await addDoc(collection(db, 'users', toUserId, 'received_gifts'), {
      user_id: toUserId,
      gift_id: giftId,
      name: giftName,
      emoji: giftEmoji,
      cost: giftCost,
      from_user_id: fromUserId,
      from_name: sender.name,
      can_convert: true,
      received_at: serverTimestamp()
    });
    
    // 6. Добавляем в глобальную коллекцию для статистики
    await addDoc(collection(db, 'gifts_sent'), {
      gift_id: giftId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      cost: giftCost,
      sent_at: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending gift:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    };
  }
}

/**
 * Получить количество отправленных подарков определенного типа
 */
export async function getGiftCount(giftId: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'gifts_sent'),
      where('gift_id', '==', giftId)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting gift count:', error);
    return 0;
  }
}

/**
 * Получить полученные подарки пользователя
 */
export async function getUserGifts(userId: string): Promise<ReceivedGift[]> {
  try {
    const giftsRef = collection(db, 'users', userId, 'received_gifts');
    const snapshot = await getDocs(giftsRef);
    
    const gifts: ReceivedGift[] = [];
    snapshot.forEach((doc) => {
      gifts.push({ id: doc.id, ...doc.data() } as ReceivedGift);
    });
    
    // Сортируем по дате получения (новые первыми)
    gifts.sort((a, b) => {
      const aTime = a.received_at?.toMillis() || 0;
      const bTime = b.received_at?.toMillis() || 0;
      return bTime - aTime;
    });
    
    return gifts;
  } catch (error) {
    console.error('Error getting user gifts:', error);
    return [];
  }
}

/**
 * Конвертировать подарок в звезды
 */
export async function convertGiftToStars(
  userId: string,
  giftId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Получаем подарок
    const giftDoc = await getDoc(doc(db, 'users', userId, 'received_gifts', giftId));
    
    if (!giftDoc.exists()) {
      return { success: false, error: 'Подарок не найден' };
    }
    
    const gift = giftDoc.data() as ReceivedGift;
    
    if (!gift.can_convert) {
      return { success: false, error: 'Этот подарок нельзя конвертировать' };
    }
    
    // Добавляем звезды пользователю
    await updateDoc(doc(db, 'users', userId), {
      stars: increment(gift.cost)
    });
    
    // Помечаем подарок как конвертированный
    await updateDoc(doc(db, 'users', userId, 'received_gifts', giftId), {
      can_convert: false,
      converted_at: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error converting gift:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    };
  }
}

/**
 * Подписка на изменения количества подарков
 */
export function subscribeToGiftCount(
  giftId: string,
  callback: (count: number) => void
): () => void {
  const q = query(
    collection(db, 'gifts_sent'),
    where('gift_id', '==', giftId)
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  }, (error) => {
    console.error('Error subscribing to gift count:', error);
  });
  
  return unsubscribe;
}

// ============================================
// ФУНКЦИИ ДЛЯ ПОКУПКИ ЗВЕЗД
// ============================================

/**
 * Добавить звезды пользователю (после покупки)
 */
export async function addStarsAfterPurchase(
  userId: string,
  amount: number,
  paymentId: string
): Promise<void> {
  try {
    // Добавляем звезды
    await updateDoc(doc(db, 'users', userId), {
      stars: increment(amount)
    });
    
    // Сохраняем транзакцию
    await addDoc(collection(db, 'transactions'), {
      user_id: userId,
      type: 'purchase',
      amount: amount,
      payment_id: paymentId,
      created_at: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding stars after purchase:', error);
    throw error;
  }
}

// ============================================
// УТИЛИТЫ
// ============================================

/**
 * Инициализация пользователя при первом входе
 */
export async function initializeUser(
  userId: string,
  email: string,
  name: string
): Promise<void> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      await createOrUpdateUser(userId, {
        email,
        name,
        username: `@${name.toLowerCase().replace(/\s+/g, '')}`,
        stars: 100, // Начальный бонус
        status: 'online'
      });
    }
  } catch (error) {
    console.error('Error initializing user:', error);
    throw error;
  }
}
