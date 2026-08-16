import { useState, useCallback, useMemo } from 'react';
import { Notification, NotificationOptions, NotificationContextValue, NotificationType } from './types';

const generateId = (): string => {
  return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export interface UseNotificationsOptions {
  defaultDuration?: number;
  maxNotifications?: number;
}

export const useNotifications = (options: UseNotificationsOptions = {}): NotificationContextValue => {
  const { defaultDuration = 5000, maxNotifications = 10 } = options;
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((opts: NotificationOptions): string => {
    const id = opts.id || generateId();
    const notification: Notification = {
      id,
      type: opts.type || 'info',
      title: opts.title,
      message: opts.message,
      duration: opts.duration ?? defaultDuration,
      dismissible: opts.dismissible ?? true,
      action: opts.action,
      createdAt: Date.now(),
    };

    setNotifications((prev) => {
      const updated = [...prev, notification];
      if (updated.length > maxNotifications) {
        return updated.slice(-maxNotifications);
      }
      return updated;
    });

    return id;
  }, [defaultDuration, maxNotifications]);

  const removeNotification = useCallback((id: string): void => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback((): void => {
    setNotifications([]);
  }, []);

  // Helper methods for common notification types
  const notify = useCallback((message: string, title?: string): string => {
    return addNotification({ message, title });
  }, [addNotification]);

  const info = useCallback((message: string, title?: string): string => {
    return addNotification({ type: 'info', message, title });
  }, [addNotification]);

  const success = useCallback((message: string, title?: string): string => {
    return addNotification({ type: 'success', message, title });
  }, [addNotification]);

  const warning = useCallback((message: string, title?: string): string => {
    return addNotification({ type: 'warning', message, title });
  }, [addNotification]);

  const error = useCallback((message: string, title?: string): string => {
    return addNotification({ type: 'error', message, title, duration: 0 }); // Errors don't auto-dismiss by default
  }, [addNotification]);

  const value = useMemo(() => ({
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  }), [notifications, addNotification, removeNotification, clearAll]);

  return {
    ...value,
    // Attach helper methods
    info,
    success,
    warning,
    error,
    notify,
  } as NotificationContextValue & {
    info: (message: string, title?: string) => string;
    success: (message: string, title?: string) => string;
    warning: (message: string, title?: string) => string;
    error: (message: string, title?: string) => string;
    notify: (message: string, title?: string) => string;
  };
};

export default useNotifications;
