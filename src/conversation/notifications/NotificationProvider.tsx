import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { Notification, NotificationOptions, NotificationContextValue, NotificationType } from './types';
import { ToastContainer } from './ToastContainer';

const generateId = (): string => {
  return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const defaultContextValue: NotificationContextValue = {
  notifications: [],
  addNotification: () => '',
  removeNotification: () => {},
  clearAll: () => {},
};

const NotificationContext = createContext<NotificationContextValue>(defaultContextValue);

export interface NotificationProviderProps {
  children: ReactNode;
  defaultDuration?: number;
  maxNotifications?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxVisible?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  defaultDuration = 5000,
  maxNotifications = 10,
  position = 'top-right',
  maxVisible = 5,
}) => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

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

  const value = useMemo(() => ({
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  }), [notifications, addNotification, removeNotification, clearAll]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer
        notifications={notifications}
        onDismiss={removeNotification}
        position={position}
        maxVisible={maxVisible}
      />
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

// Convenience hooks for specific notification types
export const useNotifications = () => {
  const { addNotification, removeNotification, clearAll, notifications } = useNotificationContext();

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
    return addNotification({ type: 'error', message, title, duration: 0 });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    notify,
    info,
    success,
    warning,
    error,
  };
};

export default NotificationProvider;
