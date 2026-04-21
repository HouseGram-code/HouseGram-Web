/**
 * Deta Base Integration
 * Unlimited Free Database for your chat app
 */

import { Deta } from 'deta';

// Инициализация Deta
const deta = Deta(process.env.DETA_PROJECT_KEY || '');

// Базы данных
const messagesDB = deta.Base('messages');
const chatsDB = deta.Base('chats');
const usersDB = deta.Base('users');
const storiesDB = deta.Base('stories');
const giftsDB = deta.Base('gifts');

// Типы данных
export interface DetaMessage {
  key?: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: number;
  type: 'sent' | 'received';
  status: 'sent' | 'delivered' | 'read';
  replyTo?: string;
  fileUrl?: string;
  fileName?: string;
  audioUrl?: string;
  stickerUrl?: string;
  stickerWidth?: number;
  stickerHeight?: number;
  gifUrl?: string;
  gifWidth?: number;
  gifHeight?: number;
  isEdited?: boolean;
  isForwarded?: boolean;
  gift?: {
    id: string;
    name: string;
    emoji: string;
    price: number;
  };
}

export interface DetaChat {
  key: string;
  name: string;
  avatarUrl?: string;
  avatarColor?: string;
  initial?: string;
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount: number;
  isChannel: boolean;
  isOfficial?: boolean;
  createdBy?: string;
  members?: string[];
  statusOnline?: string;
  statusOffline?: string;
}

export interface DetaUser {
  key: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen: number;
  isTyping?: boolean;
  stars?: number;
  isPremium?: boolean;
}

export interface DetaStory {
  key?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  timestamp: number;
  expiresAt: number;
  views: string[];
}

export interface DetaGift {
  key?: string;
  fromUserId: string;
  toUserId: string;
  giftId: string;
  giftName: string;
  giftEmoji: string;
  giftPrice: number;
  timestamp: number;
  message?: string;
}

// API для сообщений
export const detaMessages = {
  // Создать сообщение
  async create(message: DetaMessage) {
    const result = await messagesDB.put(message);
    return result;
  },

  // Получить сообщения чата
  async getByChatId(chatId: string, limit = 100) {
    const result = await messagesDB.fetch({ chatId }, { limit });
    return result.items as DetaMessage[];
  },

  // Получить сообщение по ID
  async getById(messageId: string) {
    const result = await messagesDB.get(messageId);
    return result as DetaMessage | null;
  },

  // Обновить сообщение
  async update(messageId: string, updates: Partial<DetaMessage>) {
    const result = await messagesDB.update(updates, messageId);
    return result;
  },

  // Удалить сообщение
  async delete(messageId: string) {
    await messagesDB.delete(messageId);
  },

  // Пометить как прочитанное
  async markAsRead(messageId: string) {
    await messagesDB.update({ status: 'read' }, messageId);
  },

  // Получить непрочитанные сообщения
  async getUnread(chatId: string, userId: string) {
    const result = await messagesDB.fetch({
      chatId,
      'status?ne': 'read',
      'senderId?ne': userId
    });
    return result.items as DetaMessage[];
  }
};

// API для чатов
export const detaChats = {
  // Создать чат
  async create(chat: DetaChat) {
    const result = await chatsDB.put(chat, chat.key);
    return result;
  },

  // Получить чат по ID
  async getById(chatId: string) {
    const result = await chatsDB.get(chatId);
    return result as DetaChat | null;
  },

  // Получить все чаты пользователя
  async getByUserId(userId: string) {
    const result = await chatsDB.fetch({
      'members?contains': userId
    });
    return result.items as DetaChat[];
  },

  // Обновить чат
  async update(chatId: string, updates: Partial<DetaChat>) {
    const result = await chatsDB.update(updates, chatId);
    return result;
  },

  // Удалить чат
  async delete(chatId: string) {
    await chatsDB.delete(chatId);
  },

  // Обновить последнее сообщение
  async updateLastMessage(chatId: string, message: string, timestamp: number) {
    await chatsDB.update({
      lastMessage: message,
      lastMessageTime: timestamp
    }, chatId);
  },

  // Увеличить счетчик непрочитанных
  async incrementUnread(chatId: string) {
    const chat = await this.getById(chatId);
    if (chat) {
      await chatsDB.update({
        unreadCount: (chat.unreadCount || 0) + 1
      }, chatId);
    }
  },

  // Сбросить счетчик непрочитанных
  async resetUnread(chatId: string) {
    await chatsDB.update({ unreadCount: 0 }, chatId);
  }
};

// API для пользователей
export const detaUsers = {
  // Создать пользователя
  async create(user: DetaUser) {
    const result = await usersDB.put(user, user.key);
    return result;
  },

  // Получить пользователя по ID
  async getById(userId: string) {
    const result = await usersDB.get(userId);
    return result as DetaUser | null;
  },

  // Получить пользователя по email
  async getByEmail(email: string) {
    const result = await usersDB.fetch({ email });
    return result.items[0] as DetaUser | null;
  },

  // Обновить пользователя
  async update(userId: string, updates: Partial<DetaUser>) {
    const result = await usersDB.update(updates, userId);
    return result;
  },

  // Обновить статус онлайн
  async updateOnlineStatus(userId: string, isOnline: boolean) {
    await usersDB.update({
      isOnline,
      lastSeen: Date.now()
    }, userId);
  },

  // Установить статус печати
  async setTyping(userId: string, isTyping: boolean) {
    await usersDB.update({ isTyping }, userId);
  },

  // Обновить звезды
  async updateStars(userId: string, stars: number) {
    await usersDB.update({ stars }, userId);
  }
};

// API для историй
export const detaStories = {
  // Создать историю
  async create(story: DetaStory) {
    const result = await storiesDB.put(story);
    return result;
  },

  // Получить активные истории
  async getActive() {
    const now = Date.now();
    const result = await storiesDB.fetch({
      'expiresAt?gt': now
    });
    return result.items as DetaStory[];
  },

  // Получить истории пользователя
  async getByUserId(userId: string) {
    const now = Date.now();
    const result = await storiesDB.fetch({
      userId,
      'expiresAt?gt': now
    });
    return result.items as DetaStory[];
  },

  // Добавить просмотр
  async addView(storyId: string, userId: string) {
    const story = await storiesDB.get(storyId) as DetaStory;
    if (story && !story.views.includes(userId)) {
      story.views.push(userId);
      await storiesDB.update({ views: story.views }, storyId);
    }
  },

  // Удалить историю
  async delete(storyId: string) {
    await storiesDB.delete(storyId);
  },

  // Удалить истекшие истории
  async deleteExpired() {
    const now = Date.now();
    const result = await storiesDB.fetch({
      'expiresAt?lt': now
    });
    for (const story of result.items) {
      await storiesDB.delete(story.key);
    }
  }
};

// API для подарков
export const detaGifts = {
  // Отправить подарок
  async send(gift: DetaGift) {
    const result = await giftsDB.put(gift);
    return result;
  },

  // Получить полученные подарки
  async getReceived(userId: string) {
    const result = await giftsDB.fetch({ toUserId: userId });
    return result.items as DetaGift[];
  },

  // Получить отправленные подарки
  async getSent(userId: string) {
    const result = await giftsDB.fetch({ fromUserId: userId });
    return result.items as DetaGift[];
  },

  // Получить подарок по ID
  async getById(giftId: string) {
    const result = await giftsDB.get(giftId);
    return result as DetaGift | null;
  }
};

// Экспорт всех API
export const detaDB = {
  messages: detaMessages,
  chats: detaChats,
  users: detaUsers,
  stories: detaStories,
  gifts: detaGifts
};

// Утилиты для миграции
export const detaMigration = {
  // Миграция сообщений из Firebase
  async migrateMessagesFromFirebase(firebaseMessages: any[]) {
    for (const msg of firebaseMessages) {
      await detaMessages.create({
        chatId: msg.chatId,
        senderId: msg.senderId,
        text: msg.text,
        timestamp: msg.timestamp,
        type: msg.type,
        status: msg.status || 'sent',
        ...msg
      });
    }
  },

  // Миграция чатов из Firebase
  async migrateChatsFromFirebase(firebaseChats: any[]) {
    for (const chat of firebaseChats) {
      await detaChats.create({
        key: chat.id,
        name: chat.name,
        avatarUrl: chat.avatarUrl,
        unreadCount: chat.unreadCount || 0,
        isChannel: chat.isChannel || false,
        ...chat
      });
    }
  }
};

export default detaDB;
