/**
 * Spinner Component
 * Loading indicator
 */

import React from 'react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'primary' | 'secondary' | 'white';

export interface SpinnerProps {
  /** Size of the spinner */
  size?: SpinnerSize;
  /** Color variant */
  variant?: SpinnerVariant;
  /** Custom color */
  color?: string;
  /** Show full screen overlay */
  overlay?: boolean;
  /** Custom aria-label */
  label?: string;
  /** Additional CSS styles */
  style?: React.CSSProperties;
  /** Additional class name */
  className?: string;
}

const sizeMap: Record<SpinnerSize, number> = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

const strokeWidthMap: Record<SpinnerSize, number> = {
  xs: 2,
  sm: 2,
  md: 3,
  lg: 3,
  xl: 4,
};

const variantColors: Record<SpinnerVariant, string> = {
  primary: 'var(--color-primary-600)',
  secondary: 'var(--color-neutral-400)',
  white: 'var(--color-white)',
};

const overlayStyles: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(2px)',
  zIndex: 'var(--z-index-modal-backdrop)',
};

/**
 * Spinner component
 */
export function Spinner({
  size = 'md',
  variant = 'primary',
  color,
  overlay = false,
  label = 'Loading',
  style,
  className,
}: SpinnerProps): JSX.Element {
  const svgSize = sizeMap[size];
  const strokeWidth = strokeWidthMap[size];
  const strokeColor = color || variantColors[variant];

  const spinner = (
    <svg
      width={svgSize}
      height={svgSize}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        animation: 'spin 1s linear infinite',
        ...style,
      }}
      className={className}
      role="status"
      aria-label={label}
    >
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeOpacity={0.2}
        style={{ color: 'var(--color-neutral-300)' }}
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        strokeDashoffset="0"
        style={{
          strokeDasharray: '60 40',
          animation: 'dash 1.5s ease-in-out infinite',
        }}
      />
      <style>
        {`
          @keyframes dash {
            0% {
              stroke-dasharray: 1 150;
              stroke-dashoffset: 0;
            }
            50% {
              stroke-dasharray: 90 150;
              stroke-dashoffset: -35;
            }
            100% {
              stroke-dasharray: 90 150;
              stroke-dashoffset: -124;
            }
          }
        `}
      </style>
    </svg>
  );

  if (overlay) {
    return (
      <div style={overlayStyles}>
        {spinner}
      </div>
    );
  }

  return spinner;
}

// Dots spinner variant
export interface DotsSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

const dotsSizeMap: Record<NonNullable<DotsSpinnerProps['size']>, number> = {
  sm: 6,
  md: 8,
  lg: 10,
};

export function DotsSpinner({
  size = 'md',
  color = 'var(--color-primary-600)',
  style,
  className,
}: DotsSpinnerProps): JSX.Element {
  const dotSize = dotsSizeMap[size];
  const duration = 0.6;

  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-1)',
        ...style,
      }}
      className={className}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: 'var(--radius-full)',
            backgroundColor: color,
            animation: `bounce ${duration}s ease-in-out infinite`,
            animationDelay: `${i * duration / 3}s`,
          }}
        />
      ))}
      <style>
        {`
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
              opacity: 0.5;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}

// Pulse spinner variant
export interface PulseSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

const pulseSizeMap: Record<NonNullable<PulseSpinnerProps['size']>, number> = {
  sm: 16,
  md: 24,
  lg: 32,
};

export function PulseSpinner({
  size = 'md',
  color = 'var(--color-primary-600)',
  style,
  className,
}: PulseSpinnerProps): JSX.Element {
  const svgSize = pulseSizeMap[size];

  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        position: 'relative',
        width: svgSize,
        height: svgSize,
        ...style,
      }}
      className={className}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'var(--radius-full)',
            backgroundColor: color,
            animation: `pulse 1.2s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              transform: scale(0.8);
              opacity: 0.5;
            }
            50% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}
