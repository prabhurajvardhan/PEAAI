/**
 * Shadow system tokens for PEAAI design system
 * Elevation levels for depth perception
 */

export const shadows = {
  // No shadow
  none: 'none',

  // Elevation levels
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

  // Colored shadows for special effects
  primary: '0 4px 14px 0 rgb(14 165 233 / 0.37)',
  secondary: '0 4px 14px 0 rgb(168 85 247 / 0.37)',
  accent: '0 4px 14px 0 rgb(249 115 22 / 0.37)',
  success: '0 4px 14px 0 rgb(34 197 94 / 0.37)',
  error: '0 4px 14px 0 rgb(239 68 68 / 0.37)',
  warning: '0 4px 14px 0 rgb(234 179 8 / 0.37)',
} as const;

export type Shadow = typeof shadows;
export type ShadowKey = keyof typeof shadows;

// Elevation mapping for components
export const elevationLevels = {
  flat: shadows.none,
  raised: shadows.sm,
  floating: shadows.DEFAULT,
  elevated: shadows.md,
  overlay: shadows.lg,
  modal: shadows.xl,
} as const;

export type ElevationLevel = keyof typeof elevationLevels;
