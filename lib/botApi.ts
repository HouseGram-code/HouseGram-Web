// HouseGram Bot API Library
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  addDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';

// Types
export interface Bot {
  id: string;
  token: string;
  name: string;
  username: string;
  description?: string;
  aboutText?: string;
  photoURL?: string;
  ownerId: string;
  createdAt: any;
  commands?: BotCommand[];
  webhookUrl?: string;
  isActive: boolean;
}

export interface BotCommand {
  command: string;
  description: string;
}

export interface BotMessage {
  chat_id: string;
  text?: string;
  photo?: string;
  document?: string;
  voice?: string;
  caption?: string;
  parse_mode?: 'Markdown' | 'HTML';
  reply_markup?: InlineKeyboard;
}

export interface InlineKeyboard {
  inline_keyboard: InlineButton[][];
}

export interface InlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface Update {
  update_id: number;
  message?: Message;
  callback_query?: CallbackQuery;
}

export interface Message {
  message_id: string;
  from: User;
  chat: Chat;
  date: number;
  text?: string;
  photo?: string;
  document?: string;
  voice?: string;
}

export interface CallbackQuery {
  id: string;
  from: User;
  message: Message;
  data: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface Chat {
  id: string;
  type: 'private' | 'group' | 'channel';
  title?: string;
}

// Bot Token Generation
export function generateBotToken(botId: string): string {
  // Generate random token using Web Crypto API (works in browser and Node.js)
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Node.js environment
    const crypto = require('crypto');
    crypto.randomFillSync(array);
  }
  
  const randomPart = Buffer.from(array).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return `${botId}:${randomPart}`;
}

// Validate Bot Token
export function validateBotToken(token: string): boolean {
  const parts = token.split(':');
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}

// Get Bot ID from Token
export function getBotIdFromToken(token: string): string | null {
  const parts = token.split(':');
  return parts.length === 2 ? parts[0] : null;
}

// Bot API Class
export class BotAPI {
  private token: string;
  private botId: string | null;

  constructor(token: string) {
    this.token = token;
    this.botId = getBotIdFromToken(token);
  }

  // Verify token and get bot
  async verifyToken(): Promise<Bot | null> {
    if (!this.botId) return null;

    try {
      const botDoc = await getDoc(doc(db, 'bots', this.botId));
      if (!botDoc.exists()) return null;

      const bot = { id: botDoc.id, ...botDoc.data() } as Bot;
      
      // Verify token matches
      if (bot.token !== this.token) return null;
      
      return bot;
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  }

  // Get bot info
  async getMe(): Promise<{ ok: boolean; result?: any; error?: string }> {
    const bot = await this.verifyToken();
    if (!bot) {
      return { ok: false, error: 'Invalid token' };
    }

    return {
      ok: true,
      result: {
        id: bot.id,
        is_bot: true,
        first_name: bot.name,
        username: bot.username,
        description: bot.description
      }
    };
  }

  // Send message
  async sendMessage(params: BotMessage): Promise<{ ok: boolean; result?: any; error?: string }> {
    const bot = await this.verifyToken();
    if (!bot) {
      return { ok: false, error: 'Invalid token' };
    }

    if (!params.chat_id || !params.text) {
      return { ok: false, error: 'Missing required parameters' };
    }

    try {
      // Create message in Firestore
      const messageData = {
        chatId: params.chat_id,
        senderId: bot.id,
        senderName: bot.name,
        text: params.text,
        timestamp: serverTimestamp(),
        type: 'text',
        isBot: true,
        botId: bot.id,
        replyMarkup: params.reply_markup || null
      };

      const messageRef = await addDoc(
        collection(db, 'chats', params.chat_id, 'messages'),
        messageData
      );

      return {
        ok: true,
        result: {
          message_id: messageRef.id,
          chat: { id: params.chat_id },
          text: params.text,
          date: Date.now() / 1000
        }
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return { ok: false, error: 'Failed to send message' };
    }
  }

  // Send photo
  async sendPhoto(params: BotMessage): Promise<{ ok: boolean; result?: any; error?: string }> {
    const bot = await this.verifyToken();
    if (!bot) {
      return { ok: false, error: 'Invalid token' };
    }

    if (!params.chat_id || !params.photo) {
      return { ok: false, error: 'Missing required parameters' };
    }

    try {
      const messageData = {
        chatId: params.chat_id,
        senderId: bot.id,
        senderName: bot.name,
        imageUrl: params.photo,
        text: params.caption || '',
        timestamp: serverTimestamp(),
        type: 'image',
        isBot: true,
        botId: bot.id
      };

      const messageRef = await addDoc(
        collection(db, 'chats', params.chat_id, 'messages'),
        messageData
      );

      return {
        ok: true,
        result: {
          message_id: messageRef.id,
          chat: { id: params.chat_id },
          photo: params.photo,
          caption: params.caption
        }
      };
    } catch (error) {
      console.error('Error sending photo:', error);
      return { ok: false, error: 'Failed to send photo' };
    }
  }

  // Set webhook
  async setWebhook(url: string): Promise<{ ok: boolean; error?: string }> {
    const bot = await this.verifyToken();
    if (!bot) {
      return { ok: false, error: 'Invalid token' };
    }

    try {
      await updateDoc(doc(db, 'bots', bot.id), {
        webhookUrl: url,
        updatedAt: serverTimestamp()
      });

      return { ok: true };
    } catch (error) {
      console.error('Error setting webhook:', error);
      return { ok: false, error: 'Failed to set webhook' };
    }
  }

  // Delete webhook
  async deleteWebhook(): Promise<{ ok: boolean; error?: string }> {
    const bot = await this.verifyToken();
    if (!bot) {
      return { ok: false, error: 'Invalid token' };
    }

    try {
      await updateDoc(doc(db, 'bots', bot.id), {
        webhookUrl: null,
        updatedAt: serverTimestamp()
      });

      return { ok: true };
    } catch (error) {
      console.error('Error deleting webhook:', error);
      return { ok: false, error: 'Failed to delete webhook' };
    }
  }

  // Get updates (long polling)
  async getUpdates(offset: number = 0, limit: number = 100): Promise<{ ok: boolean; result?: Update[]; error?: string }> {
    const bot = await this.verifyToken();
    if (!bot) {
      return { ok: false, error: 'Invalid token' };
    }

    try {
      // Get bot updates from Firestore
      const updatesQuery = query(
        collection(db, 'bot_updates', bot.id, 'updates'),
        where('update_id', '>', offset)
      );

      const snapshot = await getDocs(updatesQuery);
      const updates: Update[] = [];

      snapshot.forEach(doc => {
        updates.push(doc.data() as Update);
      });

      // Sort by update_id
      updates.sort((a, b) => a.update_id - b.update_id);

      // Limit results
      const limitedUpdates = updates.slice(0, limit);

      return { ok: true, result: limitedUpdates };
    } catch (error) {
      console.error('Error getting updates:', error);
      return { ok: false, error: 'Failed to get updates' };
    }
  }

  // Answer callback query
  async answerCallbackQuery(callbackQueryId: string, text?: string, showAlert: boolean = false): Promise<{ ok: boolean; error?: string }> {
    const bot = await this.verifyToken();
    if (!bot) {
      return { ok: false, error: 'Invalid token' };
    }

    try {
      // Store callback answer
      await setDoc(doc(db, 'callback_answers', callbackQueryId), {
        text: text || '',
        showAlert,
        timestamp: serverTimestamp()
      });

      return { ok: true };
    } catch (error) {
      console.error('Error answering callback:', error);
      return { ok: false, error: 'Failed to answer callback' };
    }
  }
}

// BotFather Functions
export class BotFather {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Create new bot
  async createBot(name: string, username: string): Promise<{ success: boolean; bot?: Bot; token?: string; error?: string }> {
    try {
      // Validate username
      if (!username.endsWith('bot')) {
        return { success: false, error: 'Username must end with "bot"' };
      }

      // Check if username is taken
      const existingBots = await getDocs(
        query(collection(db, 'bots'), where('username', '==', username))
      );

      if (!existingBots.empty) {
        return { success: false, error: 'Username already taken' };
      }

      // Create bot document
      const botRef = await addDoc(collection(db, 'bots'), {
        name,
        username,
        ownerId: this.userId,
        createdAt: serverTimestamp(),
        isActive: true,
        token: '' // Will be updated
      });

      // Generate token
      const token = generateBotToken(botRef.id);

      // Update bot with token
      await updateDoc(botRef, { token });

      const bot: Bot = {
        id: botRef.id,
        token,
        name,
        username,
        ownerId: this.userId,
        createdAt: new Date(),
        isActive: true
      };

      return { success: true, bot, token };
    } catch (error) {
      console.error('Error creating bot:', error);
      return { success: false, error: 'Failed to create bot' };
    }
  }

  // Get user's bots
  async getMyBots(): Promise<Bot[]> {
    try {
      const botsQuery = query(
        collection(db, 'bots'),
        where('ownerId', '==', this.userId)
      );

      const snapshot = await getDocs(botsQuery);
      const bots: Bot[] = [];

      snapshot.forEach(doc => {
        bots.push({ id: doc.id, ...doc.data() } as Bot);
      });

      return bots;
    } catch (error) {
      console.error('Error getting bots:', error);
      return [];
    }
  }

  // Update bot name
  async setBotName(botId: string, name: string): Promise<{ success: boolean; error?: string }> {
    try {
      const botDoc = await getDoc(doc(db, 'bots', botId));
      if (!botDoc.exists()) {
        return { success: false, error: 'Bot not found' };
      }

      const bot = botDoc.data() as Bot;
      if (bot.ownerId !== this.userId) {
        return { success: false, error: 'Not authorized' };
      }

      await updateDoc(doc(db, 'bots', botId), {
        name,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating bot name:', error);
      return { success: false, error: 'Failed to update name' };
    }
  }

  // Set bot description
  async setBotDescription(botId: string, description: string): Promise<{ success: boolean; error?: string }> {
    try {
      const botDoc = await getDoc(doc(db, 'bots', botId));
      if (!botDoc.exists()) {
        return { success: false, error: 'Bot not found' };
      }

      const bot = botDoc.data() as Bot;
      if (bot.ownerId !== this.userId) {
        return { success: false, error: 'Not authorized' };
      }

      await updateDoc(doc(db, 'bots', botId), {
        description,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating bot description:', error);
      return { success: false, error: 'Failed to update description' };
    }
  }

  // Set bot commands
  async setBotCommands(botId: string, commands: BotCommand[]): Promise<{ success: boolean; error?: string }> {
    try {
      const botDoc = await getDoc(doc(db, 'bots', botId));
      if (!botDoc.exists()) {
        return { success: false, error: 'Bot not found' };
      }

      const bot = botDoc.data() as Bot;
      if (bot.ownerId !== this.userId) {
        return { success: false, error: 'Not authorized' };
      }

      await updateDoc(doc(db, 'bots', botId), {
        commands,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating bot commands:', error);
      return { success: false, error: 'Failed to update commands' };
    }
  }

  // Delete bot
  async deleteBot(botId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const botDoc = await getDoc(doc(db, 'bots', botId));
      if (!botDoc.exists()) {
        return { success: false, error: 'Bot not found' };
      }

      const bot = botDoc.data() as Bot;
      if (bot.ownerId !== this.userId) {
        return { success: false, error: 'Not authorized' };
      }

      await deleteDoc(doc(db, 'bots', botId));

      return { success: true };
    } catch (error) {
      console.error('Error deleting bot:', error);
      return { success: false, error: 'Failed to delete bot' };
    }
  }

  // Revoke token (generate new one)
  async revokeToken(botId: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const botDoc = await getDoc(doc(db, 'bots', botId));
      if (!botDoc.exists()) {
        return { success: false, error: 'Bot not found' };
      }

      const bot = botDoc.data() as Bot;
      if (bot.ownerId !== this.userId) {
        return { success: false, error: 'Not authorized' };
      }

      // Generate new token
      const newToken = generateBotToken(botId);

      await updateDoc(doc(db, 'bots', botId), {
        token: newToken,
        updatedAt: serverTimestamp()
      });

      return { success: true, token: newToken };
    } catch (error) {
      console.error('Error revoking token:', error);
      return { success: false, error: 'Failed to revoke token' };
    }
  }
}
