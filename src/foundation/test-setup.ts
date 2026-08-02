import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom';
import '@testing-library/jest-dom';

// Extend expect with jest-dom matchers
expect.extend(matchers as any);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Add custom CSS styles for tests
const style = document.createElement('style');
style.textContent = `
  /* Design System CSS Variables for tests */
  :root {
    --color-primary-50: #f0f9ff;
    --color-primary-100: #e0f2fe;
    --color-primary-200: #bae6fd;
    --color-primary-300: #7dd3fc;
    --color-primary-400: #38bdf8;
    --color-primary-500: #0ea5e9;
    --color-primary-600: #0284c7;
    --color-primary-700: #0369a1;
    --color-primary-800: #075985;
    --color-primary-900: #0c4a6e;
    --color-primary-950: #082f49;
    
    --color-secondary-50: #faf5ff;
    --color-secondary-100: #f3e8ff;
    --color-secondary-200: #e9d5ff;
    --color-secondary-300: #d8b4fe;
    --color-secondary-400: #c084fc;
    --color-secondary-500: #a855f7;
    --color-secondary-600: #9333ea;
    --color-secondary-700: #7c3aed;
    --color-secondary-800: #6b21a8;
    --color-secondary-900: #581c87;
    --color-secondary-950: #3b0764;
    
    --color-accent-50: #fff7ed;
    --color-accent-100: #ffedd5;
    --color-accent-200: #fed7aa;
    --color-accent-300: #fdba74;
    --color-accent-400: #fb923c;
    --color-accent-500: #f97316;
    --color-accent-600: #ea580c;
    --color-accent-700: #c2410c;
    --color-accent-800: #9a3412;
    --color-accent-900: #7c2d12;
    --color-accent-950: #431407;
    
    --color-neutral-50: #fafafa;
    --color-neutral-100: #f5f5f5;
    --color-neutral-200: #e5e5e5;
    --color-neutral-300: #d4d4d4;
    --color-neutral-400: #a3a3a3;
    --color-neutral-500: #737373;
    --color-neutral-600: #525252;
    --color-neutral-700: #404040;
    --color-neutral-800: #262626;
    --color-neutral-900: #171717;
    --color-neutral-950: #0a0a0a;
    
    --color-success: #22c55e;
    --color-warning: #eab308;
    --color-error: #ef4444;
    --color-info: #3b82f6;
    
    --color-white: #ffffff;
    --color-black: #000000;
    
    --color-background: var(--color-white);
    --color-foreground: var(--color-neutral-900);
    --color-surface: var(--color-neutral-50);
    --color-surface-elevated: var(--color-white);
    --color-border: var(--color-neutral-200);
    --color-border-muted: var(--color-neutral-100);
    --color-muted: var(--color-neutral-500);
    --color-muted-foreground: var(--color-neutral-400);
    --color-input-background: var(--color-white);
    --color-input-border: var(--color-neutral-300);
    --color-input-focus-ring: var(--color-primary-500);
    --color-placeholder: var(--color-neutral-400);
    --color-disabled: var(--color-neutral-200);
    --color-disabled-foreground: var(--color-neutral-400);
    
    --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-family-mono: 'JetBrains Mono', monospace;
    --font-family-display: 'Space Grotesk', var(--font-family-sans);
    
    --font-size-xs: 0.75rem;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
    --font-size-2xl: 1.5rem;
    --font-size-3xl: 1.875rem;
    --font-size-4xl: 2.25rem;
    --font-size-5xl: 3rem;
    --font-size-6xl: 3.75rem;
    --font-size-7xl: 4.5rem;
    
    --font-weight-thin: 100;
    --font-weight-extralight: 200;
    --font-weight-light: 300;
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    --font-weight-extrabold: 800;
    --font-weight-black: 900;
    
    --line-height-none: 1;
    --line-height-tight: 1.25;
    --line-height-snug: 1.375;
    --line-height-normal: 1.5;
    --line-height-relaxed: 1.625;
    --line-height-loose: 2;
    
    --letter-spacing-tighter: -0.05em;
    --letter-spacing-tight: -0.025em;
    --letter-spacing-normal: 0em;
    --letter-spacing-wide: 0.025em;
    --letter-spacing-wider: 0.05em;
    --letter-spacing-widest: 0.1em;
    
    --spacing-0: 0;
    --spacing-px: 1px;
    --spacing-0-5: 0.125rem;
    --spacing-1: 0.25rem;
    --spacing-1-5: 0.375rem;
    --spacing-2: 0.5rem;
    --spacing-2-5: 0.625rem;
    --spacing-3: 0.75rem;
    --spacing-3-5: 0.875rem;
    --spacing-4: 1rem;
    --spacing-5: 1.25rem;
    --spacing-6: 1.5rem;
    --spacing-7: 1.75rem;
    --spacing-8: 2rem;
    --spacing-9: 2.25rem;
    --spacing-10: 2.5rem;
    --spacing-11: 2.75rem;
    --spacing-12: 3rem;
    --spacing-14: 3.5rem;
    --spacing-16: 4rem;
    --spacing-20: 5rem;
    --spacing-24: 6rem;
    --spacing-28: 7rem;
    --spacing-32: 8rem;
    --spacing-36: 9rem;
    --spacing-40: 10rem;
    --spacing-44: 11rem;
    --spacing-48: 12rem;
    --spacing-52: 13rem;
    --spacing-56: 14rem;
    --spacing-60: 15rem;
    --spacing-64: 16rem;
    --spacing-72: 18rem;
    --spacing-80: 20rem;
    --spacing-96: 24rem;
    
    --shadow-none: none;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-default: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
    --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
    
    --shadow-primary: 0 4px 14px 0 rgb(14 165 233 / 0.37);
    --shadow-secondary: 0 4px 14px 0 rgb(168 85 247 / 0.37);
    --shadow-accent: 0 4px 14px 0 rgb(249 115 22 / 0.37);
    --shadow-success: 0 4px 14px 0 rgb(34 197 94 / 0.37);
    --shadow-error: 0 4px 14px 0 rgb(239 68 68 / 0.37);
    --shadow-warning: 0 4px 14px 0 rgb(234 179 8 / 0.37);
    
    --radius-none: 0;
    --radius-sm: 0.125rem;
    --radius-default: 0.25rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;
    --radius-xl: 0.75rem;
    --radius-2xl: 1rem;
    --radius-3xl: 1.5rem;
    --radius-full: 9999px;
    
    --border-width-0: 0;
    --border-width-1: 1px;
    --border-width-2: 2px;
    --border-width-4: 4px;
    --border-width-8: 8px;
    
    --transition-duration-fast: 150ms;
    --transition-duration-normal: 250ms;
    --transition-duration-slow: 350ms;
    --transition-duration-slower: 500ms;
    
    --transition-timing-function-ease-in: cubic-bezier(0.4, 0, 1, 1);
    --transition-timing-function-ease-out: cubic-bezier(0, 0, 0.2, 1);
    --transition-timing-function-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
    --transition-timing-function-linear: cubic-bezier(0, 0, 1, 1);
    
    --z-index-dropdown: 1000;
    --z-index-sticky: 1020;
    --z-index-fixed: 1030;
    --z-index-modal-backdrop: 1040;
    --z-index-modal: 1050;
    --z-index-popover: 1060;
    --z-index-tooltip: 1070;
  }
`;
document.head.appendChild(style);
