import '@testing-library/jest-dom';

// Mock CSS imports
vi.mock('*.css', () => ({}));

// Mock foundation components
vi.mock('../foundation/theme', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({ theme: 'light', toggleTheme: () => {}, setTheme: () => {} }),
}));

vi.mock('../foundation/components/toast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  useToast: () => ({ toasts: [], addToast: () => {}, removeToast: () => {} }),
}));

vi.mock('../foundation/components/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('../foundation/components/spinner', () => ({
  Spinner: () => null,
}));
