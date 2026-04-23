'use client';

import { createClient, MatrixClient, Room, MatrixEvent, EventType, MsgType, IContent, Visibility, Preset } from 'matrix-js-sdk';
import { uploadFile as uploadToMega, detectFileType } from '@/lib/mega-storage';

export interface MatrixConfig {
  homeserverUrl: string;
  accessToken?: string;
  userId?: string;
  deviceId?: string;
}

export interface MediaUploadResult {
  content_uri: string;
  file_size: number;
  mega_url?: string;
}

export class MatrixClientManager {
  private client: MatrixClient | null = null;
  private config: MatrixConfig;
  private isInitialized = false;

  constructor(config: MatrixConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.client = createClient({
        baseUrl: this.config.homeserverUrl,
        accessToken: this.config.accessToken,
        userId: this.config.userId,
        deviceId: this.config.deviceId,
        store: undefined, // Используем память для простоты
        scheduler: undefined,
        cryptoStore: undefined,
      });

      // Запускаем клиент
      await this.client.startClient({ initialSyncLimit: 10 });
      
      // Ждем готовности
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Matrix client initialization timeout'));
        }, 30000);

        this.client!.once('sync' as any, (state: any) => {
          clearTimeout(timeout);
          if (state === 'PREPARED') {
            this.isInitialized = true;
            resolve();
          } else {
            reject(new Error(`Matrix sync failed: ${state}`));
          }
        });
      });

      console.log('Matrix client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Matrix client:', error);
      throw error;
    }
  }

  async login(username: string, password: string): Promise<void> {
    if (!this.client) {
      this.client = createClient({
        baseUrl: this.config.homeserverUrl,
      });
    }

    try {
      const response = await this.client.login('m.login.password', {
        user: username,
        password: password,
      });

      this.config.accessToken = response.access_token;
      this.config.userId = response.user_id;
      this.config.deviceId = response.device_id;

      // Пересоздаем клиент с токеном
      this.client = createClient({
        baseUrl: this.config.homeserverUrl,
        accessToken: this.config.accessToken,
        userId: this.config.userId,
        deviceId: this.config.deviceId,
      });

      await this.initialize();
    } catch (error) {
      console.error('Matrix login failed:', error);
      throw error;
    }
  }

  async register(username: string, password: string): Promise<void> {
    if (!this.client) {
      this.client = createClient({
        baseUrl: this.config.homeserverUrl,
      });
    }

    try {
      // Упрощенная регистрация без дополнительных параметров
      const response = await this.client.register(username, password, null, {
        type: 'm.login.dummy'
      });
      
      this.config.accessToken = response.access_token;
      this.config.userId = response.user_id;
      this.config.deviceId = response.device_id;

      // Пересоздаем клиент с токеном
      this.client = createClient({
        baseUrl: this.config.homeserverUrl,
        accessToken: this.config.accessToken,
        userId: this.config.userId,
        deviceId: this.config.deviceId,
      });

      await this.initialize();
    } catch (error) {
      console.error('Matrix registration failed:', error);
      throw error;
    }
  }

  async uploadMedia(file: File): Promise<MediaUploadResult> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Matrix client not initialized');
    }

    try {
      // Проверяем размер файла - MEGA поддерживает до 4GB
      const maxSize = 4 * 1024 * 1024 * 1024; // 4GB
      if (file.size > maxSize) {
        throw new Error(`Файл слишком большой. Максимальный размер: ${maxSize / 1024 / 1024 / 1024}GB`);
      }

      console.log(`📤 Uploading to MEGA: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

      // Загружаем файл в MEGA вместо Matrix
      const userId = this.config.userId || 'anonymous';
      const fileType = detectFileType(file);
      
      const megaResult = await uploadToMega(file, userId, fileType, (progress) => {
        console.log(`Upload progress: ${progress.percentage}%`);
      });

      console.log(`✅ File uploaded to MEGA: ${megaResult.megaUrl}`);

      // Возвращаем MEGA URL как content_uri
      // Matrix будет использовать этот URL для отображения файла
      return {
        content_uri: megaResult.megaUrl || megaResult.url,
        file_size: file.size,
        mega_url: megaResult.megaUrl,
      };
    } catch (error) {
      console.error('Failed to upload media to MEGA:', error);
      throw error;
    }
  }

  async sendMessage(roomId: string, content: any): Promise<void> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Matrix client not initialized');
    }

    try {
      await this.client.sendEvent(roomId, EventType.RoomMessage, content);
    } catch (error) {
      console.error('Failed to send Matrix message:', error);
      throw error;
    }
  }

  async sendTextMessage(roomId: string, text: string): Promise<void> {
    const content = {
      msgtype: MsgType.Text,
      body: text,
    };

    await this.sendMessage(roomId, content);
  }

  async sendImageMessage(roomId: string, file: File, caption?: string): Promise<void> {
    const uploadResult = await this.uploadMedia(file);
    
    // Получаем размеры изображения
    const { width, height } = await this.getImageDimensions(file);

    const content = {
      msgtype: MsgType.Image,
      body: caption || file.name,
      url: uploadResult.content_uri, // MEGA URL
      info: {
        size: uploadResult.file_size,
        mimetype: file.type,
        w: width,
        h: height,
      },
    };

    await this.sendMessage(roomId, content);
  }

  async sendVideoMessage(roomId: string, file: File, caption?: string): Promise<void> {
    const uploadResult = await this.uploadMedia(file);

    const content = {
      msgtype: MsgType.Video,
      body: caption || file.name,
      url: uploadResult.content_uri, // MEGA URL
      info: {
        size: uploadResult.file_size,
        mimetype: file.type,
      },
    };

    await this.sendMessage(roomId, content);
  }

  async sendAudioMessage(roomId: string, file: File): Promise<void> {
    const uploadResult = await this.uploadMedia(file);

    const content = {
      msgtype: MsgType.Audio,
      body: file.name,
      url: uploadResult.content_uri, // MEGA URL
      info: {
        size: uploadResult.file_size,
        mimetype: file.type,
      },
    };

    await this.sendMessage(roomId, content);
  }

  async sendFileMessage(roomId: string, file: File): Promise<void> {
    const uploadResult = await this.uploadMedia(file);

    const content = {
      msgtype: MsgType.File,
      body: file.name,
      filename: file.name,
      url: uploadResult.content_uri, // MEGA URL
      info: {
        size: uploadResult.file_size,
        mimetype: file.type,
      },
    };

    await this.sendMessage(roomId, content);
  }

  async createRoom(name: string, topic?: string, isPublic = false): Promise<string> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Matrix client not initialized');
    }

    try {
      const response = await this.client.createRoom({
        name,
        topic,
        visibility: isPublic ? Visibility.Public : Visibility.Private,
        preset: isPublic ? Preset.PublicChat : Preset.PrivateChat,
      });

      return response.room_id;
    } catch (error) {
      console.error('Failed to create Matrix room:', error);
      throw error;
    }
  }

  async joinRoom(roomIdOrAlias: string): Promise<void> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Matrix client not initialized');
    }

    try {
      await this.client.joinRoom(roomIdOrAlias);
    } catch (error) {
      console.error('Failed to join Matrix room:', error);
      throw error;
    }
  }

  async leaveRoom(roomId: string): Promise<void> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Matrix client not initialized');
    }

    try {
      await this.client.leave(roomId);
    } catch (error) {
      console.error('Failed to leave Matrix room:', error);
      throw error;
    }
  }

  getRooms(): Room[] {
    if (!this.client || !this.isInitialized) {
      return [];
    }

    return this.client.getRooms();
  }

  getRoom(roomId: string): Room | null {
    if (!this.client || !this.isInitialized) {
      return null;
    }

    return this.client.getRoom(roomId);
  }

  onMessage(callback: (event: MatrixEvent) => void): void {
    if (!this.client) return;

    this.client.on('Room.timeline' as any, (event: MatrixEvent) => {
      if (event.getType() === EventType.RoomMessage) {
        callback(event);
      }
    });
  }

  async logout(): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.logout();
      this.client.stopClient();
      this.client = null;
      this.isInitialized = false;
    } catch (error) {
      console.error('Failed to logout from Matrix:', error);
      throw error;
    }
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  getClient(): MatrixClient | null {
    return this.client;
  }

  isReady(): boolean {
    return this.isInitialized && this.client !== null;
  }

  getUserId(): string | undefined {
    return this.config.userId;
  }

  getAccessToken(): string | undefined {
    return this.config.accessToken;
  }
}

// Глобальный экземпляр Matrix клиента
let matrixClientManager: MatrixClientManager | null = null;

export function getMatrixClient(): MatrixClientManager | null {
  return matrixClientManager;
}

export function initializeMatrixClient(config: MatrixConfig): MatrixClientManager {
  matrixClientManager = new MatrixClientManager(config);
  return matrixClientManager;
}

export function destroyMatrixClient(): void {
  if (matrixClientManager) {
    matrixClientManager.logout().catch(console.error);
    matrixClientManager = null;
  }
}