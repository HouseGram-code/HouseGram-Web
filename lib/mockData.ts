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
  },
  housegram_announcements: {
    id: 'housegram_announcements',
    name: 'HouseGram Анонсы',
    initial: 'H',
    avatarColor: '#517da2',
    avatarUrl: '',
    statusOnline: 'Канал',
    statusOffline: 'Канал',
    phone: '',
    bio: 'Официальный канал обновлений HouseGram Web.',
    username: '',
    messages: [],
    isTyping: false,
    unread: 0,
    isChannel: true,
  }
};

export const generateBotResponse = (contactId: string, message: string): string => {
  return `Вы написали: "${message}". Это HouseGram Web, стеклянный дизайн и кастомные темы работают отлично!`;
};
