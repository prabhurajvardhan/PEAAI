/**
 * Theme types and definitions
 */

export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  systemPreference: Theme;
  isSystemPreference: boolean;
}

export const STORAGE_KEY = 'peaai-theme';

export const DEFAULT_THEME: Theme = 'light';

export const THEME_STORAGE_KEY = 'peaai-theme';

/**
 * Detect system color scheme preference
 */
export function getSystemPreference(): Theme {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }
  
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

/**
 * Get initial theme from storage or system preference
 */
export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return getSystemPreference();
}

/**
 * Persist theme to storage
 */
export function saveTheme(theme: Theme): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY, theme);
}
