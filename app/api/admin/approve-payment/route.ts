/**
 * API - Одобрение платежей (только для админов)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { isUserAdmin, logAdminAction } from '@/lib/admin-utils';

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
    const { requestId, approve } = body;
    
    if (!requestId || typeof approve !== 'boolean') {
      return NextResponse.json(
        { error: 'Bad request', message: 'Отсутствуют обязательные параметры' },
        { status: 400 }
      );
    }
    
    // Получаем заявку на оплату
    const paymentRef = doc(db, 'payment_requests', requestId);
    const paymentDoc = await getDoc(paymentRef);
    
    if (!paymentDoc.exists()) {
      return NextResponse.json(
        { error: 'Not found', message: 'Заявка не найдена' },
        { status: 404 }
      );
    }
    
    const paymentData = paymentDoc.data();
    
    if (paymentData.status !== 'pending') {
      return NextResponse.json(
        { error: 'Bad request', message: 'Заявка уже обработана' },
        { status: 400 }
      );
    }
    
    if (approve) {
      // Одобряем платеж - выдаем молнии пользователю
      const userRef = doc(db, 'users', paymentData.userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const currentStars = userDoc.data().stars || 0;
        await updateDoc(userRef, {
          stars: currentStars + paymentData.stars
        });
      }
      
      // Обновляем статус заявки
      await updateDoc(paymentRef, {
        status: 'approved',
        approvedBy: adminId,
        approvedAt: new Date().toISOString()
      });
      
      logAdminAction(adminId, 'APPROVE_PAYMENT', paymentData.userId, {
        requestId,
        stars: paymentData.stars,
        price: paymentData.price
      });
      
      return NextResponse.json({
        success: true,
        message: 'Платеж одобрен',
        stars: paymentData.stars
      });
      
    } else {
      // Отклоняем платеж
      await updateDoc(paymentRef, {
        status: 'rejected',
        rejectedBy: adminId,
        rejectedAt: new Date().toISOString()
      });
      
      logAdminAction(adminId, 'REJECT_PAYMENT', paymentData.userId, {
        requestId,
        stars: paymentData.stars,
        price: paymentData.price
      });
      
      return NextResponse.json({
        success: true,
        message: 'Платеж отклонен'
      });
    }
    
  } catch (error) {
    console.error('[API ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Произошла ошибка' },
      { status: 500 }
    );
  }
}
