const { createServer } = require('http');
const { Server } = require('socket.io');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Хранилище активных пользователей
const activeUsers = new Map();
const userSockets = new Map();

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  console.log(`✅ User connected: ${userId} (${socket.id})`);

  // Сохраняем соединение пользователя
  userSockets.set(userId, socket.id);
  activeUsers.set(userId, {
    status: 'online',
    lastSeen: Date.now(),
    socketId: socket.id
  });

  // Уведомляем всех о статусе пользователя
  io.emit('user:status:change', {
    userId,
    status: 'online',
    timestamp: Date.now()
  });

  // Обработка изменения статуса
  socket.on('user:status', ({ status }) => {
    activeUsers.set(userId, {
      status,
      lastSeen: Date.now(),
      socketId: socket.id
    });

    io.emit('user:status:change', {
      userId,
      status,
      timestamp: Date.now()
    });
  });

  // Присоединение к комнате чата
  socket.on('chat:join', ({ chatId }) => {
    socket.join(`chat:${chatId}`);
    console.log(`User ${userId} joined chat ${chatId}`);
  });

  // Выход из комнаты чата
  socket.on('chat:leave', ({ chatId }) => {
    socket.leave(`chat:${chatId}`);
    console.log(`User ${userId} left chat ${chatId}`);
  });

  // Отправка сообщения
  socket.on('message:send', ({ chatId, message }) => {
    const messageData = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: userId,
      timestamp: Date.now(),
      status: 'sent'
    };

    // Отправляем сообщение всем в комнате чата
    io.to(`chat:${chatId}`).emit('message:new', messageData);
    console.log(`Message sent to chat ${chatId} by ${userId}`);
  });

  // Печатает...
  socket.on('typing', ({ chatId, isTyping }) => {
    socket.to(`chat:${chatId}`).emit('typing:change', {
      chatId,
      userId,
      isTyping
    });
  });

  // Прочитано
  socket.on('message:read', ({ messageId, chatId }) => {
    io.to(`chat:${chatId}`).emit('message:read:change', {
      messageId,
      userId,
      timestamp: Date.now()
    });
  });

  // Отключение
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${userId} (${socket.id})`);
    
    userSockets.delete(userId);
    activeUsers.set(userId, {
      status: 'offline',
      lastSeen: Date.now(),
      socketId: null
    });

    io.emit('user:status:change', {
      userId,
      status: 'offline',
      timestamp: Date.now()
    });
  });

  // Ошибка
  socket.on('error', (error) => {
    console.error(`Socket error for user ${userId}:`, error);
  });
});

const PORT = process.env.SOCKET_PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});
