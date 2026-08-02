import React from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerVariant = 'default' | 'dots' | 'pulse';

export interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const sizeMap = {
  sm: '16px',
  md: '24px',
  lg: '40px',
};

const dotSizeMap = {
  sm: '6px',
  md: '10px',
  lg: '16px',
};

const styles = {
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: (size: SpinnerSize, color: string): React.CSSProperties => ({
    width: sizeMap[size],
    height: sizeMap[size],
    border: `2px solid ${color}`,
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
  }),
  dotsContainer: (gap: string): React.CSSProperties => ({
    display: 'flex',
    gap,
  }),
  dot: (size: SpinnerSize, color: string): React.CSSProperties => ({
    width: dotSizeMap[size],
    height: dotSizeMap[size],
    borderRadius: '50%',
    backgroundColor: color,
  }),
  pulse: (size: SpinnerSize, color: string): React.CSSProperties => ({
    width: sizeMap[size],
    height: sizeMap[size],
    borderRadius: '50%',
    backgroundColor: color,
    animation: 'pulse 1.2s ease-in-out infinite',
  }),
};

export function Spinner({
  size = 'md',
  variant = 'default',
  color = 'currentColor',
  className = '',
  style = {},
}: SpinnerProps) {
  const containerStyle = { ...styles.container, ...style };

  if (variant === 'dots') {
    const gap = size === 'sm' ? '3px' : size === 'md' ? '4px' : '6px';
    return (
      <div role="status" aria-label="Loading" className={className} style={containerStyle}>
        <div style={styles.dotsContainer(gap)}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                ...styles.dot(size, color),
                animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div role="status" aria-label="Loading" className={className} style={containerStyle}>
        <span style={styles.pulse(size, color)} />
      </div>
    );
  }

  return (
    <div role="status" aria-label="Loading" className={className} style={containerStyle}>
      <span style={styles.spinner(size, color)} />
    </div>
  );
}
