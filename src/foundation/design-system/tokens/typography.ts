// Typography tokens for PEAAI Design System
export const fontFamilies = {
  sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
} as const;

export const fontSizes = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
} as const;

export const fontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeights = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const;

export const letterSpacings = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

export const typography = {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
} as const;

export const typographyTokens = {
  '--font-family-sans': fontFamilies.sans,
  '--font-family-mono': fontFamilies.mono,
  '--font-size-xs': fontSizes.xs,
  '--font-size-sm': fontSizes.sm,
  '--font-size-base': fontSizes.base,
  '--font-size-lg': fontSizes.lg,
  '--font-size-xl': fontSizes.xl,
  '--font-size-2xl': fontSizes['2xl'],
  '--font-size-3xl': fontSizes['3xl'],
  '--font-size-4xl': fontSizes['4xl'],
  '--font-weight-normal': fontWeights.normal,
  '--font-weight-medium': fontWeights.medium,
  '--font-weight-semibold': fontWeights.semibold,
  '--font-weight-bold': fontWeights.bold,
  '--line-height-none': lineHeights.none,
  '--line-height-tight': lineHeights.tight,
  '--line-height-normal': lineHeights.normal,
  '--line-height-relaxed': lineHeights.relaxed,
  '--letter-spacing-tight': letterSpacings.tight,
  '--letter-spacing-normal': letterSpacings.normal,
};
