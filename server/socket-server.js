const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// JWT секрет для аутентификации (должен совпадать с клиентским)
const JWT_SECRET = process.env.JWT_SECRET || 'housegram-secret-key-change-in-production';

// Хранилище активных пользователей
const activeUsers = new Map();
const userSockets = new Map(); // userId -> Set<socketId> (поддержка нескольких вкладок)

// Middleware для аутентификации
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const userId = socket.handshake.auth.userId;

  if (!userId) {
    return next(new Error('Authentication error: userId is required'));
  }

  // Если есть JWT токен — проверяем его
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.userId !== userId) {
        return next(new Error('Authentication error: token mismatch'));
      }
    } catch (err) {
      return next(new Error('Authentication error: invalid token'));
    }
  }

  socket.userId = userId;
  next();
});

io.on('connection', (socket) => {
  const userId = socket.userId;
  console.log(`✅ User connected: ${userId} (${socket.id})`);

  // Поддержка нескольких сокетов на пользователя (несколько вкладок)
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(socket.id);

  activeUsers.set(userId, {
    status: 'online',
    lastSeen: Date.now(),
    socketIds: userSockets.get(userId)
  });

  // Уведомляем всех о статусе пользователя
  io.emit('user:status:change', {
    userId,
    status: 'online',
    timestamp: Date.now()
  });

  // Обработка изменения статуса
  socket.on('user:status', ({ status }) => {
    if (!socket.userId) return;

    activeUsers.set(userId, {
      status,
      lastSeen: Date.now(),
      socketIds: userSockets.get(userId)
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

  // Отправка сообщения с валидацией
  socket.on('message:send', ({ chatId, message }) => {
    if (!socket.userId || !chatId || !message) {
      socket.emit('error', { message: 'Invalid message data' });
      return;
    }

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
    if (!socket.userId || !chatId) return;

    socket.to(`chat:${chatId}`).emit('typing:change', {
      chatId,
      userId,
      isTyping
    });
  });

  // Прочитано
  socket.on('message:read', ({ messageId, chatId }) => {
    if (!socket.userId || !messageId || !chatId) return;

    io.to(`chat:${chatId}`).emit('message:read:change', {
      messageId,
      userId,
      timestamp: Date.now()
    });
  });

  // Отключение
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${userId} (${socket.id})`);

    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.delete(socket.id);

      if (sockets.size === 0) {
        // Все вкладки закрыты — пользователь оффлайн
        userSockets.delete(userId);
        activeUsers.set(userId, {
          status: 'offline',
          lastSeen: Date.now(),
          socketIds: new Set()
        });

        io.emit('user:status:change', {
          userId,
          status: 'offline',
          timestamp: Date.now()
        });
      } else {
        // Ещё есть активные вкладки
        activeUsers.set(userId, {
          status: 'online',
          lastSeen: Date.now(),
          socketIds: sockets
        });
      }
    }
  });

  // Ошибка
  socket.on('error', (error) => {
    console.error(`Socket error for user ${userId}:`, error);
  });
});

// Очистка неактивных пользователей каждые 5 минут
setInterval(() => {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  for (const [userId, data] of activeUsers.entries()) {
    if (data.status === 'offline' && now - data.lastSeen > fiveMinutes) {
      activeUsers.delete(userId);
    }
  }
}, 5 * 60 * 1000);

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
