/**
 * Modal Component
 * Accessible dialog overlay
 */

import React, { forwardRef, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: React.ReactNode;
  /** Modal content */
  children: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Close on backdrop click */
  closeOnBackdropClick?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Prevent body scroll when open */
  preventScroll?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Initial focus element */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /** Modal content class name */
  className?: string;
  /** ID for the modal */
  id?: string;
}

const sizeMap: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-width: 24rem',
  md: 'max-width: 32rem',
  lg: 'max-width: 42rem',
  xl: 'max-width: 56rem',
  full: 'max-width: calc(100vw - 2rem); max-height: calc(100vh - 2rem)',
};

const backdropStyles: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 'var(--z-index-modal-backdrop)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--spacing-4)',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(4px)',
  animation: 'fadeIn var(--transition-duration-fast) var(--transition-timing-function-ease-out)',
};

const modalStyles: React.CSSProperties = {
  position: 'relative',
  zIndex: 'var(--z-index-modal)',
  width: '100%',
  backgroundColor: 'var(--color-surface-elevated)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow-xl)',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: 'calc(100vh - 2rem)',
  animation: 'slideIn var(--transition-duration-normal) var(--transition-timing-function-ease-out)',
};

const headerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 'var(--spacing-4) var(--spacing-6)',
  borderBottom: '1px solid var(--color-border-muted)',
  flexShrink: 0,
};

const titleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--font-size-xl)',
  fontWeight: 'var(--font-weight-semibold)',
  color: 'var(--color-foreground)',
};

const closeButtonStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2rem',
  height: '2rem',
  padding: 0,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  color: 'var(--color-muted)',
  transition: 'background-color var(--transition-duration-fast)',
};

const bodyStyles: React.CSSProperties = {
  padding: 'var(--spacing-6)',
  overflowY: 'auto',
  flex: 1,
};

const footerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 'var(--spacing-3)',
  padding: 'var(--spacing-4) var(--spacing-6)',
  borderTop: '1px solid var(--color-border-muted)',
  flexShrink: 0,
};

/**
 * Close icon
 */
function CloseIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Modal component with backdrop
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      children,
      footer,
      size = 'md',
      closeOnBackdropClick = true,
      closeOnEscape = true,
      preventScroll = true,
      showCloseButton = true,
      initialFocusRef,
      className,
      id,
    },
    ref
  ) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Handle escape key
    useEffect(() => {
      if (!isOpen || !closeOnEscape) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeOnEscape, onClose]);

    // Prevent body scroll
    useEffect(() => {
      if (!isOpen || !preventScroll) return;

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }, [isOpen, preventScroll]);

    // Focus trap and initial focus
    useEffect(() => {
      if (!isOpen) return;

      // Store current active element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Set initial focus
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (contentRef.current) {
        // Focus first focusable element
        const focusable = contentRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      }

      return () => {
        // Restore focus
        previousActiveElement.current?.focus();
      };
    }, [isOpen, initialFocusRef]);

    // Handle backdrop click
    const handleBackdropClick = useCallback(
      (e: React.MouseEvent) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      },
      [closeOnBackdropClick, onClose]
    );

    // Handle close button
    const handleClose = useCallback(() => {
      onClose();
    }, [onClose]);

    if (!isOpen) return <></>;

    const modalContent = (
      <div
        ref={ref as any}
        style={backdropStyles}
        onClick={handleBackdropClick}
        role="presentation"
        id={id}
      >
        <div
          ref={contentRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? `${id || 'modal'}-title` : undefined}
          aria-describedby={title ? `${id || 'modal'}-description` : undefined}
          style={{ ...modalStyles, ...(sizeMap[size] && { style: { maxWidth: sizeMap[size].split(':')[1] } }), ...(className && { className }) } as any}
          className={className}
        >
          {title && (
            <div style={headerStyles}>
              <h2 id={`${id || 'modal'}-title`} style={titleStyles}>
                {title}
              </h2>
              {showCloseButton && (
                <button
                  type="button"
                  onClick={handleClose}
                  style={closeButtonStyles}
                  aria-label="Close modal"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          )}
          <div id={`${id || 'modal'}-description`} style={bodyStyles}>
            {children}
          </div>
          {footer && <div style={footerStyles}>{footer}</div>}
        </div>
      </div>
    );

    // Use portal to render at document body
    if (typeof document !== 'undefined') {
      return createPortal(modalContent, document.body);
    }

    return <></>;
  }
);

Modal.displayName = 'Modal';

// CSS keyframes for animation (injected via style tag)
export const modalStylesCSS = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
`;
