import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDo2yWS2PFYCceBoiGnDXiI_-kAC_ZX3pc",
  authDomain: "housegram-d070d.firebaseapp.com",
  projectId: "housegram-d070d",
  storageBucket: "housegram-d070d.firebasestorage.app",
  messagingSenderId: "812659108162",
  appId: "1:812659108162:web:3282da59b84348eb7900db"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function restoreAdmin() {
  try {
    console.log('🔄 Восстановление админ-прав...');
    
    const userId = 'glmkTZhoHoSegk1ahxJY0LP1tov1';
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
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
