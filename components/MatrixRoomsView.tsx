'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Plus, Search, Hash, Lock, Globe, Users, Settings, Wifi, WifiOff, Loader2, AlertCircle, MessageCircle } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { getMatrixClient } from '@/lib/matrix-client';
import { Room } from 'matrix-js-sdk';
import MatrixChatView from './MatrixChatView';
import MatrixSetupView from './MatrixSetupView';

interface MatrixRoomsViewProps {
  onBack: () => void;
}

export default function MatrixRoomsView({ onBack }: MatrixRoomsViewProps) {
  const { themeColor, isGlassEnabled } = useChat();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomTopic, setNewRoomTopic] = useState('');
  const [isPublicRoom, setIsPublicRoom] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const matrixClient = getMatrixClient();

  // Проверяем подключение к Matrix
  useEffect(() => {
    if (!matrixClient || !matrixClient.isReady()) {
      setError('Matrix клиент не подключен');
      setIsLoading(false);
      return;
    }

    loadRooms();
  }, [matrixClient]);

  // Фильтрация комнат по поисковому запросу
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRooms(rooms);
    } else {
      const filtered = rooms.filter(room => 
        room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.getCanonicalAlias()?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRooms(filtered);
    }
  }, [rooms, searchQuery]);

  const loadRooms = async () => {
    if (!matrixClient) return;

    try {
      setIsLoading(true);
      const matrixRooms = matrixClient.getRooms();
      setRooms(matrixRooms);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load Matrix rooms:', err);
      setError(err.message || 'Ошибка загрузки комнат');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!matrixClient || !newRoomName.trim()) return;

    setIsCreating(true);
    try {
      const roomId = await matrixClient.createRoom(
        newRoomName.trim(),
        newRoomTopic.trim() || undefined,
        isPublicRoom
      );
      
      // Обновляем список комнат
      await loadRooms();
      
      // Закрываем модал и очищаем форму
      setShowCreateRoom(false);
      setNewRoomName('');
      setNewRoomTopic('');
      setIsPublicRoom(false);
      
      // Открываем созданную комнату
      setSelectedRoomId(roomId);
    } catch (err: any) {
      console.error('Failed to create room:', err);
      setError(err.message || 'Ошибка создания комнаты');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!matrixClient || !joinRoomId.trim()) return;

    setIsJoining(true);
    try {
      await matrixClient.joinRoom(joinRoomId.trim());
      
      // Обновляем список комнат
      await loadRooms();
      
      // Закрываем модал и очищаем форму
      setShowJoinRoom(false);
      setJoinRoomId('');
      
      // Открываем присоединенную комнату
      setSelectedRoomId(joinRoomId.trim());
    } catch (err: any) {
      console.error('Failed to join room:', err);
      setError(err.message || 'Ошибка присоединения к комнате');
    } finally {
      setIsJoining(false);
    }
  };

  const getRoomIcon = (room: Room) => {
    if (room.isSpaceRoom()) return Hash;
    if (room.getJoinRule() === 'public') return Globe;
    return Lock;
  };

  const formatLastActivity = (room: Room): string => {
    const timeline = room.getLiveTimeline();
    const events = timeline.getEvents();
    const lastEvent = events[events.length - 1];
    
    if (!lastEvent) return 'Нет активности';
    
    const timestamp = lastEvent.getTs();
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Только что';
    if (minutes < 60) return `${minutes} мин. назад`;
    if (hours < 24) return `${hours} ч. назад`;
    return `${days} дн. назад`;
  };

  // Если выбрана комната, показываем чат
  if (selectedRoomId) {
    return (
      <MatrixChatView
        roomId={selectedRoomId}
        onBack={() => setSelectedRoomId(null)}
      />
    );
  }

  // Если Matrix не подключен, показываем настройку
  if (!matrixClient || !matrixClient.isReady()) {
    return (
      <MatrixSetupView onBack={onBack} />
    );
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-tg-bg-light flex flex-col z-10"
    >
      {/* Header */}
      <motion.div
        className={`text-tg-header-text px-4 h-14 flex items-center gap-3 shrink-0 transition-colors ${
          isGlassEnabled ? 'backdrop-blur-xl border-b border-white/20 shadow-xl' : 'shadow-lg'
        }`}
        style={{ backgroundColor: isGlassEnabled ? themeColor + 'DD' : themeColor }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="p-2 rounded-full hover:bg-white/15 active:bg-white/25 transition-all duration-200"
        >
          <ArrowLeft size={24} />
        </motion.button>
        
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Matrix Rooms</h1>
          <div className="flex items-center gap-1 text-sm opacity-80">
            <Wifi size={14} />
            <span>Подключено к Matrix</span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCreateRoom(true)}
          className="p-2 rounded-full hover:bg-white/15 active:bg-white/25 transition-all duration-200"
        >
          <Plus size={24} />
        </motion.button>
      </motion.div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск комнат..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
        >
          <AlertCircle size={16} />
          {error}
        </motion.div>
      )}

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 size={48} className="animate-spin text-blue-500" />
              <p className="text-gray-600">Загрузка комнат...</p>
            </div>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p className="mb-2">
                {searchQuery ? 'Комнаты не найдены' : 'У вас пока нет комнат'}
              </p>
              <p className="text-sm mb-4">
                {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Создайте новую комнату или присоединитесь к существующей'}
              </p>
              {!searchQuery && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowCreateRoom(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mr-2"
                  >
                    Создать комнату
                  </button>
                  <button
                    onClick={() => setShowJoinRoom(true)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Присоединиться
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredRooms.map((room) => {
              const IconComponent = getRoomIcon(room);
              const memberCount = room.getJoinedMemberCount();
              const lastActivity = formatLastActivity(room);
              
              return (
                <motion.button
                  key={room.roomId}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRoomId(room.roomId)}
                  className="w-full p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
                      <IconComponent size={24} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">
                        {room.name || room.getCanonicalAlias() || 'Unnamed Room'}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {room.getCanonicalAlias() || room.roomId}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                        <div className="flex items-center gap-1">
                          <Users size={12} />
                          <span>{memberCount}</span>
                        </div>
                        <span>{lastActivity}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="text-xs text-gray-400">
                        {room.getJoinRule() === 'public' ? 'Публичная' : 'Приватная'}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateRoom(true)}
            className="flex-1 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
          >
            Создать комнату
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowJoinRoom(true)}
            className="flex-1 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
          >
            Присоединиться
          </motion.button>
        </div>
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateRoom && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowCreateRoom(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 top-1/2 transform -translate-y-1/2 bg-white rounded-2xl p-6 z-50 max-w-md mx-auto"
            >
              <h3 className="text-lg font-semibold mb-4">Создать комнату</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название комнаты *
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Моя комната"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание (необязательно)
                  </label>
                  <input
                    type="text"
                    value={newRoomTopic}
                    onChange={(e) => setNewRoomTopic(e.target.value)}
                    placeholder="Описание комнаты"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublicRoom}
                    onChange={(e) => setIsPublicRoom(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    Публичная комната
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowCreateRoom(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleCreateRoom}
                    disabled={!newRoomName.trim() || isCreating}
                    className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                  >
                    {isCreating ? (
                      <Loader2 size={16} className="animate-spin mx-auto" />
                    ) : (
                      'Создать'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Join Room Modal */}
      <AnimatePresence>
        {showJoinRoom && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowJoinRoom(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 top-1/2 transform -translate-y-1/2 bg-white rounded-2xl p-6 z-50 max-w-md mx-auto"
            >
              <h3 className="text-lg font-semibold mb-4">Присоединиться к комнате</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID комнаты или алиас
                  </label>
                  <input
                    type="text"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    placeholder="#room:matrix.org или !roomid:matrix.org"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Введите алиас комнаты (начинается с #) или ID комнаты (начинается с !)
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowJoinRoom(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleJoinRoom}
                    disabled={!joinRoomId.trim() || isJoining}
                    className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                  >
                    {isJoining ? (
                      <Loader2 size={16} className="animate-spin mx-auto" />
                    ) : (
                      'Присоединиться'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}