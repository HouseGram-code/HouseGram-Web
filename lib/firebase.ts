import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, persistentLocalCache, persistentMultipleTabManager, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Демо конфигурация для работы без настройки
const demoConfig = {
  apiKey: "AIzaSyDemo_Key_For_Testing_Only",
  authDomain: "demo-housegram.firebaseapp.com",
  projectId: "demo-housegram",
  storageBucket: "demo-housegram.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo",
  measurementId: "G-DEMO"
};

// Конфигурация через переменные окружения (с фоллбэком на демо)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || demoConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || demoConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || demoConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || demoConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || demoConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || demoConfig.appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || demoConfig.measurementId
};

// Проверяем используется ли демо режим
export const isDemoMode = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (isDemoMode && typeof window !== 'undefined') {
  console.log('🎭 Работа в ДЕМО режиме. Для полной функциональности настройте Firebase.');
}

// Инициализируем Firebase
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} catch (error) {
  console.error('Firebase initialization error:', error);
  app = null as any;
}

// Инициализируем Firestore
// В продакшене не используем persistentLocalCache чтобы избежать оффлайн ошибок
export const db = app && typeof window !== 'undefined' && !isDemoMode
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    })
  : app ? getFirestore(app) : null as any;

export const auth = app ? getAuth(app) : null as any;
export const storage = app ? getStorage(app) : null as any;
export default app;
