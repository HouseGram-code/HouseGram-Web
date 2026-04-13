/**
 * Скрипт для восстановления админ-прав пользователя
 * User ID: glmkTZhoHoSegk1ahxJY0LP1tov1
 * Email: goh@gmail.com
 */

const admin = require('firebase-admin');

// Инициализация Firebase Admin
const serviceAccount = require('./firebase-admin-key.json'); // Нужен ключ

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function restoreAdminUser() {
  const userId = 'glmkTZhoHoSegk1ahxJY0LP1tov1';
  
  try {
    console.log('Восстановление данных пользователя...');
    
    // Обновляем документ пользователя
    await db.collection('users').doc(userId).set({
      email: 'goh@gmail.com',
      name: 'Admin',
      role: 'admin',
      isOfficial: true,
      isBanned: false,
      status: 'online',
      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      stars: 0,
      giftsSent: 0,
      giftsReceived: 0
    }, { merge: true });
    
    console.log('✅ Данные пользователя восстановлены!');
    console.log('Пользователь теперь:');
    console.log('- Админ (role: admin)');
    console.log('- Официальный (isOfficial: true)');
    console.log('- Галочка будет отображаться');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

restoreAdminUser();
