/**
 * Typography tokens for PEAAI design system
 */

export const fontFamilies = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  display: "'Space Grotesk', var(--font-family-sans)",
} as const;

export const fontSizes = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
  '6xl': '3.75rem', // 60px
  '7xl': '4.5rem',  // 72px
} as const;

export const fontWeights = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
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

// Typography scale for headings
export const headingScale = {
  h1: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.tight,
  },
  h2: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.tight,
  },
  h3: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacings.normal,
  },
  h4: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacings.normal,
  },
  h5: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  h6: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
} as const;

// Body text styles
export const bodyScale = {
  lg: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.relaxed,
  },
  base: {
    fontSize: fontSizes.base,
    lineHeight: lineHeights.normal,
  },
  sm: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.normal,
  },
  xs: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.normal,
  },
} as const;

// Caption styles
export const captionScale = {
  default: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },
  legal: {
    fontSize: '0.625rem',
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },
} as const;

export type Typography = typeof typography;
export type HeadingVariant = keyof typeof headingScale;
export type BodyVariant = keyof typeof bodyScale;
export type CaptionVariant = keyof typeof captionScale;
