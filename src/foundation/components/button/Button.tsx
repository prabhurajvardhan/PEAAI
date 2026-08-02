/**
 * Button Component
 * Accessible button with multiple variants
 */

import React, { forwardRef, useCallback } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state with spinner */
  loading?: boolean;
  /** Icon element to display before text */
  leftIcon?: React.ReactNode;
  /** Icon element to display after text */
  rightIcon?: React.ReactNode;
  /** Make button square (icon only) */
  iconOnly?: boolean;
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: 'var(--spacing-1-5) var(--spacing-3)',
    fontSize: 'var(--font-size-sm)',
    minHeight: '2rem',
    gap: 'var(--spacing-1)',
  },
  md: {
    padding: 'var(--spacing-2) var(--spacing-4)',
    fontSize: 'var(--font-size-base)',
    minHeight: '2.5rem',
    gap: 'var(--spacing-2)',
  },
  lg: {
    padding: 'var(--spacing-3) var(--spacing-6)',
    fontSize: 'var(--font-size-lg)',
    minHeight: '3rem',
    gap: 'var(--spacing-2)',
  },
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--color-primary-600)',
    color: 'var(--color-white)',
    borderColor: 'var(--color-primary-600)',
  },
  secondary: {
    backgroundColor: 'var(--color-secondary-600)',
    color: 'var(--color-white)',
    borderColor: 'var(--color-secondary-600)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-foreground)',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: 'var(--color-error)',
    color: 'var(--color-white)',
    borderColor: 'var(--color-error)',
  },
};

const baseStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'var(--font-weight-medium)',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'all var(--transition-duration-fast) var(--transition-timing-function-ease-in-out)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

const disabledStyles: React.CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
  pointerEvents: 'none',
};

/**
 * Button component with variants
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      iconOnly = false,
      disabled,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const combinedStyles: React.CSSProperties = {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(iconOnly && { padding: sizeStyles[size].padding }),
      ...(fullWidth && { width: '100%' }),
      ...(isDisabled && disabledStyles),
      ...style,
    };

    // Hover styles based on variant
    const getHoverStyles = (): React.CSSProperties => {
      if (isDisabled) return {};
      switch (variant) {
        case 'primary':
          return { backgroundColor: 'var(--color-primary-700)', borderColor: 'var(--color-primary-700)' };
        case 'secondary':
          return { backgroundColor: 'var(--color-secondary-700)', borderColor: 'var(--color-secondary-700)' };
        case 'ghost':
          return { backgroundColor: 'var(--color-neutral-100)' };
        case 'danger':
          return { backgroundColor: '#dc2626', borderColor: '#dc2626' };
        default:
          return {};
      }
    };

    // Focus styles
    const focusStyles: React.CSSProperties = {
      outline: 'none',
      boxShadow: `0 0 0 3px ${variant === 'ghost' ? 'var(--color-neutral-300)' : 'var(--color-primary-500)'}40`,
    };

    const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      const hoverStyles = getHoverStyles();
      Object.assign(e.currentTarget.style, hoverStyles);
      props.onMouseEnter?.(e);
    }, [props]);

    const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.backgroundColor = variantStyles[variant].backgroundColor || '';
      e.currentTarget.style.borderColor = variantStyles[variant].borderColor || '';
      props.onMouseLeave?.(e);
    }, [props, variant]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLButtonElement>) => {
      Object.assign(e.currentTarget.style, focusStyles);
      props.onFocus?.(e);
    }, [props]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLButtonElement>) => {
      e.currentTarget.style.boxShadow = '';
      props.onBlur?.(e);
    }, [props]);

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        style={combinedStyles}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      >
        {loading && (
          <Spinner size="sm" style={{ marginRight: leftIcon || children ? 'var(--spacing-2)' : 0 }} />
        )}
        {!loading && leftIcon && <span aria-hidden="true">{leftIcon}</span>}
        {!iconOnly && children && <span>{children}</span>}
        {!loading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * Icon Button component
 */
export interface IconButtonProps extends Omit<ButtonProps, 'iconOnly' | 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        iconOnly
        size={size}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// Import Spinner for loading state
import { Spinner } from '../spinner/Spinner';
