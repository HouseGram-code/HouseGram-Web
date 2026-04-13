// Простой скрипт для восстановления админ-прав
// Использует firebase-admin

const admin = require('firebase-admin');

// Инициализация с учетными данными проекта
admin.initializeApp({
  projectId: 'housegram-d070d'
});

const db = admin.firestore();

async function restoreAdmin() {
  try {
    console.log('🔄 Восстановление админ-прав...');
    
    const userId = 'glmkTZhoHoSegk1ahxJY0LP1tov1';
    
    await db.collection('users').doc(userId).update({
      role: 'admin',
      isOfficial: true
    });
    
    console.log('✅ Успешно восстановлено!');
    console.log('📧 Email: goh@gmail.com');
    console.log('👤 User ID:', userId);
    console.log('🔑 Role: admin');
    console.log('✓ isOfficial: true');
    console.log('');
    console.log('Обновите страницу приложения!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

restoreAdmin();
