import React, { useState, useRef, useCallback, useEffect } from 'react';

export interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
  sendOnEnter?: boolean;
  loading?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  maxLength = 4000,
  showCharacterCount = false,
  sendOnEnter = true,
  loading = false,
  'aria-label': ariaLabel = 'Chat input',
  className,
  style,
}) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDisabled = disabled || loading;

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && !isDisabled && trimmed.length <= maxLength) {
      onSend(trimmed);
      setValue('');
      textareaRef.current?.focus();
    }
  }, [value, onSend, isDisabled, maxLength]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (sendOnEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [sendOnEnter, handleSubmit]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setValue(newValue);
    }
  }, [maxLength]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 150);
      textarea.style.height = `${newHeight}px`;
    }
  }, [value]);

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-md)',
    backgroundColor: 'var(--color-background)',
    borderTop: '1px solid var(--color-border)',
    alignItems: 'flex-end',
    ...style,
  };

  const inputWrapperStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--border-radius)',
    border: '1px solid var(--color-border)',
    padding: 'var(--spacing-xs) var(--spacing-sm)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const inputWrapperFocusStyles: React.CSSProperties = {
    ...inputWrapperStyles,
    borderColor: 'var(--color-primary)',
    boxShadow: '0 0 0 2px var(--color-primary-alpha)',
  };

  const textareaStyles: React.CSSProperties = {
    flex: 1,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    fontSize: '1rem',
    lineHeight: '1.5',
    color: 'var(--color-text-primary)',
    padding: 'var(--spacing-xs)',
    minHeight: '24px',
    maxHeight: '150px',
  };

  const buttonStyles: React.CSSProperties = {
    width: '44px',
    height: '44px',
    borderRadius: 'var(--border-radius)',
    border: 'none',
    backgroundColor: value.trim() && !isDisabled ? 'var(--color-primary)' : 'var(--color-neutral-300)',
    color: value.trim() && !isDisabled ? 'white' : 'var(--color-text-secondary)',
    cursor: value.trim() && !isDisabled ? 'pointer' : 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s, transform 0.1s',
    flexShrink: 0,
  };

  const charCountStyles: React.CSSProperties = {
    fontSize: '0.75rem',
    color: value.length > maxLength * 0.9 
      ? 'var(--color-warning)' 
      : 'var(--color-text-secondary)',
    alignSelf: 'flex-end',
    marginBottom: 'var(--spacing-xs)',
  };

  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={containerStyles} className={className}>
      <div style={isFocused ? inputWrapperFocusStyles : inputWrapperStyles}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={isDisabled}
          aria-label={ariaLabel}
          aria-describedby={showCharacterCount ? 'char-count' : undefined}
          style={textareaStyles}
          rows={1}
        />
      </div>
      
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!value.trim() || isDisabled}
        style={buttonStyles}
        aria-label="Send message"
        onMouseDown={(e) => {
          if (value.trim() && !isDisabled) {
            e.preventDefault();
          }
        }}
      >
        {loading ? (
          <LoadingSpinner />
        ) : (
          <SendIcon />
        )}
      </button>

      {showCharacterCount && (
        <span id="char-count" style={charCountStyles}>
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
};

const SendIcon: React.FC = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const LoadingSpinner: React.FC = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    aria-hidden="true"
    style={{ animation: 'spin 1s linear infinite' }}
  >
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
  </svg>
);

export default ChatInput;
