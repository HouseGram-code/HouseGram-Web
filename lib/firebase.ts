import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Реальная конфигурация проекта housegramweb. Эти значения предназначены для
// клиентского SDK Firebase и не являются секретом — их безопасно публиковать
// (доступ к данным контролируется через Firestore Rules / App Check).
const defaultConfig = {
  apiKey: "AIzaSyCzGlPzYOjZMKG9u5sx1UYTTM08GvywabU",
  authDomain: "housegramweb.firebaseapp.com",
  databaseURL: "https://housegramweb-default-rtdb.firebaseio.com",
  projectId: "housegramweb",
  storageBucket: "housegramweb.firebasestorage.app",
  messagingSenderId: "865820988349",
  appId: "1:865820988349:web:f064ac2fcf646056e6f8d4",
  measurementId: "G-CSBB5C368G",
};

// Конфигурация через переменные окружения (с фоллбэком на дефолтный housegramweb)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || defaultConfig.databaseURL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || defaultConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || defaultConfig.appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || defaultConfig.measurementId,
};

// Демо-режим был удалён вместе с фейковым ключом, чтобы не путать поведение
// клиента и не падать с auth-ошибками при работе без env-переменных.
export const isDemoMode = false;

// Инициализируем Firebase
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} catch (error) {
  console.error('Firebase initialization error:', error);
  app = null as any;
}

// Инициализируем Firestore БЕЗ оффлайн кэша
export const db = app ? getFirestore(app) : null as any;
export const auth = app ? getAuth(app) : null as any;
export const storage = app ? getStorage(app) : null as any;
export default app;
