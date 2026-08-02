/**
 * PEAAI Theme System
 * Light/dark mode theming with system preference support
 */

// Main exports
export { ThemeProvider, useTheme, useThemeState, useIsDarkMode } from './ThemeProvider';
export { ThemeToggle, themeToggleStyles, type ThemeToggleProps } from './ThemeToggle';

// Types
export type { Theme, ThemeContextValue } from './types';
export { 
  getSystemPreference, 
  getInitialTheme, 
  saveTheme, 
  STORAGE_KEY, 
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
} from './types';
