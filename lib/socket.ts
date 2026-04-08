import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (userId: string) => {
  if (socket?.connected) return socket;

  // Подключение к Socket.IO серверу
  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
    auth: { userId },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('✅ Socket.IO connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket.IO disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// События для статуса пользователя
export const emitUserStatus = (status: 'online' | 'offline') => {
  socket?.emit('user:status', { status, timestamp: Date.now() });
};

export const onUserStatusChange = (callback: (data: { userId: string; status: 'online' | 'offline' }) => void) => {
  socket?.on('user:status:change', callback);
};

// События для сообщений
export const emitMessage = (chatId: string, message: any) => {
  socket?.emit('message:send', { chatId, message, timestamp: Date.now() });
};

export const onNewMessage = (callback: (message: any) => void) => {
  socket?.on('message:new', callback);
};

export const emitTyping = (chatId: string, isTyping: boolean) => {
  socket?.emit('typing', { chatId, isTyping });
};

export const onTyping = (callback: (data: { chatId: string; userId: string; isTyping: boolean }) => void) => {
  socket?.on('typing:change', callback);
};

// События для чтения сообщений
export const emitMessageRead = (messageId: string, chatId: string) => {
  socket?.emit('message:read', { messageId, chatId });
};

export const onMessageRead = (callback: (data: { messageId: string; userId: string }) => void) => {
  socket?.on('message:read:change', callback);
};

// Присоединение к комнате чата
export const joinChat = (chatId: string) => {
  socket?.emit('chat:join', { chatId });
};

export const leaveChat = (chatId: string) => {
  socket?.emit('chat:leave', { chatId });
};
