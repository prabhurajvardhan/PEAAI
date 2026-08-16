import React, { useEffect, useCallback } from 'react';
import { Notification, NotificationType } from './types';

export interface ToastContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxVisible?: number;
  className?: string;
}

const getTypeStyles = (type: NotificationType): React.CSSProperties => {
  const baseStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    padding: 'var(--spacing-md)',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--shadow-lg)',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    minWidth: '300px',
    maxWidth: '420px',
    animation: 'slideIn 0.3s ease-out',
  };

  const iconStyles: Record<NotificationType, React.CSSProperties> = {
    info: {
      borderLeft: '4px solid var(--color-info, #3b82f6)',
    },
    success: {
      borderLeft: '4px solid var(--color-success, #22c55e)',
    },
    warning: {
      borderLeft: '4px solid var(--color-warning, #f59e0b)',
    },
    error: {
      borderLeft: '4px solid var(--color-error, #ef4444)',
    },
  };

  return { ...baseStyles, ...iconStyles[type] };
};

const getIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };
  return icons[type];
};

interface ToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ notification, onDismiss }) => {
  const { id, type, title, message, dismissible = true, duration, action } = notification;

  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  return (
    <div style={getTypeStyles(type)} role="alert" aria-live="polite">
      <span style={{ fontSize: '1.25rem', marginRight: 'var(--spacing-sm)' }}>
        {getIcon(type)}
      </span>
      <div style={{ flex: 1 }}>
        {title && (
          <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
            {title}
          </div>
        )}
        <div style={{ color: 'var(--color-text-secondary)' }}>{message}</div>
        {action && (
          <button
            onClick={action.onClick}
            style={{
              marginTop: 'var(--spacing-sm)',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--border-radius)',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            {action.label}
          </button>
        )}
      </div>
      {dismissible && (
        <button
          onClick={() => onDismiss(id)}
          aria-label="Dismiss notification"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 'var(--spacing-xs)',
            color: 'var(--color-text-tertiary)',
            fontSize: '1.25rem',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  notifications,
  onDismiss,
  position = 'top-right',
  maxVisible = 5,
  className,
}) => {
  const getPositionStyles = useCallback((): React.CSSProperties => {
    const basePosition: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-sm)',
      padding: 'var(--spacing-md)',
      pointerEvents: 'none',
    };

    const positions: Record<string, React.CSSProperties> = {
      'top-right': { ...basePosition, top: 0, right: 0 },
      'top-left': { ...basePosition, top: 0, left: 0 },
      'bottom-right': { ...basePosition, bottom: 0, right: 0 },
      'bottom-left': { ...basePosition, bottom: 0, left: 0 },
      'top-center': { ...basePosition, top: 0, left: '50%', transform: 'translateX(-50%)' },
      'bottom-center': { ...basePosition, bottom: 0, left: '50%', transform: 'translateX(-50%)' },
    };

    return positions[position] || positions['top-right'];
  }, [position]);

  const visibleNotifications = notifications.slice(0, maxVisible);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={className} style={getPositionStyles()}>
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes slideOut {
            from {
              opacity: 1;
              transform: translateX(0);
            }
            to {
              opacity: 0;
              transform: translateX(100%);
            }
          }
        `}
      </style>
      {visibleNotifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
