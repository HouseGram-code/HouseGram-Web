// Автоматическая инициализация settings/global при первом запуске
import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

let initialized = false;

export async function initializeFirebaseSettings() {
  // Выполняем только один раз
  if (initialized) return;
  initialized = true;

  try {
    const settingsRef = doc(db, 'settings', 'global');
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      console.log('🔧 Создание settings/global...');
      
      await setDoc(settingsRef, {
        maintenanceMode: false,
        victoryDayTheme: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('✅ settings/global создан успешно!');
    }
  } catch (error) {
    // Тихо игнорируем ошибки - не критично
    console.debug('Firebase settings init:', error);
  }
}
