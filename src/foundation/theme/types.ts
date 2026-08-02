export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export interface ThemeToggleProps {
  variant?: 'switch' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
