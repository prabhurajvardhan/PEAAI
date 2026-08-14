import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  style?: React.CSSProperties;
  className?: string;
}

export function Skeleton({
  width,
  height,
  variant = 'text',
  animation = 'pulse',
  style = {},
  className = '',
}: SkeletonProps) {
  const getDefaultDimensions = () => {
    switch (variant) {
      case 'text':
        return { width: '100%', height: '1em' };
      case 'circular':
        return { width: '40px', height: '40px' };
      case 'rectangular':
        return { width: '100%', height: '100px' };
      default:
        return {};
    }
  };

  const defaultDimensions = getDefaultDimensions();

  const baseStyle: React.CSSProperties = {
    width: width ?? defaultDimensions.width,
    height: height ?? defaultDimensions.height,
    backgroundColor: 'var(--color-border)',
    borderRadius:
      variant === 'circular'
        ? '50%'
        : variant === 'text'
        ? 'var(--border-radius-sm)'
        : 'var(--border-radius)',
    ...(animation === 'pulse' && {
      animation: 'skeleton-pulse 1.5s ease-in-out infinite',
    }),
    ...(animation === 'wave' && {
      position: 'relative',
      overflow: 'hidden',
    }),
    ...style,
  };

  const waveOverlay =
    animation === 'wave'
      ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          )`,
          animation: 'skeleton-wave 1.5s linear infinite',
        }
      : {};

  return (
    <>
      <style>
        {`
          @keyframes skeleton-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes skeleton-wave {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
      <div className={className} style={baseStyle}>
        {animation === 'wave' && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.4),
                transparent
              )`,
              animation: 'skeleton-wave 1.5s linear infinite',
            }}
          />
        )}
      </div>
    </>
  );
}

interface SkeletonTextProps {
  lines?: number;
  spacing?: number;
  lastLineWidth?: string;
}

export function SkeletonText({
  lines = 3,
  spacing = 0.75,
  lastLineWidth = '60%',
}: SkeletonTextProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${spacing}rem` }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height="1em"
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  showAvatar?: boolean;
  showImage?: boolean;
  showActions?: boolean;
}

export function SkeletonCard({ showAvatar = true, showImage = false, showActions = true }: SkeletonCardProps) {
  return (
    <div
      style={{
        padding: '1rem',
        borderRadius: 'var(--border-radius-lg)',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {showAvatar && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Skeleton variant="circular" width="40px" height="40px" />
          <div style={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height="1em" />
          </div>
        </div>
      )}
      {showImage && (
        <Skeleton variant="rectangular" height="150px" style={{ marginBottom: '1rem' }} />
      )}
      <SkeletonText lines={3} spacing={0.5} />
      {showActions && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <Skeleton variant="rectangular" width="80px" height="32px" />
          <Skeleton variant="rectangular" width="80px" height="32px" />
        </div>
      )}
    </div>
  );
}
