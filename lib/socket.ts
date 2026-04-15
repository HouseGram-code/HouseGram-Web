import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let initialized = false;

// Очередь сообщений для отправки после подключения
const messageQueue: Array<{ event: string; data: unknown }> = [];

export const initSocket = (userId: string) => {
  // Если уже инициализирован и подключён — возвращаем существующий
  if (socket?.connected && initialized) return socket;

  // Если есть неподключённый сокет — не создаём новый
  if (socket && !socket.connected) return socket;

  // Подключение к Socket.IO серверу
  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
    auth: {
      userId,
      token: typeof window !== 'undefined' ? localStorage.getItem('authToken') : undefined
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    transports: ['websocket', 'polling']
  });

  initialized = true;

  socket.on('connect', () => {
    console.log('✅ Socket.IO connected:', socket?.id);

    // Отправляемqueued сообщения
    while (messageQueue.length > 0) {
      const msg = messageQueue.shift();
      if (msg) {
        socket?.emit(msg.event, msg.data);
      }
    }
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
    // Очищаем все обработчики событий
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    initialized = false;
  }
};

// События для статуса пользователя
export const emitUserStatus = (status: 'online' | 'offline') => {
  if (socket?.connected) {
    socket.emit('user:status', { status, timestamp: Date.now() });
  } else {
    messageQueue.push({ event: 'user:status', data: { status, timestamp: Date.now() } });
  }
};

export const onUserStatusChange = (callback: (data: { userId: string; status: 'online' | 'offline' }) => void) => {
  // Очищаем предыдущий обработчик перед добавлением нового
  if (socket) {
    socket.off('user:status:change');
    socket.on('user:status:change', callback);
  }
};

// События для сообщений
export const emitMessage = (chatId: string, message: unknown) => {
  if (socket?.connected) {
    socket.emit('message:send', { chatId, message, timestamp: Date.now() });
  } else {
    messageQueue.push({ event: 'message:send', data: { chatId, message, timestamp: Date.now() } });
  }
};

export const onNewMessage = (callback: (message: unknown) => void) => {
  if (socket) {
    socket.off('message:new');
    socket.on('message:new', callback);
  }
};

export const emitTyping = (chatId: string, isTyping: boolean) => {
  if (socket?.connected) {
    socket.emit('typing', { chatId, isTyping });
  } else {
    messageQueue.push({ event: 'typing', data: { chatId, isTyping } });
  }
};

export const onTyping = (callback: (data: { chatId: string; userId: string; isTyping: boolean }) => void) => {
  if (socket) {
    socket.off('typing:change');
    socket.on('typing:change', callback);
  }
};

// События для чтения сообщений
export const emitMessageRead = (messageId: string, chatId: string) => {
  if (socket?.connected) {
    socket.emit('message:read', { messageId, chatId });
  } else {
    messageQueue.push({ event: 'message:read', data: { messageId, chatId } });
  }
};

export const onMessageRead = (callback: (data: { messageId: string; userId: string }) => void) => {
  if (socket) {
    socket.off('message:read:change');
    socket.on('message:read:change', callback);
  }
};

// Присоединение к комнате чата
export const joinChat = (chatId: string) => {
  if (socket?.connected) {
    socket.emit('chat:join', { chatId });
  } else {
    messageQueue.push({ event: 'chat:join', data: { chatId } });
  }
};

export const leaveChat = (chatId: string) => {
  if (socket?.connected) {
    socket.emit('chat:leave', { chatId });
  } else {
    messageQueue.push({ event: 'chat:leave', data: { chatId } });
  }
};
