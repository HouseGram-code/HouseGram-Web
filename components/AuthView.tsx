'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { getDeviceInfo } from '@/utils/deviceInfo';
import { AlertCircle, Clock, Shield } from 'lucide-react';

export default function AuthView() {
  const { themeColor } = useChat();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);

  // Подписка на режим технических работ
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setIsMaintenance(docSnap.data().maintenanceMode || false);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkUsernameTaken = async (username: string) => {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Блокируем вход во время технических работ
    if (isMaintenance) {
      setError('В настоящее время проводятся технические работы. Пожалуйста, попробуйте позже.');
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        // Проверяем, не заблокирован ли пользователь
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        if (userDoc.exists() && userDoc.data().isBanned) {
          await auth.signOut();
          setError('Ваш аккаунт был заблокирован администрацией.');
          setLoading(false);
          return;
        }
      } else {
        if (await checkUsernameTaken(username)) {
          setError('Имя пользователя уже занято.');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Создаем сессию для нового устройства
        const deviceInfo = getDeviceInfo();
        const sessionId = crypto.randomUUID();
        localStorage.setItem('sessionId', sessionId);
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          name: name.substring(0, 45),
          username: username.substring(0, 15),
          bio: '',
          role: email === 'veraloktushina1958@gmail.com' ? 'admin' : 'user',
          isBanned: false,
          createdAt: serverTimestamp(),
          status: 'online',
          lastSeen: serverTimestamp()
        });
        
        // Сохраняем информацию о сессии
        await setDoc(doc(db, 'sessions', sessionId), {
          userId: user.uid,
          deviceId: sessionId,
          device: deviceInfo.device,
          platform: deviceInfo.platform,
          browser: deviceInfo.browser,
          location: deviceInfo.location,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp()
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Вход по почте и паролю отключен. Пожалуйста, используйте вход через Google или включите Email/Password в консоли Firebase (Authentication -> Sign-in method).');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Неверный email или пароль. Возможно, вы еще не зарегистрированы?');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Этот email уже зарегистрирован.');
      } else if (err.code === 'auth/weak-password') {
        setError('Пароль слишком слабый. Используйте минимум 6 символов.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Неверный формат email.');
      } else {
        setError(err.message || 'Произошла ошибка');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    
    // Блокируем вход во время технических работ
    if (isMaintenance) {
      setError('В настоящее время проводятся технические работы. Пожалуйста, попробуйте позже.');
      return;
    }
    
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Создаем сессию для нового устройства
      const deviceInfo = getDeviceInfo();
      const sessionId = crypto.randomUUID();
      localStorage.setItem('sessionId', sessionId);
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const rawUsername = user.displayName || user.email?.split('@')[0] || 'User';
        const finalUsername = rawUsername.startsWith('@') ? rawUsername : '@' + rawUsername.replace(/@/g, '');
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          name: (user.displayName || user.email?.split('@')[0] || 'User').substring(0, 45),
          username: finalUsername.substring(0, 15),
          bio: '',
          role: user.email === 'veraloktushina1958@gmail.com' ? 'admin' : 'user',
          isBanned: false,
          createdAt: serverTimestamp(),
          status: 'online',
          lastSeen: serverTimestamp()
        });
      }
      
      // Сохраняем или обновляем информацию о сессии
      await setDoc(doc(db, 'sessions', sessionId), {
        userId: user.uid,
        deviceId: sessionId,
        device: deviceInfo.device,
        platform: deviceInfo.platform,
        browser: deviceInfo.browser,
        location: deviceInfo.location,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp()
      });
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Окно авторизации было закрыто.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Запрос на авторизацию отменен.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Окно авторизации заблокировано браузером. Пожалуйста, разрешите всплывающие окна.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        setError('Неверные учетные данные Google.');
      } else {
        setError(err.message || 'Ошибка при входе через Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-white flex flex-col items-center justify-center p-6 z-50"
    >
      {/* Модальное окно технических работ */}
      {isMaintenance && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
              <Clock size={40} className="text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Технические работы
            </h2>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              Мы проводим плановое обновление системы для улучшения работы HouseGram.
              <br />
              <span className="text-sm text-gray-500">Пожалуйста, зайдите немного позже.</span>
            </p>
            
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <Shield size={20} />
                <span className="font-medium">Это займет несколько минут</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-400">
              Приносим извинения за неудобства
            </div>
          </div>
        </motion.div>
      )}

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold shadow-lg" style={{ backgroundColor: themeColor }}>
            HG
          </div>
          <h1 className="text-2xl font-bold text-gray-900">HouseGram Web</h1>
          <p className="text-gray-500 mt-2">
            {isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <input
                  type="text"
                  placeholder="Ваше имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={45}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 transition-shadow"
                  style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Имя пользователя"
                  value={username.startsWith('@') ? username : (username ? '@' + username : '')}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val && !val.startsWith('@')) val = '@' + val.replace(/@/g, '');
                    setUsername(val);
                  }}
                  maxLength={15}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 transition-shadow"
                  style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                  required
                />
              </div>
            </>
          )}
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 transition-shadow"
              style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 transition-shadow"
              style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-medium transition-opacity disabled:opacity-50"
            style={{ backgroundColor: themeColor }}
          >
            {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="mt-4">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">или</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
          
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Войти через Google
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-sm font-medium hover:underline"
            style={{ color: themeColor }}
          >
            {isLogin ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
