/**
 * JSONStorage.net - Бесплатная база данных БЕЗ хостинга
 * 
 * ✅ Без регистрации
 * ✅ Без хостинга
 * ✅ 25 items бесплатно
 * ✅ 1000 запросов/месяц
 * ✅ 64KB на item
 * ✅ CORS enabled
 * ✅ SSL/HTTPS
 */

const BASE_URL = 'https://api.jsonstorage.net/v1/json';
const STORAGE_KEY_USER = 'jsonstorage_user_id';
const STORAGE_KEY_ITEM = 'jsonstorage_item_id';

interface ChatData {
  chats: any[];
  messages: Record<string, any[]>;
  users: Record<string, any>;
  settings?: any;
}

class JSONStorageClient {
  private userId: string | null = null;
  private itemId: string | null = null;
  private cache: ChatData | null = null;
  private cacheTime: number = 0;
  private cacheDuration: number = 30000; // 30 секунд

  constructor() {
    if (typeof window !== 'undefined') {
      this.userId = localStorage.getItem(STORAGE_KEY_USER);
      this.itemId = localStorage.getItem(STORAGE_KEY_ITEM);
    }
  }

  /**
   * Инициализация нового хранилища
   */
  async init(): Promise<{ userId: string; itemId: string }> {
    const initialData: ChatData = {
      chats: [],
      messages: {},
      users: {},
      settings: {
        theme: 'light',
        notifications: true
      }
    };

    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(initialData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const uri = data.uri;

      // Извлекаем userId и itemId из URI
      // Пример URI: https://api.jsonstorage.net/v1/json/abc123/def456
      const parts = uri.split('/');
      this.userId = parts[parts.length - 2];
      this.itemId = parts[parts.length - 1];

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_USER, this.userId);
        localStorage.setItem(STORAGE_KEY_ITEM, this.itemId);
      }

      console.log('✅ JSONStorage initialized:', { userId: this.userId, itemId: this.itemId });

      return { userId: this.userId, itemId: this.itemId };
    } catch (error) {
      console.error('❌ Failed to initialize JSONStorage:', error);
      throw error;
    }
  }

  /**
   * Проверка инициализации
   */
  isInitialized(): boolean {
    return !!(this.userId && this.itemId);
  }

  /**
   * Получить все данные
   */
  async getData(useCache: boolean = true): Promise<ChatData> {
    if (!this.isInitialized()) {
      throw new Error('JSONStorage not initialized. Call init() first.');
    }

    // Проверяем кеш
    if (useCache && this.cache && Date.now() - this.cacheTime < this.cacheDuration) {
      return this.cache;
    }

    try {
      const response = await fetch(`${BASE_URL}/${this.userId}/${this.itemId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Обновляем кеш
      this.cache = data;
      this.cacheTime = Date.now();

      return data;
    } catch (error) {
      console.error('❌ Failed to get data:', error);
      throw error;
    }
  }

  /**
   * Полное обновление данных (PUT)
   */
  async updateData(data: ChatData): Promise<void> {
    if (!this.isInitialized()) {
      throw new Error('JSONStorage not initialized. Call init() first.');
    }

    try {
      const response = await fetch(`${BASE_URL}/${this.userId}/${this.itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Обновляем кеш
      this.cache = data;
      this.cacheTime = Date.now();

      console.log('✅ Data updated successfully');
    } catch (error) {
      console.error('❌ Failed to update data:', error);
      throw error;
    }
  }

  /**
   * Частичное обновление данных (PATCH)
   */
  async patchData(partialData: Partial<ChatData>): Promise<void> {
    if (!this.isInitialized()) {
      throw new Error('JSONStorage not initialized. Call init() first.');
    }

    try {
      const response = await fetch(`${BASE_URL}/${this.userId}/${this.itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(partialData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Обновляем кеш
      if (this.cache) {
        this.cache = { ...this.cache, ...partialData };
        this.cacheTime = Date.now();
      }

      console.log('✅ Data patched successfully');
    } catch (error) {
      console.error('❌ Failed to patch data:', error);
      throw error;
    }
  }

  /**
   * Очистить кеш
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTime = 0;
  }

  /**
   * Получить размер данных в KB
   */
  async getDataSize(): Promise<number> {
    const data = await this.getData(false);
    const size = new Blob([JSON.stringify(data)]).size;
    return size / 1024; // Возвращаем в KB
  }

  /**
   * Проверить приближение к лимиту
   */
  async checkLimit(): Promise<{ size: number; percentage: number; warning: boolean }> {
    const size = await this.getDataSize();
    const limit = 64; // 64 KB
    const percentage = (size / limit) * 100;
    const warning = percentage > 80;

    return {
      size: Math.round(size * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
      warning
    };
  }

  /**
   * Сбросить хранилище (удалить ID из localStorage)
   */
  reset(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_ITEM);
    }
    this.userId = null;
    this.itemId = null;
    this.cache = null;
    this.cacheTime = 0;
    console.log('✅ JSONStorage reset');
  }
}

// Экспортируем singleton instance
export const jsonStorage = new JSONStorageClient();

// Вспомогательные функции для работы с чатом
export const chatHelpers = {
  /**
   * Добавить сообщение в чат
   */
  async addMessage(chatId: string, message: any): Promise<void> {
    const data = await jsonStorage.getData();
    
    if (!data.messages[chatId]) {
      data.messages[chatId] = [];
    }
    
    data.messages[chatId].push(message);
    
    // Обновляем последнее сообщение в чате
    const chatIndex = data.chats.findIndex(c => c.id === chatId);
    if (chatIndex !== -1) {
      data.chats[chatIndex].lastMessage = message.text || 'Медиа';
      data.chats[chatIndex].lastMessageTime = message.timestamp;
    }
    
    await jsonStorage.updateData(data);
  },

  /**
   * Получить сообщения чата
   */
  async getMessages(chatId: string): Promise<any[]> {
    const data = await jsonStorage.getData();
    return data.messages[chatId] || [];
  },

  /**
   * Создать новый чат
   */
  async createChat(chat: any): Promise<void> {
    const data = await jsonStorage.getData();
    data.chats.push(chat);
    data.messages[chat.id] = [];
    await jsonStorage.updateData(data);
  },

  /**
   * Получить все чаты
   */
  async getChats(): Promise<any[]> {
    const data = await jsonStorage.getData();
    return data.chats;
  },

  /**
   * Удалить чат
   */
  async deleteChat(chatId: string): Promise<void> {
    const data = await jsonStorage.getData();
    data.chats = data.chats.filter(c => c.id !== chatId);
    delete data.messages[chatId];
    await jsonStorage.updateData(data);
  },

  /**
   * Очистить историю чата
   */
  async clearChatHistory(chatId: string): Promise<void> {
    const data = await jsonStorage.getData();
    data.messages[chatId] = [];
    
    const chatIndex = data.chats.findIndex(c => c.id === chatId);
    if (chatIndex !== -1) {
      data.chats[chatIndex].lastMessage = '';
      data.chats[chatIndex].lastMessageTime = 0;
    }
    
    await jsonStorage.updateData(data);
  }
};

export default jsonStorage;
