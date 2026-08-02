/**
 * Border radius tokens for PEAAI design system
 */

export const borderRadius = {
  // No radius
  none: '0',

  // Small radius
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px (also the default)

  // Medium radius
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px

  // Large radius
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px

  // Full radius
  full: '9999px',
} as const;

export const borderWidths = {
  0: '0',
  1: '1px',
  2: '2px',
  4: '4px',
  8: '8px',
} as const;

export const borderStyles = {
  solid: 'solid',
  dashed: 'dashed',
  dotted: 'dotted',
  double: 'double',
  groove: 'groove',
  ridge: 'ridge',
  inset: 'inset',
  outset: 'outset',
  hidden: 'hidden',
} as const;

export const borders = {
  radius: borderRadius,
  width: borderWidths,
  style: borderStyles,
} as const;

export type BorderRadius = typeof borderRadius;
export type BorderWidth = typeof borderWidths;
export type BorderStyle = typeof borderStyles;
export type BorderRadiusKey = keyof typeof borderRadius;
export type BorderWidthKey = keyof typeof borderWidths;

// Predefined border combinations
export const borderCombinations = {
  card: {
    radius: borderRadius.lg,
    width: borderWidths[1],
  },
  input: {
    radius: borderRadius.md,
    width: borderWidths[1],
  },
  button: {
    radius: borderRadius.md,
    width: borderWidths[1],
  },
  modal: {
    radius: borderRadius.xl,
    width: borderWidths[1],
  },
  avatar: {
    radius: borderRadius.full,
    width: borderWidths[1],
  },
} as const;

export type BorderCombination = keyof typeof borderCombinations;
