'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Gamepad2, Coins, Zap, TrendingUp, Star, Crown, Gift, Wallet, ArrowDownToLine, Loader2, X, CheckCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, runTransaction, serverTimestamp } from 'firebase/firestore';

// Комиссия при выводе HouseCoin из клиeкера в основной кошелёк (walletBalance).
const WITHDRAW_COMMISSION_RATE = 0.05;
// Минимальная сумма для вывода — иначе пыль будет генерировать кучу
// микро-транзакций. С новой экономикой (0.01 за клик) копится быстро.
const MIN_WITHDRAW = 0.10;

// === Экономика Crypto Clicker =====================================
// Базовая награда за клик: 0.01 HC (1000 кликов = 10 HC). Раньше было
// 0.0001 — слишком медленно, поэтому повышено в 100 раз.
const BASE_CLICK = 0.01;
// Базовая прибавка автокликера на 1-м уровне: 0.02 HC/сек.
const BASE_AUTO = 0.02;
// Каждый уровень мощного клика удваивает награду за клик. Стоимость
// первого уровня — 0.15 HC, далее ×2.5 за уровень.
const CLICK_UPGRADE_BASE_COST = 0.15;
const CLICK_UPGRADE_GROWTH = 2.5;
// Автокликер: первый уровень 0.50 HC, далее ×3. Каждый уровень
// добавляет BASE_AUTO * 1.5^level к доходу в секунду.
const AUTO_UPGRADE_BASE_COST = 0.50;
const AUTO_UPGRADE_GROWTH = 3;
const AUTO_INCOME_GROWTH = 1.5;
// Золотой множитель: первый уровень 2.00 HC, далее ×4. Каждый уровень
// даёт +20% к ИТОГОВЫМ начислениям (и за клик, и за секунду).
const MULTIPLIER_UPGRADE_BASE_COST = 2.00;
const MULTIPLIER_UPGRADE_GROWTH = 4;
const MULTIPLIER_PER_LEVEL = 0.20;

// Деривации — единый источник истины. coinsPerClick/coinsPerSecond
// рассчитываются ИЗ уровней (миграция со старых значений происходит
// автоматически при загрузке, потому что мы перетираем сохранённые
// числа на формулу с новой базой).
const computeCoinsPerClick = (clickLvl: number): number =>
  BASE_CLICK * Math.pow(2, clickLvl);

const computeCoinsPerSecond = (autoLvl: number): number => {
  let total = 0;
  for (let i = 0; i < autoLvl; i++) {
    total += BASE_AUTO * Math.pow(AUTO_INCOME_GROWTH, i);
  }
  return total;
};

const computeMultiplier = (multLvl: number): number =>
  1 + MULTIPLIER_PER_LEVEL * multLvl;

const getClickUpgradeCost = (lvl: number): number =>
  CLICK_UPGRADE_BASE_COST * Math.pow(CLICK_UPGRADE_GROWTH, lvl);
const getAutoUpgradeCost = (lvl: number): number =>
  AUTO_UPGRADE_BASE_COST * Math.pow(AUTO_UPGRADE_GROWTH, lvl);
const getMultiplierUpgradeCost = (lvl: number): number =>
  MULTIPLIER_UPGRADE_BASE_COST * Math.pow(MULTIPLIER_UPGRADE_GROWTH, lvl);

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
  const [clickUpgradeLevel, setClickUpgradeLevel] = useState(0);
  const [autoUpgradeLevel, setAutoUpgradeLevel] = useState(0);
  // Новый апгрейд «Золотой множитель» — +20% к итоговым начислениям за уровень.
  const [multiplierUpgradeLevel, setMultiplierUpgradeLevel] = useState(0);
  const [clickAnimations, setClickAnimations] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [loading, setLoading] = useState(true);

  // Деривации — всё считаем из уровней, чтобы быть уверенными в консистентности.
  // Отдельных useState для coinsPerClick / coinsPerSecond больше не держим —
  // именно это обеспечивает «миграцию» со старой экономики (0.0001 → 0.01):
  // сохранённые числа больше не влияют, формула всегда пересчитывает от уровня.
  const coinsPerClick = computeCoinsPerClick(clickUpgradeLevel);
  const coinsPerSecond = computeCoinsPerSecond(autoUpgradeLevel);
  const multiplier = computeMultiplier(multiplierUpgradeLevel);
  // Итоговые значения после применения «Золотого множителя». Их видит игрок,
  // ими и начисляем монеты. Сами coinsPerClick/coinsPerSecond — базовые,
  // без множителя.
  const effectiveClick = coinsPerClick * multiplier;
  const effectiveSecond = coinsPerSecond * multiplier;

  // Защита от автокликера
  const [clickCount, setClickCount] = useState(0);
  const [clickTimestamp, setClickTimestamp] = useState(Date.now());
  const [isBlocked, setIsBlocked] = useState(false);

  // Вывод средств в основной кошелёк
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<{ amount: number; commission: number } | null>(null);

  // Ref на актуальный state для save-функции, которая запускается из
  // setInterval / visibilitychange / unmount cleanup. Без ref нам пришлось
  // бы перезапускать interval на каждый клик (как было раньше — отсюда и
  // баг: debounce-timeout сбрасывался каждым кликом и save НИКОГДА не
  // срабатывал, если играли быстрее 2 сек).
  const stateRef = useRef({ coins, clickUpgradeLevel, autoUpgradeLevel, multiplierUpgradeLevel });
  useEffect(() => {
    stateRef.current = { coins, clickUpgradeLevel, autoUpgradeLevel, multiplierUpgradeLevel };
  }, [coins, clickUpgradeLevel, autoUpgradeLevel, multiplierUpgradeLevel]);

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
              // Обнуляем баланс забаненного пользователя на новые дефолты.
              await updateDoc(doc(db, 'users', currentUser.id), {
                'gameProgress.cryptoClicker.coins': 0,
                'gameProgress.cryptoClicker.coinsPerClick': BASE_CLICK,
                'gameProgress.cryptoClicker.coinsPerSecond': 0,
                'gameProgress.cryptoClicker.clickUpgradeLevel': 0,
                'gameProgress.cryptoClicker.autoUpgradeLevel': 0,
                'gameProgress.cryptoClicker.multiplierUpgradeLevel': 0,
                'gameProgress.cryptoClicker.balanceResetAt': serverTimestamp()
              });
              
              alert(`❌ Вы заблокированы в мини-играх!\nПричина: ${progress.bannedReason || 'Нарушение правил'}\n\nВаш игровой прогресс был сброшен.`);
              onBack();
              return;
            }

            // Проверяем корректность загруженного баланса
            const loadedCoins = progress.coins || 0;
            if (loadedCoins < 0 || isNaN(loadedCoins)) {
              console.error('Invalid coins value loaded:', loadedCoins);
              setCoins(0);
            } else {
              setCoins(loadedCoins);
            }

            // Загружаем ТОЛЬКО уровни — coinsPerClick/coinsPerSecond больше не
            // хранятся в state, а считаются из уровней по новым формулам.
            // Это служит автоматической миграцией со старой экономики
            // (0.0001 за клик) на новую (0.01 за клик).
            setClickUpgradeLevel(progress.clickUpgradeLevel || 0);
            setAutoUpgradeLevel(progress.autoUpgradeLevel || 0);
            setMultiplierUpgradeLevel(progress.multiplierUpgradeLevel || 0);
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

  // Save game progress to Firestore.
  // КРИТИЧНО: эффект НЕ должен зависеть от coins — иначе interval/timeout
  // будет пересоздаваться на каждый клик и save никогда не сработает
  // (это и был баг «1000 кликов не сохранилось»). Все актуальные значения
  // читаем из stateRef, который обновляется отдельным эффектом выше.
  useEffect(() => {
    if (!currentUser?.id || loading) return;

    const userId = currentUser.id;

    const saveProgress = async () => {
      const s = stateRef.current;
      if (s.coins < 0 || isNaN(s.coins)) {
        console.error('Invalid coins value, skipping save:', s.coins);
        return;
      }
      // coinsPerClick/coinsPerSecond больше не хранятся в state — считаем их
      // из уровней по новым формулам и пишем в Firestore как «снимок»,
      // чтобы другие части приложения (напр. AdminView) могли
      // прочитать быстро без пересчёта.
      const computedClick = computeCoinsPerClick(s.clickUpgradeLevel);
      const computedSecond = computeCoinsPerSecond(s.autoUpgradeLevel);
      try {
        await updateDoc(doc(db, 'users', userId), {
          'gameProgress.cryptoClicker.coins': s.coins,
          'gameProgress.cryptoClicker.coinsPerClick': computedClick,
          'gameProgress.cryptoClicker.coinsPerSecond': computedSecond,
          'gameProgress.cryptoClicker.clickUpgradeLevel': s.clickUpgradeLevel,
          'gameProgress.cryptoClicker.autoUpgradeLevel': s.autoUpgradeLevel,
          'gameProgress.cryptoClicker.multiplierUpgradeLevel': s.multiplierUpgradeLevel,
          'gameProgress.cryptoClicker.lastSaved': serverTimestamp(),
        });
      } catch (error) {
        console.error('Error saving game progress:', error);
      }
    };

    // 1) Периодический автосейв каждые 3 секунды.
    const interval = setInterval(saveProgress, 3000);

    // 2) Сохраняем при сворачивании вкладки/закрытии окна — иначе кнопка
    //    «закрыть» прямо после кликов потеряет последние 3 секунды прогресса.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveProgress();
      }
    };
    const onBeforeUnload = () => {
      saveProgress();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onBeforeUnload);
      // 3) Финальный flush при размонтировании (выход из мини-игры в меню).
      saveProgress();
    };
  }, [currentUser, loading]);

  // Вывод HouseCoin из клиeкера в основной кошелёк (walletBalance) с комиссией.
  // Атомарно через runTransaction, чтобы не было гонок: одной транзакцией
  // обнуляем cryptoClicker.coins и увеличиваем walletBalance на (coins - 5%).
  const handleWithdraw = async () => {
    if (!currentUser?.id) return;
    if (withdrawing) return;
    if (coins < MIN_WITHDRAW) {
      alert(`Минимум для вывода: ${MIN_WITHDRAW.toFixed(2)} HC`);
      return;
    }

    const withdrawAmount = coins;
    const commission = withdrawAmount * WITHDRAW_COMMISSION_RATE;
    const finalAmount = withdrawAmount - commission;
    const userId = currentUser.id;

    setWithdrawing(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', userId);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error('Пользователь не найден');
        }
        const data = userDoc.data();
        const currentWallet = data.walletBalance || 0;
        const prevTotalWithdrawn = data.gameProgress?.cryptoClicker?.totalWithdrawn || 0;

        transaction.update(userRef, {
          walletBalance: currentWallet + finalAmount,
          'gameProgress.cryptoClicker.coins': 0,
          'gameProgress.cryptoClicker.lastWithdrawAt': serverTimestamp(),
          'gameProgress.cryptoClicker.totalWithdrawn': prevTotalWithdrawn + finalAmount,
        });
      });

      // Обнуляем локальный баланс — UI и stateRef обновятся синхронно,
      // следующий автосейв просто перезапишет coins=0 (что уже и так в БД).
      setCoins(0);
      setShowWithdrawModal(false);
      setWithdrawSuccess({ amount: finalAmount, commission });
      // Скрываем тост успеха через 4 секунды.
      setTimeout(() => setWithdrawSuccess(null), 4000);
    } catch (error) {
      console.error('Withdraw failed:', error);
      alert('Ошибка при выводе: ' + (error instanceof Error ? error.message : 'Unknown'));
    } finally {
      setWithdrawing(false);
    }
  };

  // Auto-earn coins. Используем effectiveSecond (с «Золотым множителем»).
  useEffect(() => {
    if (effectiveSecond <= 0) return;

    const interval = setInterval(() => {
      setCoins(prev => {
        const newValue = prev + effectiveSecond / 10;
        // Санитарный лимит поднят до 1e9 (раньше был 1 000 000) — на высоких
        // уровнях автокликер + множитель легко может выходить за 1М.
        if (newValue < 0 || isNaN(newValue) || newValue > 1e9) {
          console.error('Invalid auto-earn value:', newValue);
          return prev;
        }
        return newValue;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [effectiveSecond]);

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

    // Начисляем effectiveClick — это базовая награда * (1 + 0.2 * lvl_множителя).
    setCoins(prev => prev + effectiveClick);

    // Анимация всплывающего «+X.XX» при клике.
    const id = Date.now() + Math.random();
    setClickAnimations(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setClickAnimations(prev => prev.filter(anim => anim.id !== id));
    }, 1000);
  };

  // Покупки апгрейдов: повышаем только уровень, coinsPerClick/Second
  // автоматически пересчитаются на следующем рендере (они derived).
  const buyClickUpgrade = () => {
    const cost = getClickUpgradeCost(clickUpgradeLevel);
    if (coins >= cost) {
      setCoins(prev => prev - cost);
      setClickUpgradeLevel(prev => prev + 1);
    }
  };

  const buyAutoUpgrade = () => {
    const cost = getAutoUpgradeCost(autoUpgradeLevel);
    if (coins >= cost) {
      setCoins(prev => prev - cost);
      setAutoUpgradeLevel(prev => prev + 1);
    }
  };

  const buyMultiplierUpgrade = () => {
    const cost = getMultiplierUpgradeCost(multiplierUpgradeLevel);
    if (coins >= cost) {
      setCoins(prev => prev - cost);
      setMultiplierUpgradeLevel(prev => prev + 1);
    }
  };

  // Удобные шорткаты к стоимостям текущих уровней — чтобы не повторяться
  // в JSX. Все три используют module-level функции с уровнем как аргументом.
  const clickCost = getClickUpgradeCost(clickUpgradeLevel);
  const autoCost = getAutoUpgradeCost(autoUpgradeLevel);
  const multiplierCost = getMultiplierUpgradeCost(multiplierUpgradeLevel);

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
              <span className="break-all">{coins.toFixed(2)}</span>
              <Coins size={28} className="text-white shrink-0" />
            </motion.div>
            <div className="text-white/80 text-[12px] sm:text-[13px] mt-1">
              {effectiveSecond > 0 && `+${effectiveSecond.toFixed(2)} HC/сек`}
              {multiplier > 1 && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] sm:text-[11px] font-semibold">
                  ×{multiplier.toFixed(2)}
                </span>
              )}
            </div>
            {/* Кнопка вывода в основной кошелёк. Активна только когда
                накоплен минимум; иначе показываем подсказку. */}
            <motion.button
              type="button"
              onClick={() => setShowWithdrawModal(true)}
              disabled={coins < MIN_WITHDRAW || withdrawing}
              whileHover={coins >= MIN_WITHDRAW ? { scale: 1.03 } : {}}
              whileTap={coins >= MIN_WITHDRAW ? { scale: 0.97 } : {}}
              className={`mt-3 sm:mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-[13px] sm:text-[14px] font-semibold transition-colors ${
                coins >= MIN_WITHDRAW && !withdrawing
                  ? 'bg-white text-orange-600 hover:bg-yellow-50 shadow-lg'
                  : 'bg-white/30 text-white/70 cursor-not-allowed'
              }`}
            >
              {withdrawing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ArrowDownToLine size={16} />
              )}
              <span>Вывести в кошелёк</span>
            </motion.button>
            {coins > 0 && coins < MIN_WITHDRAW && (
              <div className="text-white/70 text-[10px] sm:text-[11px] mt-1.5">
                Минимум {MIN_WITHDRAW.toFixed(2)} HC для вывода
              </div>
            )}
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
                  +{effectiveClick >= 1 ? effectiveClick.toFixed(2) : effectiveClick.toFixed(3)}
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

        {/* Stats: выводим итоговые значения с ×множителем, иначе игрок
            не видит эффекта апгрейда. Третья колонка — сам множитель. */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="bg-white rounded-xl p-2.5 sm:p-3 shadow-sm">
            <div className="text-[11px] sm:text-[12px] text-gray-500 mb-1">За клик</div>
            <div className="text-[14px] sm:text-[16px] font-bold text-gray-900 break-all tabular-nums">{effectiveClick >= 1 ? effectiveClick.toFixed(2) : effectiveClick.toFixed(3)}</div>
          </div>
          <div className="bg-white rounded-xl p-2.5 sm:p-3 shadow-sm">
            <div className="text-[11px] sm:text-[12px] text-gray-500 mb-1">В секунду</div>
            <div className="text-[14px] sm:text-[16px] font-bold text-gray-900 break-all tabular-nums">{effectiveSecond >= 1 ? effectiveSecond.toFixed(2) : effectiveSecond.toFixed(3)}</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-2.5 sm:p-3 shadow-sm border border-amber-200">
            <div className="text-[11px] sm:text-[12px] text-amber-700 mb-1">Множитель</div>
            <div className="text-[14px] sm:text-[16px] font-bold text-amber-700 break-all tabular-nums">×{multiplier.toFixed(2)}</div>
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

        {/* Панель апгрейдов вынесена в отдельную bottom-sheet модалку ниже —
            раньше она была инлайн под кнопкой и часто оказывалась за пределами
            видимой области внутри overflow-y-auto, из-за чего пользователь
            считал, что «окно не появляется». */}
      </div>

      {/* Upgrades Modal: bottom-sheet с тремя апгрейдами. Раньше панель
          была инлайн внутри overflow-y-auto и не помещалась на экран —
          игрок не видел «окна». Теперь это полноценная модалка поверх. */}
      <AnimatePresence>
        {showUpgrades && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUpgrades(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col"
            >
              {/* Drag handle (только на мобиле) */}
              <div className="sm:hidden pt-2 pb-1 flex justify-center">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 pt-3 sm:pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-gray-900 leading-tight">Улучшения</h3>
                    <p className="text-[12px] text-gray-500">Прокачай свой клиeкер</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUpgrades(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Закрыть"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              {/* Текущий баланс — чтобы было видно сразу при покупке */}
              <div className="px-5 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-amber-100 flex items-center justify-between">
                <span className="text-[12px] text-gray-600">Ваш баланс</span>
                <span className="text-[15px] font-bold text-orange-600 tabular-nums inline-flex items-center gap-1">
                  {coins.toFixed(2)}
                  <Coins size={14} />
                </span>
              </div>

              {/* Список апгрейдов — скроллится если не помещается */}
              <div className="overflow-y-auto p-4 space-y-2.5 flex-1">
                {/* 1. Мощный клик */}
                <motion.button
                  onClick={buyClickUpgrade}
                  disabled={coins < clickCost}
                  className={`w-full bg-white rounded-2xl p-3.5 shadow-sm border ${
                    coins >= clickCost ? 'cursor-pointer active:scale-[0.98] border-blue-200 hover:border-blue-400 hover:shadow-md' : 'opacity-50 cursor-not-allowed border-gray-200'
                  } transition-all`}
                  whileHover={coins >= clickCost ? { scale: 1.02 } : {}}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                      <Zap size={22} className="text-white" fill="white" />
                    </div>
                    <div className="flex-grow text-left min-w-0">
                      <div className="text-[15px] font-semibold text-gray-900">Мощный клик</div>
                      <div className="text-[12px] text-gray-500">
                        Ур. {clickUpgradeLevel} · +{coinsPerClick.toFixed(coinsPerClick >= 1 ? 2 : 3)} → +{(coinsPerClick * 2).toFixed(coinsPerClick * 2 >= 1 ? 2 : 3)} HC
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[14px] font-bold text-gray-900 tabular-nums">{clickCost >= 100 ? clickCost.toFixed(0) : clickCost.toFixed(2)}</div>
                      <div className="text-[11px] text-gray-500">HC</div>
                    </div>
                  </div>
                </motion.button>

                {/* 2. Автокликер */}
                <motion.button
                  onClick={buyAutoUpgrade}
                  disabled={coins < autoCost}
                  className={`w-full bg-white rounded-2xl p-3.5 shadow-sm border ${
                    coins >= autoCost ? 'cursor-pointer active:scale-[0.98] border-emerald-200 hover:border-emerald-400 hover:shadow-md' : 'opacity-50 cursor-not-allowed border-gray-200'
                  } transition-all`}
                  whileHover={coins >= autoCost ? { scale: 1.02 } : {}}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-400 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                      <Gamepad2 size={22} className="text-white" />
                    </div>
                    <div className="flex-grow text-left min-w-0">
                      <div className="text-[15px] font-semibold text-gray-900">Автокликер</div>
                      <div className="text-[12px] text-gray-500">
                        Ур. {autoUpgradeLevel} · +{(BASE_AUTO * Math.pow(AUTO_INCOME_GROWTH, autoUpgradeLevel)).toFixed(3)} HC/сек
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[14px] font-bold text-gray-900 tabular-nums">{autoCost >= 100 ? autoCost.toFixed(0) : autoCost.toFixed(2)}</div>
                      <div className="text-[11px] text-gray-500">HC</div>
                    </div>
                  </div>
                </motion.button>

                {/* 3. Золотой множитель — премиальный */}
                <motion.button
                  onClick={buyMultiplierUpgrade}
                  disabled={coins < multiplierCost}
                  className={`relative w-full rounded-2xl p-3.5 shadow-md border-2 overflow-hidden transition-all ${
                    coins >= multiplierCost
                      ? 'cursor-pointer active:scale-[0.98] bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-amber-300 hover:border-amber-500 hover:shadow-lg'
                      : 'opacity-50 cursor-not-allowed bg-white border-gray-200'
                  }`}
                  whileHover={coins >= multiplierCost ? { scale: 1.02 } : {}}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                      <Crown size={22} className="text-white" fill="white" />
                    </div>
                    <div className="flex-grow text-left min-w-0">
                      <div className="text-[15px] font-semibold text-gray-900">Золотой множитель</div>
                      <div className="text-[12px] text-amber-700">
                        Ур. {multiplierUpgradeLevel} · ×{multiplier.toFixed(2)} → ×{(multiplier + MULTIPLIER_PER_LEVEL).toFixed(2)} ко всему
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[14px] font-bold text-gray-900 tabular-nums">{multiplierCost >= 100 ? multiplierCost.toFixed(0) : multiplierCost.toFixed(2)}</div>
                      <div className="text-[11px] text-gray-500">HC</div>
                    </div>
                  </div>
                </motion.button>

                {/* Подсказка внизу */}
                <div className="text-[11px] text-center text-gray-400 pt-2 pb-1 px-2 leading-relaxed">
                  Покупка списывает HC с баланса мгновенно. Уровень растёт навсегда — даже после вывода в кошелёк.
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal: подтверждение перевода HouseCoin в кошелёк.
          Показываем сумму, комиссию (5%) и итог; всё считаем от текущего coins. */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => !withdrawing && setShowWithdrawModal(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                    <Wallet size={22} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-gray-900 leading-tight">Вывод в кошелёк</h3>
                    <p className="text-[12px] text-gray-500">HouseCoin → walletBalance</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !withdrawing && setShowWithdrawModal(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Закрыть"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              {/* Сумма к выводу / комиссия / итог — три ряда табличкой */}
              <div className="bg-gray-50 rounded-2xl divide-y divide-gray-200 overflow-hidden mb-4">
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-[13px] text-gray-500">Доступно</span>
                  <span className="text-[15px] font-semibold text-gray-900 tabular-nums">{coins.toFixed(2)} HC</span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-[13px] text-gray-500">Комиссия 5%</span>
                  <span className="text-[15px] font-semibold text-orange-600 tabular-nums">−{(coins * WITHDRAW_COMMISSION_RATE).toFixed(2)} HC</span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between bg-white">
                  <span className="text-[13px] text-gray-700 font-medium">К зачислению</span>
                  <span className="text-[18px] font-bold text-green-600 tabular-nums">{(coins * (1 - WITHDRAW_COMMISSION_RATE)).toFixed(2)} HC</span>
                </div>
              </div>

              <div className="text-[12px] text-gray-500 leading-relaxed mb-4">
                После вывода баланс клиeкера обнулится, а монеты появятся в основном кошельке. Операция атомарная — отменить нельзя.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={withdrawing}
                  className="flex-1 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 text-gray-800 font-semibold text-[14px] transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleWithdraw}
                  disabled={withdrawing || coins < MIN_WITHDRAW}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:from-purple-800 active:to-blue-800 disabled:opacity-50 text-white font-semibold text-[14px] inline-flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  {withdrawing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Перевод…</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine size={16} />
                      <span>Вывести</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast: краткое уведомление об успешном выводе. */}
      <AnimatePresence>
        {withdrawSuccess && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-green-200 px-4 py-3 flex items-center gap-3 max-w-[92%]"
          >
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-gray-900 leading-tight">
                +{withdrawSuccess.amount.toFixed(2)} HC в кошелёк
              </div>
              <div className="text-[12px] text-gray-500 mt-0.5">
                Комиссия {withdrawSuccess.commission.toFixed(2)} HC удержана
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
