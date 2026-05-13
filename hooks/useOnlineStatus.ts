import { useEffect, useRef } from 'react';

// Временные заглушки для типов
interface User {
  id: string;
  status: 'online' | 'offline';
  last_seen: string;
}

class OnlineStatusManager {
  constructor(userId: string) {
    // Заглушка
  }

  async start() {
    // Заглушка
  }

  async stop() {
    // Заглушка
  }
}

// Хук для управления онлайн статусом пользователя
export const useOnlineStatus = (userId: string | null) => {
  const managerRef = useRef<OnlineStatusManager | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Временно отключено - используем только Matrix + Firebase
    // const manager = new OnlineStatusManager(userId);
    // managerRef.current = manager;
    // manager.start();

    return () => {
      // if (managerRef.current) {
      //   managerRef.current.stop();
      //   managerRef.current = null;
      // }
    };
  }, [userId]);

  return {
    isOnline: false, // Временная заглушка
  };
};

// Хук для подписки на статус одного пользователя
export const useUserStatus = (
  userId: string,
  onStatusChange: (user: User) => void
) => {
  useEffect(() => {
    if (!userId) return;

    // Временно отключено - используем только Matrix + Firebase
    // const subscription = userService.subscribeToUserStatus(userId, onStatusChange);

    return () => {
      // subscription?.unsubscribe();
    };
  }, [userId, onStatusChange]);
};

// Хук для подписки на статусы нескольких пользователей
export const useMultipleUserStatuses = (
  userIds: string[],
  onStatusChange: (user: User) => void
) => {
  useEffect(() => {
    if (userIds.length === 0) return;

    // Временно отключено - используем только Matrix + Firebase
    // const subscription = userService.subscribeToMultipleUserStatuses(userIds, onStatusChange);

    return () => {
      // subscription?.unsubscribe();
    };
  }, [userIds, onStatusChange]);
};