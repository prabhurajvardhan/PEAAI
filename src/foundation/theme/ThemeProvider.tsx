/**
 * Theme Provider Component
 * Manages theme state and provides context to all children
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Theme, ThemeContextValue } from './types';
import { 
  getSystemPreference, 
  saveTheme, 
  STORAGE_KEY,
  DEFAULT_THEME 
} from './types';

// Create context with default values
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Provider props
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  onThemeChange?: (theme: Theme) => void;
}

export function ThemeProvider({
  children,
  defaultTheme,
  storageKey = STORAGE_KEY,
  onThemeChange,
}: ThemeProviderProps): JSX.Element {
  // Initialize theme state
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    }
    return defaultTheme || DEFAULT_THEME;
  });

  // Track system preference
  const [systemPreference, setSystemPreference] = useState<Theme>(getSystemPreference);

  // Check if using system preference (not manually set)
  const [isSystemPreference, setIsSystemPreference] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem(storageKey);
    }
    return true;
  });

  // Set theme function with side effects
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    setIsSystemPreference(false);
    saveTheme(newTheme);
    onThemeChange?.(newTheme);
  }, [onThemeChange]);

  // Toggle theme function
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, setTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newPreference = e.matches ? 'dark' : 'light';
      setSystemPreference(newPreference);
      
      // Only update theme if using system preference
      if (isSystemPreference) {
        setThemeState(newPreference);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isSystemPreference]);

  // Apply theme to document
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  }, [theme]);

  // Persist theme to storage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  // Context value
  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme,
    toggleTheme,
    systemPreference,
    isSystemPreference,
  }), [theme, setTheme, toggleTheme, systemPreference, isSystemPreference]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

// Hook to get only theme state (without setter functions)
export function useThemeState(): Theme {
  const { theme } = useTheme();
  return theme;
}

// Hook to check if dark mode is active
export function useIsDarkMode(): boolean {
  const { theme } = useTheme();
  return theme === 'dark';
}

export default ThemeProvider;
