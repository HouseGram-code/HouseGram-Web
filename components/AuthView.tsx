'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { motion } from 'motion/react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { getDeviceInfo } from '@/utils/deviceInfo';
import { AlertCircle, Clock, Shield } from 'lucide-react';
import { WELCOME_BONUS_STARS } from '@/lib/gifts';

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
    try {
      const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
        if (docSnap.exists()) {
          setIsMaintenance(docSnap.data().maintenanceMode || false);
        }
      }, (error) => {
        console.warn('Failed to load maintenance mode:', error);
        // Игнорируем ошибку и продолжаем работу
      });

      return () => unsubscribe();
    } catch (error) {
      console.warn('Failed to setup maintenance mode listener:', error);
      // Игнорируем ошибку и продолжаем работу
    }
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
          lastSeen: serverTimestamp(),
          // Приветственный бонус: 250 молний за регистрацию.
          stars: WELCOME_BONUS_STARS,
          giftsSent: 0,
          giftsReceived: 0,
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
          lastSeen: serverTimestamp(),
          // Приветственный бонус: 250 молний за первый вход через Google.
          stars: WELCOME_BONUS_STARS,
          giftsSent: 0,
          giftsReceived: 0,
          avatarUrl: user.photoURL || '',
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
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-6 z-50 overflow-hidden"
    >
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-pink-200/30 to-orange-200/30 rounded-full blur-3xl"
        />
      </div>
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

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo and Title */}
        <motion.div 
          className="text-center mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <motion.div 
            className="w-24 h-24 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold shadow-2xl relative overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`
            }}
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
            <span className="relative z-10">HG</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </motion.div>
          <motion.h1 
            className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            HouseGram Web
          </motion.h1>
          <motion.p 
            className="text-gray-600 mt-2 font-medium"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {isLogin ? '✨ Добро пожаловать!' : '🚀 Начните общение'}
          </motion.p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50"
        >

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <input
                  type="text"
                  placeholder="👤 Ваше имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={45}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-transparent focus:ring-4 transition-all bg-white/50 backdrop-blur-sm font-medium placeholder:text-gray-400"
                  style={{ '--tw-ring-color': themeColor + '40' } as React.CSSProperties}
                  required
                />
              </motion.div>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.75 }}
              >
                <input
                  type="text"
                  placeholder="@username"
                  value={username.startsWith('@') ? username : (username ? '@' + username : '')}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val && !val.startsWith('@')) val = '@' + val.replace(/@/g, '');
                    setUsername(val);
                  }}
                  maxLength={15}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-transparent focus:ring-4 transition-all bg-white/50 backdrop-blur-sm font-medium placeholder:text-gray-400"
                  style={{ '--tw-ring-color': themeColor + '40' } as React.CSSProperties}
                  required
                />
              </motion.div>
            </>
          )}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: isLogin ? 0.7 : 0.8 }}
          >
            <input
              type="email"
              placeholder="📧 Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-transparent focus:ring-4 transition-all bg-white/50 backdrop-blur-sm font-medium placeholder:text-gray-400"
              style={{ '--tw-ring-color': themeColor + '40' } as React.CSSProperties}
              required
            />
          </motion.div>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: isLogin ? 0.75 : 0.85 }}
          >
            <input
              type="password"
              placeholder="🔒 Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-transparent focus:ring-4 transition-all bg-white/50 backdrop-blur-sm font-medium placeholder:text-gray-400"
              style={{ '--tw-ring-color': themeColor + '40' } as React.CSSProperties}
              required
            />
          </motion.div>

          {error && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-4 rounded-2xl border border-red-200"
            >
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: isLogin ? 0.8 : 0.9 }}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-all disabled:opacity-50 shadow-lg hover:shadow-xl relative overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`
            }}
          >
            <span className="relative z-10">
              {loading ? '⏳ Загрузка...' : isLogin ? '🚀 Войти' : '✨ Создать аккаунт'}
            </span>
            {!loading && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            )}
          </motion.button>
        </form>

        <motion.div 
          className="mt-6"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: isLogin ? 0.85 : 0.95 }}
        >
          <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t-2 border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-sm font-semibold">или</span>
            <div className="flex-grow border-t-2 border-gray-200"></div>
          </div>
          
          <motion.button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 mt-4 rounded-2xl bg-white border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Войти через Google</span>
          </motion.button>
        </motion.div>

        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: isLogin ? 0.9 : 1 }}
        >
          <motion.button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-sm font-bold hover:underline px-6 py-2 rounded-full transition-all"
            style={{ color: themeColor }}
          >
            {isLogin ? '✨ Нет аккаунта? Создать' : '🔑 Уже есть аккаунт? Войти'}
          </motion.button>
        </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
