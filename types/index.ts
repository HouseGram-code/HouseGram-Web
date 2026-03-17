export interface Message {
  id: string;
  text: string;
  time: string;
  type: 'sent' | 'received';
  status?: 'sending' | 'sent' | 'read';
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  isEdited?: boolean;
  forwardedFrom?: string;
  createdAt?: any;
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
  isChannel: boolean;
  isOfficial?: boolean;
  isBlocked?: boolean;
  isPinned?: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  username: string;
  avatarUrl: string;
  role?: string;
  isOfficial?: boolean;
}

export type ViewState = 'auth' | 'chatList' | 'chat' | 'menu' | 'settings' | 'profile' | 'admin';
