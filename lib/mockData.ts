import { Contact } from '@/types';

export const initialContacts: Record<string, Contact> = {
  saved_messages: {
    id: 'saved_messages',
    name: 'Избранное',
    initial: 'И',
    avatarColor: '#517da2',
    statusOnline: '',
    statusOffline: '',
    phone: '',
    bio: 'Здесь можно сохранять сообщения, медиа и другие файлы.',
    username: '',
    messages: [],
    isTyping: false,
    unread: 0,
  },
  founder_goh: {
    id: 'founder_goh',
    name: 'goh',
    initial: 'G',
    avatarColor: '#8B5CF6',
    statusOnline: 'онлайн',
    statusOffline: 'был(а) недавно',
    phone: '',
    bio: 'Основатель и создатель HouseGram. Спасибо за использование нашего мессенджера! 🚀',
    username: '@goh',
    messages: [
      { id: '1', type: 'received', text: 'Добро пожаловать в HouseGram! 🎉 Надеюсь, вам понравится наш мессенджер.', time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }
    ],
    isTyping: false,
    unread: 1,
    isFounder: true,
    isOfficial: true,
  },
  test_bot: {
    id: 'test_bot',
    name: 'HouseGram AI',
    initial: '🤖',
    avatarColor: '#007AFF',
    statusOnline: 'бот',
    statusOffline: 'бот',
    phone: '',
    bio: 'Официальный ИИ-ассистент HouseGram Web на базе Google Gemini. Помогу ответить на вопросы и пообщаться!',
    username: '@housegram_ai',
    messages: [
      { id: '1', type: 'received', text: 'Привет! 👋 Я HouseGram AI — официальный бот-помощник. Чем могу помочь?', time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }
    ],
    isTyping: false,
    unread: 1,
    isOfficial: true,
    isBot: true,
  }
};

export const generateBotResponse = (contactId: string, message: string): string => {
  return `Вы написали: "${message}". Это HouseGram Web, стеклянный дизайн и кастомные темы работают отлично!`;
};
