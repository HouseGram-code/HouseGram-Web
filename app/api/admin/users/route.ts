/**
 * API - Управление пользователями (только для админов)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import {
  verifyAuthToken,
  isAdmin,
  checkRateLimit,
  getClientIp
} from '@/lib/simple-auth';

export const runtime = 'nodejs';

/**
 * Проверка токена из заголовков или cookies
 */
async function getAuthToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value;
  
  if (!token) return null;
  
  return verifyAuthToken(token);
}

/**
 * GET - Получение списка пользователей
 */
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    
    // Rate limiting
    if (!checkRateLimit(`admin:${ip}`, 50, 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Проверка аутентификации
    const auth = await getAuthToken(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверка прав админа
    if (!isAdmin(auth.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Недостаточно прав' },
        { status: 403 }
      );
    }

    // Получаем пользователей
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      users,
      count: users.length
    });

  } catch (error) {
    console.error('[API ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Управление пользователем
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    
    // Rate limiting
    if (!checkRateLimit(`admin:${ip}`, 50, 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Проверка аутентификации
    const auth = await getAuthToken(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверка прав админа
    if (!isAdmin(auth.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Недостаточно прав' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, action, value } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const userRef = doc(db, 'users', userId);

    switch (action) {
      case 'ban':
        await updateDoc(userRef, {
          isBanned: true,
          bannedAt: new Date().toISOString(),
          bannedBy: auth.userId
        });
        break;

      case 'unban':
        await updateDoc(userRef, {
          isBanned: false,
          unbannedAt: new Date().toISOString(),
          unbannedBy: auth.userId
        });
        break;

      case 'give_stars':
        if (!value || value <= 0) {
          return NextResponse.json({ error: 'Invalid stars amount' }, { status: 400 });
        }
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const currentStars = userDoc.data().stars || 0;
          await updateDoc(userRef, {
            stars: currentStars + value,
            lastStarsGivenAt: new Date().toISOString(),
            lastStarsGivenBy: auth.userId
          });
        }
        break;

      case 'make_admin':
        await updateDoc(userRef, {
          role: 'admin',
          madeAdminAt: new Date().toISOString(),
          madeAdminBy: auth.userId
        });
        break;

      case 'remove_admin':
        await updateDoc(userRef, {
          role: 'user',
          removedAdminAt: new Date().toISOString(),
          removedAdminBy: auth.userId
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Действие выполнено успешно',
      action,
      userId
    });

  } catch (error) {
    console.error('[API ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
