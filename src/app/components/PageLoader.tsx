import React from 'react';
import { Spinner } from '../../foundation/components/spinner';

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function PageLoader({ message, fullScreen = false }: PageLoaderProps) {
  const containerStyle: React.CSSProperties = fullScreen
    ? {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--color-background)',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        width: '100%',
      };

  return (
    <div
      style={containerStyle}
      role="status"
      aria-live="polite"
      aria-label={message || 'Loading page'}
    >
      <Spinner size="md" variant="dots" color="var(--color-primary)" />
      {message && (
        <p
          style={{
            marginTop: '1rem',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
