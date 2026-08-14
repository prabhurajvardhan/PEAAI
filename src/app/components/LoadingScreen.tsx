import React from 'react';
import { Spinner } from '../../foundation/components/spinner';

interface LoadingScreenProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export function LoadingScreen({
  message = 'Loading...',
  showProgress = false,
  progress = 0,
}: LoadingScreenProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text-primary)',
      }}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Spinner size="lg" variant="default" color="var(--color-primary)" />
      <p
        style={{
          marginTop: '1.5rem',
          fontSize: '1rem',
          fontWeight: '500',
          color: 'var(--color-text-primary)',
        }}
      >
        {message}
      </p>
      {showProgress && (
        <div
          style={{
            marginTop: '1rem',
            width: '200px',
            height: '4px',
            backgroundColor: 'var(--color-border)',
            borderRadius: 'var(--border-radius-full)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
              height: '100%',
              backgroundColor: 'var(--color-primary)',
              transition: 'width 0.3s ease-out',
            }}
          />
        </div>
      )}
    </div>
  );
}
