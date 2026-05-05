'use client';

/**
 * Праздничное оформление "День Победы 9 мая".
 *
 * Включается админом из AdminView через флаг settings/global.victoryDayTheme
 * и транслируется всем пользователям через onSnapshot в ChatContext.
 *
 * Что делает:
 *  - Сверху и снизу — георгиевская лента (две тёмные и три оранжевые полосы)
 *  - Угловые декоративные пятиконечные звёзды
 *  - Плавающие "огни салюта" в фоне (только декоративные, pointer-events none)
 *  - Праздничная плашка "9 МАЯ • С ДНЁМ ПОБЕДЫ" сверху по центру
 *
 * Весь оверлей абсолютно позиционирован поверх приложения и НЕ блокирует
 * клики (pointer-events-none), так что пользователь продолжает нормально
 * работать с мессенджером.
 */
export default function VictoryDayTheme() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] select-none"
    >
      {/* Георгиевская лента сверху */}
      <GeorgianRibbon position="top" />

      {/* Георгиевская лента снизу */}
      <GeorgianRibbon position="bottom" />

      {/* Праздничная плашка сверху по центру */}
      <div
        className="absolute left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-b-2xl shadow-lg flex items-center gap-2 text-white font-bold tracking-wide text-[12px] sm:text-[13px]"
        style={{
          top: 'calc(env(safe-area-inset-top) + 14px)',
          background: 'linear-gradient(135deg, #B91C1C 0%, #7F1D1D 60%, #B91C1C 100%)',
          border: '1px solid #FCD34D',
          boxShadow: '0 4px 20px rgba(185, 28, 28, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}
      >
        <RedStar size={14} />
        <span>9 МАЯ • С ДНЁМ ПОБЕДЫ</span>
        <RedStar size={14} />
      </div>

      {/* Угловые звёзды с золотым свечением */}
      <CornerStar position="top-left" />
      <CornerStar position="top-right" />
      <CornerStar position="bottom-left" />
      <CornerStar position="bottom-right" />

      {/* Плавающий фоновый салют (только на больших экранах, чтобы не
          перегружать мобильный) */}
      <div className="hidden md:block absolute inset-0 overflow-hidden">
        <Firework left="12%" top="22%" delay="0s" color="#FCD34D" />
        <Firework left="78%" top="18%" delay="1.2s" color="#EF4444" />
        <Firework left="50%" top="35%" delay="2.4s" color="#F59E0B" />
        <Firework left="20%" top="62%" delay="0.6s" color="#FCD34D" />
        <Firework left="85%" top="55%" delay="1.8s" color="#EF4444" />
      </div>

      <style jsx>{`
        @keyframes victoryFireworkBurst {
          0% {
            opacity: 0;
            transform: scale(0.2);
          }
          25% {
            opacity: 1;
          }
          70% {
            opacity: 0.8;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.4);
          }
        }
        @keyframes victoryStarGlow {
          0%, 100% {
            filter: drop-shadow(0 0 4px #FCD34D) drop-shadow(0 0 8px rgba(252, 211, 77, 0.6));
          }
          50% {
            filter: drop-shadow(0 0 8px #FCD34D) drop-shadow(0 0 16px rgba(252, 211, 77, 0.9));
          }
        }
      `}</style>
    </div>
  );
}

// Георгиевская лента — стандартное чередование 5 полос:
// оранжевая (0.6) / чёрная (0.6) / оранжевая (0.8) / чёрная (0.6) / оранжевая (0.6)
function GeorgianRibbon({ position }: { position: 'top' | 'bottom' }) {
  const stripes = [
    { color: '#FF8C00', size: '14%' },
    { color: '#0a0a0a', size: '20%' },
    { color: '#FF8C00', size: '32%' },
    { color: '#0a0a0a', size: '20%' },
    { color: '#FF8C00', size: '14%' },
  ];

  const isTop = position === 'top';

  return (
    <div
      className="absolute left-0 right-0 flex flex-col shadow-md"
      style={{
        height: '8px',
        [isTop ? 'top' : 'bottom']: 0,
        boxShadow: isTop
          ? '0 2px 8px rgba(0,0,0,0.25)'
          : '0 -2px 8px rgba(0,0,0,0.25)',
      }}
    >
      {stripes.map((s, i) => (
        <div
          key={i}
          style={{
            backgroundColor: s.color,
            height: s.size,
          }}
        />
      ))}
    </div>
  );
}

// Декоративная пятиконечная красная звезда с золотым свечением
function CornerStar({
  position,
}: {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) {
  const positions: Record<typeof position, string> = {
    'top-left': 'top-3 left-3',
    'top-right': 'top-3 right-3',
    'bottom-left': 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-3',
  };

  return (
    <div
      className={`absolute ${positions[position]} hidden sm:block`}
      style={{
        animation: 'victoryStarGlow 2.4s ease-in-out infinite',
        marginTop: position.startsWith('top') ? '14px' : undefined,
        marginBottom: position.startsWith('bottom') ? '14px' : undefined,
      }}
    >
      <RedStar size={32} />
    </div>
  );
}

// Пятиконечная звезда с заливкой "героическим" красным и золотым контуром
function RedStar({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2 L14.59 8.41 L21.5 9.27 L16.5 14.14 L17.91 21 L12 17.27 L6.09 21 L7.5 14.14 L2.5 9.27 L9.41 8.41 Z"
        fill="#DC2626"
        stroke="#FCD34D"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Анимированная "вспышка салюта" — расширяющийся круг с радиальной градиентной
// заливкой, повторяющийся в бесконечном цикле.
function Firework({
  left,
  top,
  delay,
  color,
}: {
  left: string;
  top: string;
  delay: string;
  color: string;
}) {
  return (
    <div
      className="absolute w-16 h-16 rounded-full opacity-0"
      style={{
        left,
        top,
        background: `radial-gradient(circle, ${color} 0%, ${color}99 30%, transparent 70%)`,
        animation: `victoryFireworkBurst 3s ease-out infinite`,
        animationDelay: delay,
        filter: 'blur(2px)',
      }}
    />
  );
}
