// Каталог подарков и helper для получения анимированного URL по id.
// Вынесено из components/SendGiftView.tsx, чтобы потребители (ChatView,
// MyGiftsView, UserGiftsView, MessagesContainer) могли использовать
// getGiftAnimatedUrl без затягивания всего экрана отправки подарка
// (~950 строк JSX + framer-motion + firebase) в свой бандл.

export interface Gift {
  id: string;
  name: string;
  emoji: string;
  animatedUrl: string;
  cost: number;
  animation: string;
  available: boolean;
  animated?: boolean;
  unlockDate?: Date;
  special?: boolean;
  description?: string;
  limited?: boolean;
  totalLimit?: number;
  spaceTheme?: boolean;
}

export const GIFTS: Gift[] = [
  {
    id: 'teddy_bear',
    name: 'Плюшевый мишка',
    emoji: '🧸',
    animatedUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Animals%20and%20Nature/Bear.webp',
    cost: 15,
    animation: 'bounce',
    available: true,
    animated: true,
  },
  {
    id: 'red_heart',
    name: 'Красное сердце',
    emoji: '❤️',
    animatedUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Red%20Heart.webp',
    cost: 10,
    animation: 'pulse',
    available: true,
    animated: true,
  },
  {
    id: 'rose',
    name: 'Роза',
    emoji: '🌹',
    animatedUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Animals%20and%20Nature/Rose.webp',
    cost: 12,
    animation: 'bounce',
    available: true,
    animated: true,
  },
  {
    id: 'cake',
    name: 'Торт',
    emoji: '🎂',
    animatedUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Food%20and%20Drink/Birthday%20Cake.webp',
    cost: 18,
    animation: 'bounce',
    available: true,
    animated: true,
  },
  {
    id: 'star',
    name: 'Звезда',
    emoji: '⭐',
    animatedUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Animals%20and%20Nature/Glowing%20Star.webp',
    cost: 20,
    animation: 'spin',
    available: true,
    animated: true,
  },
  {
    id: 'gift_box',
    name: 'Подарочная коробка',
    emoji: '🎁',
    animatedUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Activity/Wrapped%20Gift.webp',
    cost: 25,
    animation: 'bounce',
    available: true,
    animated: true,
  },
  {
    id: 'diamond',
    name: 'Бриллиант',
    emoji: '💎',
    animatedUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Objects/Gem%20Stone.webp',
    cost: 50,
    animation: 'sparkle',
    available: true,
    animated: true,
  },
  {
    id: 'crown',
    name: 'Корона',
    emoji: '👑',
    animatedUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Objects/Crown.webp',
    cost: 100,
    animation: 'bounce',
    available: true,
    animated: true,
  },
  {
    id: 'easter_bunny',
    name: 'Пасхальный заяц',
    emoji: '🐰🥚',
    animatedUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Animals%20and%20Nature/Rabbit%20Face.webp',
    cost: 50,
    animation: 'easter',
    available: false,
    unlockDate: new Date('2026-04-12T09:00:00'),
    special: true,
    description: 'Эксклюзивный пасхальный подарок',
    limited: true,
    totalLimit: 15,
    animated: true,
  },
  {
    id: 'cosmonaut',
    name: 'Космонавт',
    emoji: '👨‍🚀🚀',
    animatedUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Travel%20and%20Places/Rocket.webp',
    cost: 50,
    animation: 'space',
    available: false,
    unlockDate: new Date('2026-04-12T00:00:00'),
    special: true,
    description: 'День космонавтики! Полетели в космос!',
    limited: true,
    totalLimit: 20,
    spaceTheme: true,
    animated: true,
  },
];

export function getGiftAnimatedUrl(giftId: string): string | null {
  const gift = GIFTS.find(g => g.id === giftId);
  return gift?.animatedUrl || null;
}
