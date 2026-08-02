import React from 'react';
import { useTheme } from './ThemeProvider';
import type { ThemeToggleProps } from './types';

const styles = {
  switch: {
    base: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      cursor: 'pointer',
      borderRadius: '9999px',
      padding: '2px',
      backgroundColor: 'var(--color-border)',
      transition: 'background-color 0.2s',
    },
    sm: { width: '32px', height: '18px' },
    md: { width: '44px', height: '24px' },
    lg: { width: '56px', height: '30px' },
    thumb: {
      width: '50%',
      height: '100%',
      borderRadius: '9999px',
      backgroundColor: 'white',
      boxShadow: 'var(--shadow-sm)',
      transition: 'transform 0.2s',
    },
    thumbActive: {
      transform: 'translateX(100%)',
    },
  },
  icon: {
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      borderRadius: 'var(--border-radius)',
      border: 'none',
      backgroundColor: 'transparent',
      color: 'var(--color-text-primary)',
      transition: 'background-color 0.2s',
    },
    sm: { width: '28px', height: '28px', fontSize: '14px' },
    md: { width: '36px', height: '36px', fontSize: '18px' },
    lg: { width: '44px', height: '44px', fontSize: '22px' },
  },
};

export function ThemeToggle({ variant = 'switch', size = 'md', className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  if (variant === 'icon') {
    const iconStyle = { ...styles.icon.base, ...styles.icon[size] };
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={className}
        style={iconStyle}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    );
  }

  const switchStyle = { ...styles.switch.base, ...styles.switch[size] };
  const thumbStyle = {
    ...styles.switch.thumb,
    ...(theme === 'dark' ? styles.switch.thumbActive : {}),
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className}
      style={switchStyle}
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span style={thumbStyle} />
    </button>
  );
}
