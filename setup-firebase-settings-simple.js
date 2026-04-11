// Простой скрипт для создания settings/global через Firebase Web SDK
// Запуск: node setup-firebase-settings-simple.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, serverTimestamp } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const readline = require('readline');

// Читаем конфигурацию из .env.local
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Файл .env.local не найден!');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  // Ищем NEXT_PUBLIC_FIREBASE_CONFIG
  const configMatch = envContent.match(/NEXT_PUBLIC_FIREBASE_CONFIG=(.+)/);
  if (configMatch) {
    try {
      return JSON.parse(configMatch[1]);
    } catch (e) {
      console.error('❌ Ошибка парсинга NEXT_PUBLIC_FIREBASE_CONFIG');
      process.exit(1);
    }
  }

  console.error('❌ NEXT_PUBLIC_FIREBASE_CONFIG не найден в .env.local');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  try {
    console.log('🔧 Настройка Firebase settings/global\n');

    // Загружаем конфигурацию
    const firebaseConfig = loadEnv();
    console.log('✅ Конфигурация Firebase загружена из .env.local\n');

    // Инициализируем Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    console.log('📧 Для создания документа нужно войти под администратором');
    const email = await question('Email администратора: ');
    const password = await question('Пароль: ');

    console.log('\n🔐 Вход в систему...');
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Успешный вход!\n');

    // Проверяем существует ли документ
    console.log('🔍 Проверка существующего документа...');
    const docRef = doc(db, 'settings', 'global');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log('⚠️  Документ settings/global уже существует!');
      console.log('📊 Текущие данные:', docSnap.data());
      const overwrite = await question('\nПерезаписать? (y/n): ');
      
      if (overwrite.toLowerCase() !== 'y') {
        console.log('❌ Отменено пользователем');
        rl.close();
        process.exit(0);
      }
    }

    // Создаем/обновляем документ
    console.log('\n📝 Создание документа settings/global...');
    await setDoc(docRef, {
      maintenanceMode: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('✅ Документ успешно создан!\n');

    // Проверяем
    const newDocSnap = await getDoc(docRef);
    if (newDocSnap.exists()) {
      console.log('✅ Проверка: Документ существует');
      console.log('📊 Данные:', newDocSnap.data());
    }

    console.log('\n🎉 Готово! Ошибка Firebase должна исчезнуть.');
    console.log('🔄 Перезагрузите приложение.\n');

  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    
    if (error.code === 'auth/invalid-credential') {
      console.log('\n💡 Неверный email или пароль');
    } else if (error.code === 'auth/user-not-found') {
      console.log('\n💡 Пользователь не найден');
    } else if (error.code === 'permission-denied') {
      console.log('\n💡 Недостаточно прав. Войдите под администратором.');
    }
  } finally {
    rl.close();
    process.exit(0);
  }
}

setup();
