/**
 * Toast Component
 * Notification messages
 */

import React, { forwardRef, useEffect, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  /** Toast message */
  message: string;
  /** Toast type/variant */
  type?: ToastType;
  /** Auto dismiss after duration (ms) */
  duration?: number;
  /** Show close button */
  closable?: boolean;
  /** Callback when closed */
  onClose?: () => void;
  /** Toast title */
  title?: string;
  /** Position on screen */
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  /** Custom icon */
  icon?: React.ReactNode;
}

const typeColors: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'var(--color-success)',
    border: 'var(--color-success)',
    icon: '#22c55e',
  },
  error: {
    bg: 'var(--color-error)',
    border: 'var(--color-error)',
    icon: '#ef4444',
  },
  warning: {
    bg: 'var(--color-warning)',
    border: 'var(--color-warning)',
    icon: '#eab308',
  },
  info: {
    bg: 'var(--color-info)',
    border: 'var(--color-info)',
    icon: '#3b82f6',
  },
};

const positionStyles: Record<NonNullable<ToastProps['position']>, React.CSSProperties> = {
  'top-left': { top: 'var(--spacing-4)', left: 'var(--spacing-4)' },
  'top-center': { top: 'var(--spacing-4)', left: '50%', transform: 'translateX(-50%)' },
  'top-right': { top: 'var(--spacing-4)', right: 'var(--spacing-4)' },
  'bottom-left': { bottom: 'var(--spacing-4)', left: 'var(--spacing-4)' },
  'bottom-center': { bottom: 'var(--spacing-4)', left: '50%', transform: 'translateX(-50%)' },
  'bottom-right': { bottom: 'var(--spacing-4)', right: 'var(--spacing-4)' },
};

const containerStyles: React.CSSProperties = {
  position: 'fixed',
  zIndex: 'var(--z-index-tooltip)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-2)',
  pointerEvents: 'none',
};

const toastStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--spacing-3)',
  padding: 'var(--spacing-3) var(--spacing-4)',
  backgroundColor: 'var(--color-surface-elevated)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-lg)',
  borderLeft: '4px solid',
  minWidth: '20rem',
  maxWidth: '28rem',
  pointerEvents: 'auto',
  animation: 'slideIn var(--transition-duration-normal) var(--transition-timing-function-ease-out)',
};

/**
 * Check icon for success
 */
function SuccessIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={typeColors.success.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

/**
 * X icon for error
 */
function ErrorIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={typeColors.error.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

/**
 * Alert triangle for warning
 */
function WarningIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={typeColors.warning.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/**
 * Info icon
 */
function InfoIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={typeColors.info.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

/**
 * Close icon
 */
function CloseIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Toast component
 */
export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      message,
      type = 'info',
      duration = 5000,
      closable = true,
      onClose,
      title,
      position = 'bottom-right',
      icon,
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(true);
    const colors = typeColors[type];

    const handleClose = useCallback(() => {
      setIsVisible(false);
      onClose?.();
    }, [onClose]);

    // Auto dismiss
    useEffect(() => {
      if (duration === 0) return;

      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }, [duration, handleClose]);

    if (!isVisible) return <></>;

    const defaultIcon = (() => {
      switch (type) {
        case 'success':
          return <SuccessIcon />;
        case 'error':
          return <ErrorIcon />;
        case 'warning':
          return <WarningIcon />;
        case 'info':
        default:
          return <InfoIcon />;
      }
    })();

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="polite"
        style={{
          ...toastStyles,
          borderLeftColor: colors.border,
        }}
      >
        <span style={{ flexShrink: 0, marginTop: '2px' }}>
          {icon || defaultIcon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {title && (
            <div style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-1)' }}>
              {title}
            </div>
          )}
          <div style={{ color: 'var(--color-foreground)', fontSize: 'var(--font-size-sm)' }}>
            {message}
          </div>
        </div>
        {closable && (
          <button
            type="button"
            onClick={handleClose}
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '1.5rem',
              height: '1.5rem',
              padding: 0,
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              color: 'var(--color-muted)',
              marginLeft: 'var(--spacing-2)',
            }}
            aria-label="Dismiss notification"
          >
            <CloseIcon />
          </button>
        )}
      </div>
    );
  }
);

Toast.displayName = 'Toast';

// Toast Container to manage multiple toasts
export interface ToastContainerProps {
  children: React.ReactNode;
  position?: ToastProps['position'];
}

export function ToastContainer({ children, position = 'bottom-right' }: ToastContainerProps): JSX.Element {
  return (
    <div
      style={{
        ...containerStyles,
        ...positionStyles[position],
      }}
    >
      {children}
    </div>
  );
}

// Toast styles CSS
export const toastStylesCSS = `
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
`;
