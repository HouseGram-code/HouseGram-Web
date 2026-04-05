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
    initial: 'H',
    avatarColor: '#007AFF',
    statusOnline: 'в сети',
    statusOffline: 'бот',
    phone: '',
    bio: 'Официальный ИИ-ассистент HouseGram Web на базе Google Gemini.',
    username: '@housegram_ai',
    messages: [
      { id: '1', type: 'received', text: 'Привет! Я HouseGram AI. Чем могу помочь?', time: '12:00' }
    ],
    isTyping: false,
    unread: 1,
    isOfficial: true,
  },
  housegram_announcements: {
    id: 'housegram_announcements',
    name: 'HouseGram Анонсы',
    initial: 'H',
    avatarColor: '#517da2',
    avatarUrl: 'https://picsum.photos/seed/housegram/200/200',
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
