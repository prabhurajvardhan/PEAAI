import React from 'react';
import { Spinner } from '../../foundation/components/spinner';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  variant?: 'full' | 'partial';
}

export function LoadingOverlay({ visible, message, variant = 'full' }: LoadingOverlayProps) {
  if (!visible) return null;

  const overlayStyle: React.CSSProperties =
    variant === 'full'
      ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
        }
      : {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(2px)',
          borderRadius: 'inherit',
          zIndex: 10,
        };

  return (
    <div
      style={overlayStyle}
      role="status"
      aria-live="polite"
      aria-label={message || 'Loading'}
    >
      <Spinner size="md" variant="default" color={variant === 'full' ? 'white' : 'var(--color-primary)'} />
      {message && (
        <p
          style={{
            marginTop: '1rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: variant === 'full' ? 'white' : 'var(--color-text-primary)',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
