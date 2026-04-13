/**
 * Утилиты для админ-панели
 * Простые функции без внешних зависимостей
 */

import { db } from './firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

// Список админских email
const ADMIN_EMAILS = [
  'veraloktushina1958@gmail.com'
];

/**
 * Проверка, является ли пользователь админом
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    return userData.role === 'admin' || ADMIN_EMAILS.includes(userData.email);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Получение всех пользователей (только для админов)
 */
export async function getAllUsers() {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
}

/**
 * Бан пользователя
 */
export async function banUser(userId: string, adminId: string) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      isBanned: true,
      bannedAt: new Date().toISOString(),
      bannedBy: adminId
    });
    return { success: true };
  } catch (error) {
    console.error('Error banning user:', error);
    throw error;
  }
}

/**
 * Разбан пользователя
 */
export async function unbanUser(userId: string, adminId: string) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      isBanned: false,
      unbannedAt: new Date().toISOString(),
      unbannedBy: adminId
    });
    return { success: true };
  } catch (error) {
    console.error('Error unbanning user:', error);
    throw error;
  }
}

/**
 * Выдача молний пользователю
 */
export async function giveStars(userId: string, amount: number, adminId: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const currentStars = userDoc.data().stars || 0;
    await updateDoc(doc(db, 'users', userId), {
      stars: currentStars + amount,
      lastStarsGivenAt: new Date().toISOString(),
      lastStarsGivenBy: adminId
    });
    
    return { success: true, newBalance: currentStars + amount };
  } catch (error) {
    console.error('Error giving stars:', error);
    throw error;
  }
}

/**
 * Назначение админа
 */
export async function makeAdmin(userId: string, adminId: string) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: 'admin',
      madeAdminAt: new Date().toISOString(),
      madeAdminBy: adminId
    });
    return { success: true };
  } catch (error) {
    console.error('Error making admin:', error);
    throw error;
  }
}

/**
 * Снятие админа
 */
export async function removeAdmin(userId: string, adminId: string) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: 'user',
      removedAdminAt: new Date().toISOString(),
      removedAdminBy: adminId
    });
    return { success: true };
  } catch (error) {
    console.error('Error removing admin:', error);
    throw error;
  }
}

/**
 * Логирование админских действий
 */
export function logAdminAction(
  adminId: string,
  action: string,
  targetUserId: string,
  details?: any
) {
  console.log('[ADMIN ACTION]', {
    timestamp: new Date().toISOString(),
    adminId,
    action,
    targetUserId,
    details
  });
}
