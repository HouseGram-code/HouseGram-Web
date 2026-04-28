'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Gamepad2, Coins, Zap, TrendingUp, Star, Crown, Gift } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function MiniGamesView() {
  const { setView, themeColor } = useChat();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const games = [
    {
      id: 'clicker',
      name: 'Crypto Clicker',
      icon: <Coins size={32} className="text-yellow-500" />,
      description: 'Кликай и зарабатывай HouseCoin!',
      gradient: 'from-yellow-400 via-orange-400 to-red-500',
      available: true
    },
    {
      id: 'puzzle',
      name: 'Crypto Puzzle',
      icon: <Star size={32} className="text-purple-500" />,
      description: 'Решай головоломки за награды',
      gradient: 'from-purple-400 via-pink-400 to-red-400',
      available: false
    },
    {
      id: 'race',
      name: 'Coin Race',
      icon: <Zap size={32} className="text-blue-500" />,
      description: 'Гонки за криптомонетами',
      gradient: 'from-blue-400 via-cyan-400 to-teal-400',
      available: false
    }
  ];

  if (selectedGame === 'clicker') {
    return <CryptoClickerGame onBack={() => setSelectedGame(null)} themeColor={themeColor} />;
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col z-10"
    >
      {/* Header */}
      <div
        className="text-tg-header-text px-2.5 h-12 flex items-center gap-2.5 shrink-0 shadow-lg"
        style={{ backgroundColor: themeColor }}
      >
        <button
          onClick={() => setView('menu')}
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <Gamepad2 size={24} />
        <h1 className="text-[18px] font-medium">Мини-игры</h1>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4">
        {/* Hero Section */}
        <motion.div 
          className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-3xl p-6 mb-6 overflow-hidden shadow-2xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              >
                <Coins size={16} className="text-white/30" />
              </motion.div>
            ))}
          </div>

          <div className="relative z-10 text-center">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              className="inline-block mb-4"
            >
              <Gamepad2 size={64} className="text-white" />
            </motion.div>
            <h2 className="text-white text-[28px] font-bold mb-2">Играй и зарабатывай!</h2>
            <p className="text-white/90 text-[15px]">
              Получай HouseCoin за игры и обменивай на молнии и премиум
            </p>
          </div>
        </motion.div>

        {/* Games Grid */}
        <div className="space-y-3 mb-6">
          {games.map((game, index) => (
            <motion.button
              key={game.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => game.available && setSelectedGame(game.id)}
              disabled={!game.available}
              className={`w-full bg-gradient-to-r ${game.gradient} rounded-2xl p-5 shadow-lg relative overflow-hidden ${
                game.available ? 'cursor-pointer active:scale-[0.98]' : 'opacity-60 cursor-not-allowed'
              }`}
              whileHover={game.available ? { scale: 1.02 } : {}}
              whileTap={game.available ? { scale: 0.98 } : {}}
            >
              {/* Shimmer Effect */}
              {game.available && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                />
              )}

              <div className="relative z-10 flex items-center gap-4">
                <motion.div
                  animate={game.available ? { 
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"
                >
                  {game.icon}
                </motion.div>
                <div className="flex-grow text-left">
                  <h3 className="text-white text-[18px] font-bold mb-1">{game.name}</h3>
                  <p className="text-white/90 text-[14px]">{game.description}</p>
                </div>
                {!game.available && (
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-[12px] font-semibold">
                    Скоро
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Info Cards */}
        <div className="space-y-3">
          <motion.div 
            className="bg-white rounded-2xl p-4 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                <Coins size={20} className="text-yellow-600" />
              </div>
              <div>
                <h4 className="text-[15px] font-semibold text-gray-900 mb-1">Зарабатывай монеты</h4>
                <p className="text-[13px] text-gray-600">
                  Играй в игры и получай HouseCoin. Чем больше играешь, тем больше зарабатываешь!
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-2xl p-4 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                <TrendingUp size={20} className="text-orange-600" />
              </div>
              <div>
                <h4 className="text-[15px] font-semibold text-gray-900 mb-1">Улучшения</h4>
                <p className="text-[13px] text-gray-600">
                  Покупай улучшения, чтобы зарабатывать больше монет за клик и автоматически!
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-2xl p-4 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                <Crown size={20} className="text-purple-600" />
              </div>
              <div>
                <h4 className="text-[15px] font-semibold text-gray-900 mb-1">Используй монеты</h4>
                <p className="text-[13px] text-gray-600">
                  Обменивай HouseCoin на молнии, премиум подписку и отправляй подарки друзьям!
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// Crypto Clicker Game Component
function CryptoClickerGame({ onBack, themeColor }: { onBack: () => void; themeColor: string }) {
  const { currentUser } = useChat();
  const [coins, setCoins] = useState(0);
  const [coinsPerClick, setCoinsPerClick] = useState(0.0001);
  const [coinsPerSecond, setCoinsPerSecond] = useState(0);
  const [clickUpgradeLevel, setClickUpgradeLevel] = useState(0);
  const [autoUpgradeLevel, setAutoUpgradeLevel] = useState(0);
  const [clickAnimations, setClickAnimations] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Защита от автокликера
  const [clickCount, setClickCount] = useState(0);
  const [clickTimestamp, setClickTimestamp] = useState(Date.now());
  const [isBlocked, setIsBlocked] = useState(false);

  // Load game progress from Firestore
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const loadProgress = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.gameProgress?.cryptoClicker) {
            const progress = data.gameProgress.cryptoClicker;
            
            // Проверка на бан
            if (progress.banned) {
              // Обнуляем баланс забаненного пользователя
              await updateDoc(doc(db, 'users', currentUser.id), {
                'gameProgress.cryptoClicker.coins': 0,
                'gameProgress.cryptoClicker.coinsPerClick': 0.0001,
                'gameProgress.cryptoClicker.coinsPerSecond': 0,
                'gameProgress.cryptoClicker.clickUpgradeLevel': 0,
                'gameProgress.cryptoClicker.autoUpgradeLevel': 0,
                'gameProgress.cryptoClicker.balanceResetAt': serverTimestamp()
              });
              
              alert(`❌ Вы заблокированы в мини-играх!\nПричина: ${progress.bannedReason || 'Нарушение правил'}\n\nВаш игровой прогресс был сброшен.`);
              onBack();
              return;
            }
            
            // Проверяем корректность загруженных данных
            const loadedCoins = progress.coins || 0;
            if (loadedCoins < 0 || isNaN(loadedCoins)) {
              console.error('Invalid coins value loaded:', loadedCoins);
              setCoins(0);
            } else {
              setCoins(loadedCoins);
            }
            
            setCoinsPerClick(progress.coinsPerClick || 0.0001);
            setCoinsPerSecond(progress.coinsPerSecond || 0);
            setClickUpgradeLevel(progress.clickUpgradeLevel || 0);
            setAutoUpgradeLevel(progress.autoUpgradeLevel || 0);
          }
        }
      } catch (error) {
        console.error('Error loading game progress:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProgress();
  }, [currentUser, onBack]);

  // Save game progress to Firestore
  useEffect(() => {
    if (!currentUser?.id || loading) return;
    
    const saveProgress = async () => {
      try {
        // Проверяем, что значения корректны перед сохранением
        if (coins < 0 || isNaN(coins)) {
          console.error('Invalid coins value:', coins);
          return;
        }
        
        await updateDoc(doc(db, 'users', currentUser.id), {
          'gameProgress.cryptoClicker': {
            coins,
            coinsPerClick,
            coinsPerSecond,
            clickUpgradeLevel,
            autoUpgradeLevel,
            lastSaved: serverTimestamp()
          }
        });
      } catch (error) {
        console.error('Error saving game progress:', error);
      }
    };
    
    // Debounce save - save every 2 seconds
    const timer = setTimeout(saveProgress, 2000);
    return () => clearTimeout(timer);
  }, [coins, coinsPerClick, coinsPerSecond, clickUpgradeLevel, autoUpgradeLevel, currentUser, loading]);

  // Auto-earn coins
  useEffect(() => {
    if (coinsPerSecond <= 0) return;
    
    const interval = setInterval(() => {
      setCoins(prev => {
        const newValue = prev + coinsPerSecond / 10;
        // Проверяем на переполнение и некорректные значения
        if (newValue < 0 || isNaN(newValue) || newValue > 1000000) {
          console.error('Invalid auto-earn value:', newValue);
          return prev;
        }
        return newValue;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [coinsPerSecond]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Защита от автокликера
    const now = Date.now();
    const timeDiff = now - clickTimestamp;
    
    // Если прошло больше 1 секунды, сбрасываем счетчик
    if (timeDiff > 1000) {
      setClickCount(1);
      setClickTimestamp(now);
    } else {
      // Увеличиваем счетчик кликов
      const newClickCount = clickCount + 1;
      setClickCount(newClickCount);
      
      // Если больше 15 кликов в секунду - блокируем
      if (newClickCount > 15) {
        setIsBlocked(true);
        alert('⚠️ Обнаружен автокликер!\n\nВы заблокированы на 30 секунд.\nИспользование автокликеров запрещено!');
        
        // Блокируем на 30 секунд
        setTimeout(() => {
          setIsBlocked(false);
          setClickCount(0);
        }, 30000);
        
        return;
      }
    }
    
    // Если заблокирован - не начисляем монеты
    if (isBlocked) {
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCoins(prev => prev + coinsPerClick);
    
    // Add click animation
    const id = Date.now() + Math.random();
    setClickAnimations(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setClickAnimations(prev => prev.filter(anim => anim.id !== id));
    }, 1000);
  };

  const buyClickUpgrade = () => {
    const cost = Math.pow(2.5, clickUpgradeLevel) * 0.01; // Увеличена сложность с 1.5 до 2.5
    if (coins >= cost) {
      setCoins(prev => prev - cost);
      setClickUpgradeLevel(prev => prev + 1);
      setCoinsPerClick(prev => prev * 2); // Увеличен множитель с 1.5 до 2
    }
  };

  const buyAutoUpgrade = () => {
    const cost = Math.pow(3, autoUpgradeLevel) * 0.05; // Увеличена стоимость с 2 до 3, базовая с 0.01 до 0.05
    if (coins >= cost) {
      setCoins(prev => prev - cost);
      setAutoUpgradeLevel(prev => prev + 1);
      setCoinsPerSecond(prev => prev + (0.001 * Math.pow(1.5, autoUpgradeLevel))); // Экспоненциальный рост дохода
    }
  };

  const getClickUpgradeCost = () => Math.pow(2.5, clickUpgradeLevel) * 0.01;
  const getAutoUpgradeCost = () => Math.pow(3, autoUpgradeLevel) * 0.05;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 flex items-center justify-center z-20"
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка игры...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 flex flex-col z-20"
    >
      {/* Header */}
      <div
        className="text-tg-header-text px-2.5 h-12 flex items-center gap-2.5 shrink-0 shadow-lg"
        style={{ backgroundColor: themeColor }}
      >
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <Coins size={24} />
        <h1 className="text-[18px] font-medium">Crypto Clicker</h1>
      </div>

      {/* Game Content */}
      <div className="flex-grow overflow-y-auto p-4 flex flex-col">
        {/* Balance Display */}
        <motion.div 
          className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 rounded-3xl p-4 sm:p-6 mb-4 shadow-2xl"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <div className="text-center">
            <div className="text-white/90 text-[13px] sm:text-[14px] font-medium mb-2">Ваш баланс</div>
            <motion.div 
              className="text-white text-[32px] sm:text-[42px] font-bold flex items-center justify-center gap-2 flex-wrap"
              key={Math.floor(coins * 10000)}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              <span className="break-all">{coins.toFixed(4)}</span>
              <Coins size={28} className="text-white shrink-0" />
            </motion.div>
            <div className="text-white/80 text-[12px] sm:text-[13px] mt-1">
              {coinsPerSecond > 0 && `+${coinsPerSecond.toFixed(4)} HC/сек`}
            </div>
          </div>
        </motion.div>

        {/* Click Area */}
        <div className="flex-grow flex items-center justify-center mb-4 relative min-h-[250px] sm:min-h-[300px]">
          {/* Предупреждение о блокировке */}
          {isBlocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-red-500/90 backdrop-blur-sm rounded-3xl flex items-center justify-center z-50 p-4"
            >
              <div className="text-center text-white">
                <div className="text-[48px] mb-2">🚫</div>
                <div className="text-[20px] font-bold mb-2">Автокликер обнаружен!</div>
                <div className="text-[14px]">Вы заблокированы на 30 секунд</div>
              </div>
            </motion.div>
          )}
          
          <motion.div
            onClick={handleClick}
            className="relative w-48 h-48 sm:w-64 sm:h-64 cursor-pointer"
            whileTap={{ scale: 0.9 }}
          >
            {/* Main Coin */}
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
              className="w-full h-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 rounded-full shadow-2xl flex items-center justify-center border-4 sm:border-8 border-yellow-200"
            >
              <Coins size={72} className="sm:w-24 sm:h-24 text-white drop-shadow-lg" />
            </motion.div>

            {/* Click Animations */}
            <AnimatePresence>
              {clickAnimations.map(anim => (
                <motion.div
                  key={anim.id}
                  initial={{ opacity: 1, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: -50, scale: 1.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="absolute pointer-events-none text-yellow-600 font-bold text-[16px] sm:text-[20px]"
                  style={{ left: anim.x, top: anim.y }}
                >
                  +{coinsPerClick.toFixed(4)}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Glow Effect */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity
              }}
              className="absolute inset-0 bg-yellow-400 rounded-full blur-3xl -z-10"
            />
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="bg-white rounded-xl p-2.5 sm:p-3 shadow-sm">
            <div className="text-[11px] sm:text-[12px] text-gray-500 mb-1">За клик</div>
            <div className="text-[16px] sm:text-[18px] font-bold text-gray-900 break-all">{coinsPerClick.toFixed(4)}</div>
          </div>
          <div className="bg-white rounded-xl p-2.5 sm:p-3 shadow-sm">
            <div className="text-[11px] sm:text-[12px] text-gray-500 mb-1">В секунду</div>
            <div className="text-[16px] sm:text-[18px] font-bold text-gray-900 break-all">{coinsPerSecond.toFixed(4)}</div>
          </div>
        </div>

        {/* Upgrades Button */}
        <motion.button
          onClick={() => setShowUpgrades(!showUpgrades)}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-3 sm:p-4 font-bold text-[14px] sm:text-[16px] shadow-lg mb-3 sm:mb-4"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingUp size={18} className="sm:w-5 sm:h-5" />
            {showUpgrades ? 'Скрыть улучшения' : 'Показать улучшения'}
          </div>
        </motion.button>

        {/* Upgrades Panel */}
        <AnimatePresence>
          {showUpgrades && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 sm:space-y-3 overflow-hidden"
            >
              {/* Click Upgrade */}
              <motion.button
                onClick={buyClickUpgrade}
                disabled={coins < getClickUpgradeCost()}
                className={`w-full bg-white rounded-2xl p-3 sm:p-4 shadow-sm ${
                  coins >= getClickUpgradeCost() ? 'cursor-pointer active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'
                }`}
                whileHover={coins >= getClickUpgradeCost() ? { scale: 1.02 } : {}}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center shrink-0">
                    <Zap size={20} className="sm:w-6 sm:h-6 text-white" fill="white" />
                  </div>
                  <div className="flex-grow text-left min-w-0">
                    <div className="text-[14px] sm:text-[15px] font-semibold text-gray-900">Мощный клик</div>
                    <div className="text-[11px] sm:text-[12px] text-gray-500">Уровень {clickUpgradeLevel}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[13px] sm:text-[14px] font-bold text-gray-900">{getClickUpgradeCost().toFixed(4)}</div>
                    <div className="text-[10px] sm:text-[11px] text-gray-500">HC</div>
                  </div>
                </div>
              </motion.button>

              {/* Auto Upgrade */}
              <motion.button
                onClick={buyAutoUpgrade}
                disabled={coins < getAutoUpgradeCost()}
                className={`w-full bg-white rounded-2xl p-3 sm:p-4 shadow-sm ${
                  coins >= getAutoUpgradeCost() ? 'cursor-pointer active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'
                }`}
                whileHover={coins >= getAutoUpgradeCost() ? { scale: 1.02 } : {}}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                    <Star size={20} className="sm:w-6 sm:h-6 text-white" fill="white" />
                  </div>
                  <div className="flex-grow text-left min-w-0">
                    <div className="text-[14px] sm:text-[15px] font-semibold text-gray-900">Авто-фарм</div>
                    <div className="text-[11px] sm:text-[12px] text-gray-500">Уровень {autoUpgradeLevel}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[13px] sm:text-[14px] font-bold text-gray-900">{getAutoUpgradeCost().toFixed(4)}</div>
                    <div className="text-[10px] sm:text-[11px] text-gray-500">HC</div>
                  </div>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
