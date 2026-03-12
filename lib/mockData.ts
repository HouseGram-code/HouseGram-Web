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
    name: 'HouseGram Bot',
    initial: 'H',
    avatarColor: '#007AFF',
    statusOnline: 'в сети',
    statusOffline: 'бот',
    phone: '+7 000 000 00 00',
    bio: 'Официальный тестовый бот HouseGram Web.',
    username: '@housegram_bot',
    messages: [
      { id: '1', type: 'received', text: 'Добро пожаловать в HouseGram Web! Я тестовый бот. Напиши мне что-нибудь.', time: '12:00' }
    ],
    isTyping: false,
    unread: 1,
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
