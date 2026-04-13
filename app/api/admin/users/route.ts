/**
 * API - Управление пользователями (только для админов)
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  isUserAdmin, 
  getAllUsers, 
  banUser, 
  unbanUser, 
  giveStars, 
  makeAdmin, 
  removeAdmin,
  logAdminAction 
} from '@/lib/admin-utils';

/**
 * GET - Получение списка пользователей
 */
export async function GET(request: NextRequest) {
  try {
    // Получаем userId из заголовков (должен быть установлен Firebase Auth)
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Требуется аутентификация' },
        { status: 401 }
      );
    }
    
    // Проверяем права админа
    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Недостаточно прав' },
        { status: 403 }
      );
    }
    
    // Получаем всех пользователей
    const users = await getAllUsers();
    
    logAdminAction(userId, 'GET_USERS', 'all', { count: users.length });
    
    return NextResponse.json({
      success: true,
      users,
      count: users.length
    });
    
  } catch (error) {
    console.error('[API ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Произошла ошибка' },
      { status: 500 }
    );
  }
}

/**
 * POST - Управление пользователем
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем userId из заголовков
    const adminId = request.headers.get('x-user-id');
    
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Требуется аутентификация' },
        { status: 401 }
      );
    }
    
    // Проверяем права админа
    const isAdmin = await isUserAdmin(adminId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Недостаточно прав' },
        { status: 403 }
      );
    }
    
    // Парсим тело запроса
    const body = await request.json();
    const { userId, action, value } = body;
    
    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Bad request', message: 'Отсутствуют обязательные параметры' },
        { status: 400 }
      );
    }
    
    let result;
    
    // Выполняем действие
    switch (action) {
      case 'ban':
        result = await banUser(userId, adminId);
        logAdminAction(adminId, 'BAN_USER', userId);
        break;
        
      case 'unban':
        result = await unbanUser(userId, adminId);
        logAdminAction(adminId, 'UNBAN_USER', userId);
        break;
        
      case 'give_stars':
        if (!value || value <= 0) {
          return NextResponse.json(
            { error: 'Bad request', message: 'Неверное количество молний' },
            { status: 400 }
          );
        }
        result = await giveStars(userId, value, adminId);
        logAdminAction(adminId, 'GIVE_STARS', userId, { amount: value });
        break;
        
      case 'make_admin':
        result = await makeAdmin(userId, adminId);
        logAdminAction(adminId, 'MAKE_ADMIN', userId);
        break;
        
      case 'remove_admin':
        result = await removeAdmin(userId, adminId);
        logAdminAction(adminId, 'REMOVE_ADMIN', userId);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Bad request', message: 'Неизвестное действие' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      ...result,
      message: 'Действие выполнено успешно',
      action,
      userId
    });
    
  } catch (error) {
    console.error('[API ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Произошла ошибка' },
      { status: 500 }
    );
  }
}
