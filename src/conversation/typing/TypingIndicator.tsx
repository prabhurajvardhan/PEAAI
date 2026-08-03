import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TypingAnimationOptions } from '../types';

export interface TypingIndicatorProps {
  dots?: number;
  interval?: number;
  animationClass?: string;
  label?: string;
  showLabel?: boolean;
  position?: 'start' | 'end';
  'aria-label'?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  dots = 3,
  interval = 300,
  animationClass,
  label = 'AI is typing',
  showLabel = false,
  position = 'start',
  'aria-label': ariaLabel = 'AI is typing',
  className,
  style,
}) => {
  const [activeDot, setActiveDot] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setActiveDot((prev) => (prev + 1) % dots);
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [dots, interval]);

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    ...style,
  };

  const dotsContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  };

  const dotStyles = (index: number): React.CSSProperties => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: index === activeDot 
      ? 'var(--color-primary)' 
      : 'var(--color-neutral-300)',
    transition: 'background-color 0.1s ease-in-out',
    animation: animationClass ? undefined : 'bounce 1.4s infinite ease-in-out',
    animationDelay: `${index * 0.16}s`,
  });

  return (
    <div 
      style={containerStyles} 
      className={className}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      {position === 'start' && showLabel && (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          {label}
        </span>
      )}
      <div style={dotsContainerStyles}>
        {Array.from({ length: dots }).map((_, index) => (
          <span 
            key={index} 
            style={dotStyles(index)}
            className={animationClass}
            aria-hidden="true"
          />
        ))}
      </div>
      {position === 'end' && showLabel && (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          {label}
        </span>
      )}
    </div>
  );
};

export interface TypingBubbleProps {
  options?: TypingAnimationOptions;
  avatar?: React.ReactNode;
  'aria-label'?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const TypingBubble: React.FC<TypingBubbleProps> = ({
  options,
  avatar,
  'aria-label': ariaLabel = 'AI is typing a message',
  className,
  style,
}) => {
  const bubbleStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--border-radius)',
    ...style,
  };

  const avatarStyles: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    flexShrink: 0,
  };

  return (
    <div 
      style={bubbleStyles} 
      className={className}
      role="status"
      aria-label={ariaLabel}
    >
      <div style={avatarStyles} aria-hidden="true">
        {avatar || '🤖'}
      </div>
      <TypingIndicator 
        dots={options?.dots || 3}
        interval={options?.interval || 300}
        animationClass={options?.animationClass}
      />
    </div>
  );
};

export interface TypingDotsProps {
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  'aria-label'?: string;
  className?: string;
}

export const TypingDots: React.FC<TypingDotsProps> = ({
  count = 3,
  size = 'md',
  color,
  'aria-label': ariaLabel = 'Loading',
  className,
}) => {
  const [activeDot, setActiveDot] = useState(0);
  
  const sizes = useMemo(() => ({
    sm: { dot: '4px', gap: '3px', duration: '1.2s' },
    md: { dot: '8px', gap: '4px', duration: '1.4s' },
    lg: { dot: '12px', gap: '6px', duration: '1.6s' },
  }), []);

  const sizeConfig = sizes[size];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % count);
    }, 200);

    return () => clearInterval(interval);
  }, [count]);

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    gap: sizeConfig.gap,
    alignItems: 'center',
  };

  const dotStyles = (index: number): React.CSSProperties => ({
    width: sizeConfig.dot,
    height: sizeConfig.dot,
    borderRadius: '50%',
    backgroundColor: color || (index === activeDot 
      ? 'var(--color-primary)' 
      : 'var(--color-neutral-400)'),
    transition: 'background-color 0.15s ease-in-out',
  });

  return (
    <div 
      style={containerStyles} 
      className={className}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, index) => (
        <span key={index} style={dotStyles(index)} aria-hidden="true" />
      ))}
    </div>
  );
};

export default TypingIndicator;
