// Премиум анимированные эмодзи из Telegram
// Источник: https://github.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis

const BASE_URL = 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main';

export interface AnimatedEmoji {
  id: string;
  name: string;
  url: string;
  category: string;
  keywords: string[];
}

export interface EmojiPack {
  id: string;
  name: string;
  icon: string;
  description: string;
  emojis: AnimatedEmoji[];
  premium: boolean;
}

// Смайлики и люди
const smileyEmojis: AnimatedEmoji[] = [
  { id: 'grinning', name: 'Улыбающееся лицо', url: `${BASE_URL}/Smileys/Grinning%20Face.webp`, category: 'smileys', keywords: ['улыбка', 'счастье'] },
  { id: 'tears-joy', name: 'Слёзы радости', url: `${BASE_URL}/Smileys/Face%20With%20Tears%20Of%20Joy.webp`, category: 'smileys', keywords: ['смех', 'радость'] },
  { id: 'heart-eyes', name: 'Влюблённое лицо', url: `${BASE_URL}/Smileys/Smiling%20Face%20With%20Heart%20Eyes.webp`, category: 'smileys', keywords: ['любовь', 'сердце'] },
  { id: 'star-struck', name: 'Звёздные глаза', url: `${BASE_URL}/Smileys/Star%20Struck.webp`, category: 'smileys', keywords: ['звёзды', 'восторг'] },
  { id: 'thinking', name: 'Думающее лицо', url: `${BASE_URL}/Smileys/Thinking%20Face.webp`, category: 'smileys', keywords: ['думать', 'размышление'] },
  { id: 'cool', name: 'Крутое лицо', url: `${BASE_URL}/Smileys/Smiling%20Face%20With%20Sunglasses.webp`, category: 'smileys', keywords: ['круто', 'очки'] },
  { id: 'party', name: 'Праздничное лицо', url: `${BASE_URL}/Smileys/Partying%20Face.webp`, category: 'smileys', keywords: ['праздник', 'вечеринка'] },
  { id: 'wink', name: 'Подмигивающее лицо', url: `${BASE_URL}/Smileys/Winking%20Face.webp`, category: 'smileys', keywords: ['подмигивание', 'флирт'] },
];

// Животные и природа
const animalEmojis: AnimatedEmoji[] = [
  { id: 'cat-joy', name: 'Кот со слезами радости', url: `${BASE_URL}/Animals%20and%20Nature/Cat%20With%20Tears%20Of%20Joy.webp`, category: 'animals', keywords: ['кот', 'смех'] },
  { id: 'dog', name: 'Собака', url: `${BASE_URL}/Animals%20and%20Nature/Dog%20Face.webp`, category: 'animals', keywords: ['собака', 'пёс'] },
  { id: 'unicorn', name: 'Единорог', url: `${BASE_URL}/Animals%20and%20Nature/Unicorn.webp`, category: 'animals', keywords: ['единорог', 'магия'] },
  { id: 'fire', name: 'Огонь', url: `${BASE_URL}/Animals%20and%20Nature/Fire.webp`, category: 'animals', keywords: ['огонь', 'пламя'] },
  { id: 'sparkles', name: 'Искры', url: `${BASE_URL}/Animals%20and%20Nature/Sparkles.webp`, category: 'animals', keywords: ['искры', 'блеск'] },
  { id: 'star', name: 'Звезда', url: `${BASE_URL}/Animals%20and%20Nature/Glowing%20Star.webp`, category: 'animals', keywords: ['звезда', 'сияние'] },
  { id: 'rainbow', name: 'Радуга', url: `${BASE_URL}/Animals%20and%20Nature/Rainbow.webp`, category: 'animals', keywords: ['радуга', 'цвета'] },
  { id: 'lightning', name: 'Молния', url: `${BASE_URL}/Animals%20and%20Nature/High%20Voltage.webp`, category: 'animals', keywords: ['молния', 'энергия'] },
];

// Еда и напитки
const foodEmojis: AnimatedEmoji[] = [
  { id: 'pizza', name: 'Пицца', url: `${BASE_URL}/Food%20and%20Drink/Pizza.webp`, category: 'food', keywords: ['пицца', 'еда'] },
  { id: 'cake', name: 'Торт', url: `${BASE_URL}/Food%20and%20Drink/Birthday%20Cake.webp`, category: 'food', keywords: ['торт', 'праздник'] },
  { id: 'ice-cream', name: 'Мороженое', url: `${BASE_URL}/Food%20and%20Drink/Ice%20Cream.webp`, category: 'food', keywords: ['мороженое', 'сладкое'] },
  { id: 'coffee', name: 'Кофе', url: `${BASE_URL}/Food%20and%20Drink/Hot%20Beverage.webp`, category: 'food', keywords: ['кофе', 'напиток'] },
  { id: 'beer', name: 'Пиво', url: `${BASE_URL}/Food%20and%20Drink/Beer%20Mug.webp`, category: 'food', keywords: ['пиво', 'алкоголь'] },
  { id: 'champagne', name: 'Шампанское', url: `${BASE_URL}/Food%20and%20Drink/Bottle%20With%20Popping%20Cork.webp`, category: 'food', keywords: ['шампанское', 'праздник'] },
];

// Активности
const activityEmojis: AnimatedEmoji[] = [
  { id: 'soccer', name: 'Футбол', url: `${BASE_URL}/Activity/Soccer%20Ball.webp`, category: 'activity', keywords: ['футбол', 'спорт'] },
  { id: 'basketball', name: 'Баскетбол', url: `${BASE_URL}/Activity/Basketball.webp`, category: 'activity', keywords: ['баскетбол', 'спорт'] },
  { id: 'trophy', name: 'Трофей', url: `${BASE_URL}/Activity/Trophy.webp`, category: 'activity', keywords: ['трофей', 'победа'] },
  { id: 'medal', name: 'Медаль', url: `${BASE_URL}/Activity/1st%20Place%20Medal.webp`, category: 'activity', keywords: ['медаль', 'первое место'] },
  { id: 'party-popper', name: 'Хлопушка', url: `${BASE_URL}/Activity/Party%20Popper.webp`, category: 'activity', keywords: ['хлопушка', 'праздник'] },
  { id: 'gift', name: 'Подарок', url: `${BASE_URL}/Activity/Wrapped%20Gift.webp`, category: 'activity', keywords: ['подарок', 'сюрприз'] },
];

// Объекты
const objectEmojis: AnimatedEmoji[] = [
  { id: 'crown', name: 'Корона', url: `${BASE_URL}/Objects/Crown.webp`, category: 'objects', keywords: ['корона', 'король'] },
  { id: 'gem', name: 'Драгоценный камень', url: `${BASE_URL}/Objects/Gem%20Stone.webp`, category: 'objects', keywords: ['камень', 'драгоценность'] },
  { id: 'money-bag', name: 'Мешок денег', url: `${BASE_URL}/Objects/Money%20Bag.webp`, category: 'objects', keywords: ['деньги', 'богатство'] },
  { id: 'rocket', name: 'Ракета', url: `${BASE_URL}/Travel%20and%20Places/Rocket.webp`, category: 'objects', keywords: ['ракета', 'космос'] },
  { id: 'bomb', name: 'Бомба', url: `${BASE_URL}/Objects/Bomb.webp`, category: 'objects', keywords: ['бомба', 'взрыв'] },
  { id: 'crystal-ball', name: 'Хрустальный шар', url: `${BASE_URL}/Activity/Crystal%20Ball.webp`, category: 'objects', keywords: ['шар', 'магия'] },
];

// Символы
const symbolEmojis: AnimatedEmoji[] = [
  { id: 'heart', name: 'Красное сердце', url: `${BASE_URL}/Smileys/Red%20Heart.webp`, category: 'symbols', keywords: ['сердце', 'любовь'] },
  { id: 'broken-heart', name: 'Разбитое сердце', url: `${BASE_URL}/Smileys/Broken%20Heart.webp`, category: 'symbols', keywords: ['разбитое', 'грусть'] },
  { id: 'fire-heart', name: 'Горящее сердце', url: `${BASE_URL}/Smileys/Heart%20On%20Fire.webp`, category: 'symbols', keywords: ['огонь', 'страсть'] },
  { id: 'hundred', name: '100', url: `${BASE_URL}/Smileys/Hundred%20Points.webp`, category: 'symbols', keywords: ['сто', 'идеально'] },
  { id: 'check', name: 'Галочка', url: `${BASE_URL}/Symbols/Check%20Mark%20Button.webp`, category: 'symbols', keywords: ['галочка', 'да'] },
  { id: 'warning', name: 'Предупреждение', url: `${BASE_URL}/Symbols/Warning.webp`, category: 'symbols', keywords: ['предупреждение', 'внимание'] },
];

// Экспорт паков
export const premiumEmojiPacks: EmojiPack[] = [
  {
    id: 'smileys',
    name: 'Смайлики',
    icon: '😊',
    description: 'Анимированные смайлики и эмоции',
    emojis: smileyEmojis,
    premium: true
  },
  {
    id: 'animals',
    name: 'Животные',
    icon: '🐱',
    description: 'Животные и природа',
    emojis: animalEmojis,
    premium: true
  },
  {
    id: 'food',
    name: 'Еда',
    icon: '🍕',
    description: 'Еда и напитки',
    emojis: foodEmojis,
    premium: true
  },
  {
    id: 'activity',
    name: 'Активности',
    icon: '⚽',
    description: 'Спорт и развлечения',
    emojis: activityEmojis,
    premium: true
  },
  {
    id: 'objects',
    name: 'Объекты',
    icon: '👑',
    description: 'Предметы и символы',
    emojis: objectEmojis,
    premium: true
  },
  {
    id: 'symbols',
    name: 'Символы',
    icon: '❤️',
    description: 'Сердца и символы',
    emojis: symbolEmojis,
    premium: true
  },
];

// Получить все премиум эмодзи
export function getAllPremiumEmojis(): AnimatedEmoji[] {
  return premiumEmojiPacks.flatMap(pack => pack.emojis);
}

// Поиск эмодзи
export function searchPremiumEmojis(query: string): AnimatedEmoji[] {
  const lowerQuery = query.toLowerCase();
  return getAllPremiumEmojis().filter(emoji => 
    emoji.name.toLowerCase().includes(lowerQuery) ||
    emoji.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  );
}
