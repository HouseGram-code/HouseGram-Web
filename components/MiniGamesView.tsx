'use client';

import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Gamepad2, Coins, Zap, TrendingUp, Star, Crown, Gift } from 'lucide-react';
import { useState } from 'react';

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

  // Auto-earn coins
  useState(() => {
    const interval = setInterval(() => {
      if (coinsPerSecond > 0) {
        setCoins(prev => prev + coinsPerSecond / 10);
      }
    }, 100);
    return () => clearInterval(interval);
  });

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
    const cost = Math.pow(1.5, clickUpgradeLevel) * 0.001;
    if (coins >= cost) {
      setCoins(prev => prev - cost);
      setClickUpgradeLevel(prev => prev + 1);
      setCoinsPerClick(prev => prev * 1.5);
    }
  };

  const buyAutoUpgrade = () => {
    const cost = Math.pow(2, autoUpgradeLevel) * 0.01;
    if (coins >= cost) {
      setCoins(prev => prev - cost);
      setAutoUpgradeLevel(prev => prev + 1);
      setCoinsPerSecond(prev => prev + 0.0001);
    }
  };

  const getClickUpgradeCost = () => Math.pow(1.5, clickUpgradeLevel) * 0.001;
  const getAutoUpgradeCost = () => Math.pow(2, autoUpgradeLevel) * 0.01;

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
          className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 rounded-3xl p-6 mb-4 shadow-2xl"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <div className="text-center">
            <div className="text-white/90 text-[14px] font-medium mb-2">Ваш баланс</div>
            <motion.div 
              className="text-white text-[42px] font-bold flex items-center justify-center gap-2"
              key={Math.floor(coins * 10000)}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {coins.toFixed(4)}
              <Coins size={32} className="text-white" />
            </motion.div>
            <div className="text-white/80 text-[13px] mt-1">
              {coinsPerSecond > 0 && `+${coinsPerSecond.toFixed(4)} HC/сек`}
            </div>
          </div>
        </motion.div>

        {/* Click Area */}
        <div className="flex-grow flex items-center justify-center mb-4 relative">
          <motion.div
            onClick={handleClick}
            className="relative w-64 h-64 cursor-pointer"
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
              className="w-full h-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 rounded-full shadow-2xl flex items-center justify-center border-8 border-yellow-200"
            >
              <Coins size={96} className="text-white drop-shadow-lg" />
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
                  className="absolute pointer-events-none text-yellow-600 font-bold text-[20px]"
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
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-[12px] text-gray-500 mb-1">За клик</div>
            <div className="text-[18px] font-bold text-gray-900">{coinsPerClick.toFixed(4)}</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-[12px] text-gray-500 mb-1">В секунду</div>
            <div className="text-[18px] font-bold text-gray-900">{coinsPerSecond.toFixed(4)}</div>
          </div>
        </div>

        {/* Upgrades Button */}
        <motion.button
          onClick={() => setShowUpgrades(!showUpgrades)}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-4 font-bold text-[16px] shadow-lg mb-4"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingUp size={20} />
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
              className="space-y-3 overflow-hidden"
            >
              {/* Click Upgrade */}
              <motion.button
                onClick={buyClickUpgrade}
                disabled={coins < getClickUpgradeCost()}
                className={`w-full bg-white rounded-2xl p-4 shadow-sm ${
                  coins >= getClickUpgradeCost() ? 'cursor-pointer active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'
                }`}
                whileHover={coins >= getClickUpgradeCost() ? { scale: 1.02 } : {}}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center">
                    <Zap size={24} className="text-white" fill="white" />
                  </div>
                  <div className="flex-grow text-left">
                    <div className="text-[15px] font-semibold text-gray-900">Мощный клик</div>
                    <div className="text-[12px] text-gray-500">Уровень {clickUpgradeLevel}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-bold text-gray-900">{getClickUpgradeCost().toFixed(4)}</div>
                    <div className="text-[11px] text-gray-500">HC</div>
                  </div>
                </div>
              </motion.button>

              {/* Auto Upgrade */}
              <motion.button
                onClick={buyAutoUpgrade}
                disabled={coins < getAutoUpgradeCost()}
                className={`w-full bg-white rounded-2xl p-4 shadow-sm ${
                  coins >= getAutoUpgradeCost() ? 'cursor-pointer active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'
                }`}
                whileHover={coins >= getAutoUpgradeCost() ? { scale: 1.02 } : {}}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl flex items-center justify-center">
                    <Star size={24} className="text-white" fill="white" />
                  </div>
                  <div className="flex-grow text-left">
                    <div className="text-[15px] font-semibold text-gray-900">Авто-фарм</div>
                    <div className="text-[12px] text-gray-500">Уровень {autoUpgradeLevel}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-bold text-gray-900">{getAutoUpgradeCost().toFixed(4)}</div>
                    <div className="text-[11px] text-gray-500">HC</div>
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
