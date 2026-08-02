import React, { useState } from 'react';

export type InputType = 'text' | 'number' | 'password' | 'email' | 'search' | 'url' | 'tel';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: InputType;
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
};

const labelStyles: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: '500',
  color: 'var(--color-text-primary)',
};

const inputWrapperStyles: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const baseInputStyles: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontSize: '1rem',
  fontFamily: 'inherit',
  borderRadius: 'var(--border-radius)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-background)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const inputWithIconStyles: React.CSSProperties = {
  paddingLeft: '2.5rem',
};

const inputWithRightIconStyles: React.CSSProperties = {
  paddingRight: '2.5rem',
};

const hintStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--color-text-secondary)',
};

const errorStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--color-error)',
};

const iconStyles: React.CSSProperties = {
  position: 'absolute',
  left: '0.75rem',
  color: 'var(--color-text-secondary)',
  pointerEvents: 'none',
};

const toggleButtonStyles: React.CSSProperties = {
  position: 'absolute',
  right: '0.75rem',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--color-text-secondary)',
  padding: '0.25rem',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      label,
      error,
      hint,
      fullWidth = false,
      leftIcon,
      rightIcon,
      style,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const inputStyles: React.CSSProperties = {
      ...baseInputStyles,
      ...(leftIcon ? inputWithIconStyles : {}),
      ...((rightIcon || isPassword) ? inputWithRightIconStyles : {}),
      borderColor: error ? 'var(--color-error)' : undefined,
      ...style,
    };

    return (
      <div style={{ ...containerStyles, width: fullWidth ? '100%' : 'auto' }}>
        {label && (
          <label style={labelStyles}>
            {label}
            {props.required && <span style={{ color: 'var(--color-error)' }}> *</span>}
          </label>
        )}
        <div style={inputWrapperStyles}>
          {leftIcon && <span style={iconStyles}>{leftIcon}</span>}
          <input ref={ref} type={inputType} style={inputStyles} {...props} />
          {isPassword && (
            <button
              type="button"
              style={toggleButtonStyles}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          )}
          {rightIcon && !isPassword && <span style={{ ...iconStyles, left: 'auto', right: '0.75rem' }}>{rightIcon}</span>}
        </div>
        {hint && !error && <span style={hintStyles}>{hint}</span>}
        {error && <span style={errorStyles}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
