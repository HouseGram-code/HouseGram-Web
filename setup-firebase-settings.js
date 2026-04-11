// Скрипт для создания документа settings/global в Firestore
// Запуск: node setup-firebase-settings.js

const admin = require('firebase-admin');
const path = require('path');

// Инициализация Firebase Admin SDK
// Убедитесь что у вас есть файл serviceAccountKey.json
// Скачайте его из Firebase Console → Project Settings → Service Accounts → Generate new private key

let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
} catch (error) {
  console.error('❌ Ошибка: Не найден файл serviceAccountKey.json');
  console.log('\n📝 Как получить serviceAccountKey.json:');
  console.log('1. Откройте Firebase Console: https://console.firebase.google.com/');
  console.log('2. Выберите ваш проект');
  console.log('3. Project Settings (⚙️) → Service Accounts');
  console.log('4. Нажмите "Generate new private key"');
  console.log('5. Сохраните файл как serviceAccountKey.json в корне проекта');
  console.log('6. Запустите скрипт снова: node setup-firebase-settings.js\n');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setupSettings() {
  try {
    console.log('🔧 Создание документа settings/global...\n');

    // Создаем документ settings/global
    await db.collection('settings').doc('global').set({
      maintenanceMode: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Документ settings/global успешно создан!');
    console.log('📄 Содержимое:');
    console.log('   - maintenanceMode: false');
    console.log('   - createdAt: (текущее время)');
    console.log('   - updatedAt: (текущее время)\n');

    // Проверяем что документ создан
    const doc = await db.collection('settings').doc('global').get();
    if (doc.exists) {
      console.log('✅ Проверка: Документ существует');
      console.log('📊 Данные:', doc.data());
    } else {
      console.log('❌ Ошибка: Документ не найден после создания');
    }

    console.log('\n🎉 Готово! Ошибка Firebase должна исчезнуть.');
    console.log('🔄 Перезагрузите приложение чтобы изменения вступили в силу.\n');

  } catch (error) {
    console.error('❌ Ошибка при создании документа:', error);
    console.log('\n💡 Возможные причины:');
    console.log('1. Неправильный serviceAccountKey.json');
    console.log('2. Недостаточно прав доступа');
    console.log('3. Проблемы с сетью\n');
  } finally {
    process.exit(0);
  }
}

// Запускаем скрипт
setupSettings();
