import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
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

const textareaStyles: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontSize: '1rem',
  fontFamily: 'inherit',
  borderRadius: 'var(--border-radius)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-background)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  resize: 'vertical',
  minHeight: '100px',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const hintStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--color-text-secondary)',
};

const errorStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--color-error)',
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, fullWidth = false, style, ...props }, ref) => {
    return (
      <div style={{ ...containerStyles, width: fullWidth ? '100%' : 'auto' }}>
        {label && (
          <label style={labelStyles}>
            {label}
            {props.required && <span style={{ color: 'var(--color-error)' }}> *</span>}
          </label>
        )}
        <textarea
          ref={ref}
          style={{
            ...textareaStyles,
            borderColor: error ? 'var(--color-error)' : undefined,
            ...style,
          }}
          {...props}
        />
        {hint && !error && <span style={hintStyles}>{hint}</span>}
        {error && <span style={errorStyles}>{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
