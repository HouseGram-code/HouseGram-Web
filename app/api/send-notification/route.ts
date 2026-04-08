import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Инициализация Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, title, body, data } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'FCM token is required' },
        { status: 400 }
      );
    }

    // Отправляем уведомление через FCM
    const message = {
      token,
      notification: {
        title: title || 'HouseGram',
        body: body || 'Новое сообщение',
      },
      data: data || {},
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          requireInteraction: false,
          vibrate: [200, 100, 200],
        },
        fcmOptions: {
          link: '/'
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);

    return NextResponse.json({ success: true, messageId: response });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
}
