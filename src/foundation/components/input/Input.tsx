/**
 * Input Component
 * Accessible text input with multiple types
 */

import React, { forwardRef, useState, useCallback, useId } from 'react';

export type InputType = 'text' | 'number' | 'password' | 'email' | 'search' | 'tel' | 'url';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Input type */
  type?: InputType;
  /** Label text */
  label?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Show error state */
  isInvalid?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** Make input read-only but not disabled */
  readOnly?: boolean;
  /** Container class name */
  containerClassName?: string;
}

const baseStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-1)',
};

const inputWrapperStyles: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: 'var(--spacing-2) var(--spacing-3)',
  fontSize: 'var(--font-size-base)',
  fontFamily: 'inherit',
  lineHeight: 'var(--line-height-normal)',
  color: 'var(--color-foreground)',
  backgroundColor: 'var(--color-input-background)',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'var(--color-input-border)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  transition: 'border-color var(--transition-duration-fast) var(--transition-timing-function-ease-in-out), box-shadow var(--transition-duration-fast) var(--transition-timing-function-ease-in-out)',
};

const inputWithIconStyles: React.CSSProperties = {
  paddingLeft: 'var(--spacing-10)',
};

const inputWithRightIconStyles: React.CSSProperties = {
  paddingRight: 'var(--spacing-10)',
};

const iconWrapperStyles: React.CSSProperties = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'var(--spacing-10)',
  height: '100%',
  color: 'var(--color-muted)',
  pointerEvents: 'none',
};

const labelStyles: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 'var(--font-weight-medium)',
  color: 'var(--color-foreground)',
};

const helperTextStyles: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--color-muted-foreground)',
};

const errorTextStyles: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--color-error)',
};

/**
 * Eye icon for password toggle
 */
function EyeIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/**
 * Eye off icon for password toggle
 */
function EyeOffIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/**
 * Input component with label and validation
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      label,
      helperText,
      error,
      isInvalid,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      readOnly,
      containerClassName = '',
      style,
      id: providedId,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;

    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const hasError = isInvalid || !!error;
    const isPassword = type === 'password';
    const actualType = isPassword && showPassword ? 'text' : type;

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    }, [onFocus]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    }, [onBlur]);

    const togglePasswordVisibility = useCallback(() => {
      setShowPassword(prev => !prev);
    }, []);

    const containerStyles: React.CSSProperties = {
      ...baseStyles,
      ...(fullWidth && { width: '100%' }),
      ...style,
    };

    const inputStylesCombined: React.CSSProperties = {
      ...inputStyles,
      ...(leftIcon && inputWithIconStyles),
      ...(rightIcon && inputWithRightIconStyles),
      ...(isPassword && inputWithRightIconStyles),
      ...(hasError && { borderColor: 'var(--color-error)' }),
      ...(isFocused && !hasError && { 
        borderColor: 'var(--color-input-focus-ring)',
        boxShadow: `0 0 0 3px ${getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500')}20`,
      }),
      ...(disabled && { 
        backgroundColor: 'var(--color-disabled)',
        color: 'var(--color-disabled-foreground)',
        cursor: 'not-allowed',
      }),
      ...(readOnly && { 
        backgroundColor: 'var(--color-surface)',
        cursor: 'default',
      }),
    };

    return (
      <div style={containerStyles} className={containerClassName}>
        {label && (
          <label htmlFor={id} style={labelStyles}>
            {label}
            {props.required && <span style={{ color: 'var(--color-error)' }} aria-hidden="true"> *</span>}
          </label>
        )}
        <div style={inputWrapperStyles}>
          {leftIcon && (
            <span style={{ ...iconWrapperStyles, left: 0 }} aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            type={actualType}
            disabled={disabled}
            readOnly={readOnly}
            aria-invalid={hasError}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            style={inputStylesCombined}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              style={{
                position: 'absolute',
                right: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'var(--spacing-10)',
                height: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-muted)',
                padding: 0,
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
          {!isPassword && rightIcon && (
            <span style={{ ...iconWrapperStyles, right: 0 }} aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <span id={errorId} style={errorTextStyles} role="alert">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={helperId} style={helperTextStyles}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea component
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  isInvalid?: boolean;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      isInvalid,
      fullWidth = false,
      disabled,
      style,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;

    const hasError = isInvalid || !!error;

    const textareaStyles: React.CSSProperties = {
      ...inputStyles,
      minHeight: 'var(--spacing-32)',
      resize: 'vertical',
      ...(hasError && { borderColor: 'var(--color-error)' }),
      ...(disabled && { 
        backgroundColor: 'var(--color-disabled)',
        color: 'var(--color-disabled-foreground)',
        cursor: 'not-allowed',
      }),
      ...style,
    };

    return (
      <div style={{ ...baseStyles, ...(fullWidth && { width: '100%' }) }}>
        {label && (
          <label htmlFor={id} style={labelStyles}>
            {label}
            {props.required && <span style={{ color: 'var(--color-error)' }} aria-hidden="true"> *</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          style={textareaStyles}
          {...props}
        />
        {error && (
          <span id={errorId} style={errorTextStyles} role="alert">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={helperId} style={helperTextStyles}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
