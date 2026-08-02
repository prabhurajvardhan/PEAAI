/**
 * Pixel Color Engine Module
 * 
 * Exports the PixelColorEngine class implementing color manipulation
 * with palette support, interpolation, blending modes, and alpha compositing.
 */

export { PixelColorEngine, PALETTES } from './color';
export type {
  PaletteEntry,
  ColorPalette,
  InterpolationMode,
  ExtendedBlendMode,
  PorterDuffOperator,
  GradientStop,
  ColorConfig,
} from './color';
