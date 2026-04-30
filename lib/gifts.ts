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
  mayTheme?: boolean;
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
    id: 'may_1',
    name: '1 Мая',
    emoji: '🌷',
    animatedUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Animals%20and%20Nature/Tulip.webp',
    cost: 50,
    animation: 'may1',
    available: false,
    // 1 мая 09:00 МСК = 06:00 UTC.
    unlockDate: new Date('2026-05-01T06:00:00.000Z'),
    special: true,
    description: 'С праздником весны и труда!',
    limited: true,
    totalLimit: 15,
    mayTheme: true,
    animated: true,
  },
];

// Анимированные URL для подарков, которые сняты с продажи, но всё ещё могут
// встречаться в истории чатов / в списке полученных подарков. Не попадают в
// GIFTS, потому что больше не должны предлагаться к покупке, но
// getGiftAnimatedUrl должен по-прежнему отдавать для них картинку.
const LEGACY_GIFT_ANIMATED_URLS: Record<string, string> = {
  easter_bunny:
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Animals%20and%20Nature/Rabbit%20Face.webp',
  cosmonaut:
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Travel%20and%20Places/Rocket.webp',
};

export function getGiftAnimatedUrl(giftId: string): string | null {
  const gift = GIFTS.find(g => g.id === giftId);
  if (gift?.animatedUrl) return gift.animatedUrl;
  return LEGACY_GIFT_ANIMATED_URLS[giftId] || null;
}
