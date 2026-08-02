import React, { useEffect, useCallback } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

const sizeStyles = {
  sm: { maxWidth: '400px' },
  md: { maxWidth: '500px' },
  lg: { maxWidth: '700px' },
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    },
    [onClose, closeOnEscape]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        style={{
          position: 'relative',
          width: '90%',
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--border-radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          ...sizeStyles[size],
        }}
      >
        {title && (
          <div
            style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2 id="modal-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.25rem',
                color: 'var(--color-text-secondary)',
              }}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        )}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && (
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
