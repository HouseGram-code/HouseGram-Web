import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, persistentLocalCache, persistentMultipleTabManager, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Конфигурация через переменные окружения (с фоллбэком для разработки)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
};

// Валидация конфигурации
const requiredVars = ['NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
const missingVars = requiredVars.filter(v => !process.env[v]);
if (missingVars.length > 0 && typeof window !== 'undefined') {
  console.warn(`Missing Firebase config variables: ${missingVars.join(', ')}`);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Инициализируем Firestore с оффлайн поддержкой (только на клиенте)
export const db = typeof window !== 'undefined'
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    })
  : getFirestore(app);

export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
