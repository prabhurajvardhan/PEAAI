// Border tokens for PEAAI Design System
export const borderWidths = {
  0: '0',
  1: '1px',
  2: '2px',
  4: '4px',
  8: '8px',
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

export type BorderWidthKey = keyof typeof borderWidths;
export type BorderRadiusKey = keyof typeof borderRadius;

export const borderTokens = {
  '--border-width': borderWidths[1],
  '--border-radius-sm': borderRadius.sm,
  '--border-radius': borderRadius.DEFAULT,
  '--border-radius-md': borderRadius.md,
  '--border-radius-lg': borderRadius.lg,
  '--border-radius-xl': borderRadius.xl,
  '--border-radius-2xl': borderRadius['2xl'],
  '--border-radius-full': borderRadius.full,
};
