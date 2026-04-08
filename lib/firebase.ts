import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
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
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;

// Включаем оффлайн поддержку
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Несколько вкладок открыто, persistence может быть включена только в одной
      console.warn('Firebase persistence: Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      // Браузер не поддерживает persistence
      console.warn('Firebase persistence: Browser does not support offline persistence.');
    }
  });
}

