/**
 * Theme Toggle Component
 * Toggle between light and dark themes
 */

import React, { useCallback } from 'react';
import { useTheme } from './ThemeProvider';
import type { Theme } from './types';

export interface ThemeToggleProps {
  /** Custom class name for the toggle button */
  className?: string;
  /** Size of the toggle icon */
  size?: 'sm' | 'md' | 'lg';
  /** Show label text */
  showLabel?: boolean;
  /** Use icons instead of toggle switch */
  useIcon?: boolean;
  /** Custom aria-label */
  ariaLabel?: string;
  /** onClick handler */
  onClick?: (theme: Theme) => void;
}

const sizeClasses = {
  sm: {
    button: 'theme-toggle-sm',
    icon: 'w-4 h-4',
    label: 'text-xs',
  },
  md: {
    button: 'theme-toggle-md',
    icon: 'w-5 h-5',
    label: 'text-sm',
  },
  lg: {
    button: 'theme-toggle-lg',
    icon: 'w-6 h-6',
    label: 'text-base',
  },
};

/**
 * Sun icon for light mode
 */
function SunIcon({ className }: { className?: string }): JSX.Element {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

/**
 * Moon icon for dark mode
 */
function MoonIcon({ className }: { className?: string }): JSX.Element {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/**
 * Theme toggle component
 */
export function ThemeToggle({
  className = '',
  size = 'md',
  showLabel = false,
  useIcon = false,
  ariaLabel,
  onClick,
}: ThemeToggleProps): JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const sizes = sizeClasses[size];

  const handleClick = useCallback(() => {
    toggleTheme();
    onClick?.(isDark ? 'light' : 'dark');
  }, [toggleTheme, isDark, onClick]);

  const toggleClasses = [
    'theme-toggle',
    sizes.button,
    useIcon ? 'theme-toggle-icon' : 'theme-toggle-switch',
    className,
  ].filter(Boolean).join(' ');

  const iconClasses = `${sizes.icon} transition-transform duration-300`;

  if (showLabel) {
    return (
      <button
        type="button"
        className={toggleClasses}
        onClick={handleClick}
        aria-label={ariaLabel || (isDark ? 'Switch to light mode' : 'Switch to dark mode')}
      >
        <span className={`${sizes.label} font-medium`}>
          {isDark ? 'Dark' : 'Light'}
        </span>
        <span className={`ml-2 ${isDark ? 'rotate-180' : ''}`} style={{ transition: 'transform 0.3s' }}>
          {isDark ? <MoonIcon className={iconClasses} /> : <SunIcon className={iconClasses} />}
        </span>
      </button>
    );
  }

  if (useIcon) {
    return (
      <button
        type="button"
        className={toggleClasses}
        onClick={handleClick}
        aria-label={ariaLabel || (isDark ? 'Switch to light mode' : 'Switch to dark mode')}
      >
        <span style={{ transition: 'transform 0.3s', transform: isDark ? 'rotate(0deg)' : 'rotate(180deg)' }}>
          {isDark ? <MoonIcon className={iconClasses} /> : <SunIcon className={iconClasses} />}
        </span>
      </button>
    );
  }

  // Toggle switch style
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      className={toggleClasses}
      onClick={handleClick}
      aria-label={ariaLabel || (isDark ? 'Switch to light mode' : 'Switch to dark mode')}
    >
      <span
        className="theme-toggle-track"
        style={{
          backgroundColor: isDark ? 'var(--color-primary-600)' : 'var(--color-neutral-300)',
        }}
      >
        <span
          className="theme-toggle-thumb"
          style={{
            transform: isDark ? 'translateX(100%)' : 'translateX(0)',
            backgroundColor: 'var(--color-white)',
          }}
        >
          {isDark ? (
            <MoonIcon className={`${sizes.icon} text-primary-600`} />
          ) : (
            <SunIcon className={`${sizes.icon} text-accent-500`} />
          )}
        </span>
      </span>
    </button>
  );
}

// CSS styles for the toggle component
export const themeToggleStyles = `
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  background: transparent;
  padding: var(--spacing-1);
  border-radius: var(--radius-full);
  transition: background-color var(--transition-duration-fast) var(--transition-timing-function-ease-in-out);
}

.theme-toggle:hover {
  background-color: var(--color-neutral-100);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

.theme-toggle-sm {
  padding: var(--spacing-0-5);
}

.theme-toggle-md {
  padding: var(--spacing-1);
}

.theme-toggle-lg {
  padding: var(--spacing-2);
}

.theme-toggle-switch {
  padding: 0;
}

.theme-toggle-track {
  position: relative;
  width: 3rem;
  height: 1.5rem;
  border-radius: var(--radius-full);
  transition: background-color var(--transition-duration-fast) var(--transition-timing-function-ease-in-out);
}

.theme-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(1.5rem - 4px);
  height: calc(1.5rem - 4px);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-duration-fast) var(--transition-timing-function-ease-in-out);
  box-shadow: var(--shadow-sm);
}

[data-theme="dark"] .theme-toggle:hover {
  background-color: var(--color-neutral-800);
}
`;

export default ThemeToggle;
