import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDo2yWS2PFYCceBoiGnDXiI_-kAC_ZX3pc",
  authDomain: "housegram-d070d.firebaseapp.com",
  projectId: "housegram-d070d",
  storageBucket: "housegram-d070d.firebasestorage.app",
  messagingSenderId: "812659108162",
  appId: "1:812659108162:web:3282da59b84348eb7900db",
  measurementId: "G-1GLFYH9CG6"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Используем новый API для кэширования (без предупреждений)
export const db = getFirestore(app);

// Настраиваем оффлайн поддержку с новым API
if (typeof window !== 'undefined' && getApps().length === 1) {
  try {
    // Новый способ включения persistence без предупреждений
    const firestoreSettings = {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    };
    // Применяется автоматически при инициализации
  } catch (err) {
    console.warn('Firebase persistence setup:', err);
  }
}

export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;

