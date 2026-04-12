export type MessageType = 'sent' | 'received';

export interface Sticker {
  id: string;
  packId: string;
  emoji: string;
  imageUrl: string;
  width: number;
  height: number;
}

export interface StickerPack {
  id: string;
  name: string;
  emoji: string;
  stickers: Sticker[];
}

export interface GifItem {
  id: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
}

export interface Message {
  id: string;
  type: MessageType;
  text: string;
  time: string;
  status?: 'sending' | 'sent' | 'read';
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  senderId?: string;
  createdAt?: Date | { toDate: () => Date } | any | null;
  chatId?: string;
  editedAt?: Date | { toDate: () => Date } | any | null;
  replyTo?: { messageId: string; senderName: string; text: string };
  forwardedFrom?: { chatName: string; senderName: string };
  stickerUrl?: string;
  stickerWidth?: number;
  stickerHeight?: number;
  gifUrl?: string;
  gifWidth?: number;
  gifHeight?: number;
  views?: number;
  gift?: {
    id: string;
    name: string;
    emoji: string;
    cost: number;
    from: string;
  };
}

export interface Contact {
  id: string;
  name: string;
  initial: string;
  avatarColor: string;
  avatarUrl?: string;
  statusOnline: string;
  statusOffline: string;
  phone: string;
  bio: string;
  username: string;
  messages: Message[];
  isTyping: boolean;
  unread: number;
  isBlocked?: boolean;
  isChannel?: boolean;
  isOfficial?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  createdBy: string;
  createdAt: Date | { toDate: () => Date };
  subscribersCount: number;
  link: string;
  inviteCode: string;
  subscribers: string[];
}

export interface UserProfile {
  name: string;
  username: string;
  bio: string;
  phone: string;
  avatarUrl?: string;
  status?: 'online' | 'offline';
  lastSeen?: Date | { toDate: () => Date } | null;
  isOfficial?: boolean;
  savedStickers?: string[];
  giftsSent?: number;
  giftsReceived?: number;
}

export type ViewState = 'menu' | 'chat' | 'profile' | 'settings' | 'chat-settings' | 'features' | 'privacy' | 'privacy-settings' | 'notifications' | 'security' | 'admin' | 'auth' | 'info' | 'faq' | 'terms' | 'create-channel' | 'channel-info' | 'notification-stats' | 'server-status' | 'stars' | 'send-gift' | 'my-gifts' | 'user-gifts' | 'buy-stars';
