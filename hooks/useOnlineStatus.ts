import { useEffect, useRef } from 'react';
import { OnlineStatusManager, userService, User } from '@/lib/supabase';

/**
 * Хук для автоматического отслеживания онлайн статуса пользователя
 * @param userId - ID текущего пользователя
 * @param enabled - Включить/выключить отслеживание
 */
export const useOnlineStatus = (userId: string | null, enabled: boolean = true) => {
  const managerRef = useRef<OnlineStatusManager | null>(null);

  useEffect(() => {
    if (!userId || !enabled) return;

    // Создаём менеджер статуса
    const manager = new OnlineStatusManager(userId);
    managerRef.current = manager;

    // Запускаем отслеживание
    manager.start();

    // Очистка при размонтировании
    return () => {
      manager.stop();
      managerRef.current = null;
    };
  }, [userId, enabled]);

  return managerRef.current;
};

/**
 * Хук для подписки на статус конкретного пользователя
 * @param userId - ID пользователя для отслеживания
 * @param onStatusChange - Callback при изменении статуса
 */
export const useUserStatus = (
  userId: string | null,
  onStatusChange: (user: User) => void
) => {
  useEffect(() => {
    if (!userId) return;

    // Подписываемся на изменения статуса
    const subscription = userService.subscribeToUserStatus(userId, onStatusChange);

    // Отписываемся при размонтировании
    return () => {
      subscription.unsubscribe();
    };
  }, [userId, onStatusChange]);
};

/**
 * Хук для подписки на статусы нескольких пользователей
 * @param userIds - Массив ID пользователей для отслеживания
 * @param onStatusChange - Callback при изменении статуса любого пользователя
 */
export const useMultipleUserStatuses = (
  userIds: string[],
  onStatusChange: (user: User) => void
) => {
  useEffect(() => {
    if (!userIds || userIds.length === 0) return;

    // Подписываемся на изменения статусов
    const subscription = userService.subscribeToMultipleUserStatuses(userIds, onStatusChange);

    // Отписываемся при размонтировании
    return () => {
      subscription.unsubscribe();
    };
  }, [userIds, onStatusChange]);
};
