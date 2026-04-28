import { NextRequest, NextResponse } from 'next/server';

// Проверяем наличие переменных окружения
const hasFirebaseConfig = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

let adminApp: any = null;
let db: any = null;

// Инициализация Firebase Admin только если есть конфигурация
if (hasFirebaseConfig) {
  try {
    const { initializeApp, getApps, cert } = require('firebase-admin/app');
    const { getFirestore } = require('firebase-admin/firestore');
    
    // Инициализация Firebase Admin (только если еще не инициализирован)
    if (!getApps().length) {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      adminApp = getApps()[0];
    }
    
    db = getFirestore(adminApp);
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export async function POST(request: NextRequest) {
  // Проверяем конфигурацию
  if (!hasFirebaseConfig || !db) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Firebase Admin not configured. Please set environment variables.' 
      },
      { status: 500 }
    );
  }

  try {
    const now = new Date();
    
    // Получаем все запланированные сообщения, которые должны быть отправлены
    const scheduledMessagesRef = db.collection('scheduledMessages');
    const query = scheduledMessagesRef
      .where('status', '==', 'scheduled')
      .where('scheduledFor', '<=', now);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return NextResponse.json({ 
        success: true, 
        message: 'No messages to send',
        processed: 0 
      });
    }

    let processed = 0;
    const batch = db.batch();

    for (const doc of snapshot.docs) {
      const messageData = doc.data();
      
      try {
        // Создаем сообщение в чате
        const chatId = [messageData.senderId, messageData.chatId].sort().join('_');
        const messagesRef = db.collection('chats').doc(chatId).collection('messages');
        
        const newMessageRef = messagesRef.doc();
        const messageToSend = {
          type: 'sent',
          text: messageData.text,
          time: now.toTimeString().slice(0, 5),
          status: 'sent',
          senderId: messageData.senderId,
          chatId: messageData.chatId,
          createdAt: now,
          ...(messageData.replyTo && { replyTo: messageData.replyTo })
        };

        batch.set(newMessageRef, messageToSend);

        // Обновляем последнее сообщение в чате
        const chatRef = db.collection('chats').doc(chatId);
        batch.update(chatRef, {
          lastMessage: messageData.text,
          lastMessageSenderId: messageData.senderId,
          updatedAt: now
        });

        // Помечаем запланированное сообщение как отправленное
        batch.update(doc.ref, {
          status: 'sent',
          sentAt: now
        });

        processed++;
      } catch (error) {
        console.error('Error processing message:', doc.id, error);
        
        // Помечаем как неудачное
        batch.update(doc.ref, {
          status: 'failed',
          failedAt: now,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Выполняем все операции
    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${processed} scheduled messages`,
      processed 
    });

  } catch (error) {
    console.error('Scheduled messages processing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint для проверки статуса
export async function GET() {
  // Проверяем конфигурацию
  if (!hasFirebaseConfig || !db) {
    return NextResponse.json({
      success: false,
      error: 'Firebase Admin not configured',
      configured: false
    });
  }

  try {
    const now = new Date();
    
    // Подсчитываем количество запланированных сообщений
    const scheduledMessagesRef = db.collection('scheduledMessages');
    const pendingQuery = scheduledMessagesRef.where('status', '==', 'scheduled');
    const overdueQuery = scheduledMessagesRef
      .where('status', '==', 'scheduled')
      .where('scheduledFor', '<=', now);
    
    const [pendingSnapshot, overdueSnapshot] = await Promise.all([
      pendingQuery.get(),
      overdueQuery.get()
    ]);

    return NextResponse.json({
      success: true,
      configured: true,
      stats: {
        totalPending: pendingSnapshot.size,
        overdue: overdueSnapshot.size,
        timestamp: now.toISOString()
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}