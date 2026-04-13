/**
 * API - Логин с защитой
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  createAuthToken,
  verifyPassword,
  checkRateLimit,
  getClientIp,
  UserRole
} from '@/lib/simple-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  
  try {
    // Rate limiting - 5 попыток за 15 минут
    if (!checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many login attempts', message: 'Слишком много попыток входа. Попробуйте через 15 минут.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing credentials', message: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    // Поиск пользователя
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid credentials', message: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Проверка блокировки
    if (userData.isBanned) {
      return NextResponse.json(
        { error: 'Account banned', message: 'Ваш аккаунт заблокирован' },
        { status: 403 }
      );
    }

    // Проверка пароля
    const isPasswordValid = userData.passwordHash
      ? await verifyPassword(password, userData.passwordHash)
      : password === userData.password;

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials', message: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // Создание токена
    const role = (userData.role as UserRole) || UserRole.USER;
    const token = await createAuthToken(userDoc.id, userData.email, role);

    const response = NextResponse.json({
      success: true,
      message: 'Вход выполнен успешно',
      user: {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        avatar: userData.avatar,
        isOfficial: userData.isOfficial
      },
      token
    });

    // Устанавливаем cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Произошла ошибка при входе' },
      { status: 500 }
    );
  }
}
