/**
 * Pixel Color Engine - Color manipulation and compositing
 * 
 * Features:
 * - Color palette system with indexed colors
 * - Color interpolation (linear, bezier, cubic)
 * - Advanced blending modes
 * - Alpha compositing (Porter-Duff operators)
 */

import { IColor, BlendMode } from '../types';

/**
 * Color palette entry
 */
export interface PaletteEntry {
  index: number;
  name?: string;
  color: IColor;
}

/**
 * Color palette for indexed color operations
 */
export interface ColorPalette {
  name: string;
  entries: Map<number, PaletteEntry>;
  getColor(index: number): IColor | undefined;
  getIndex(color: IColor): number | undefined;
  addEntry(index: number, color: IColor, name?: string): void;
  removeEntry(index: number): void;
  getAllEntries(): PaletteEntry[];
}

/**
 * Interpolation mode for color gradients
 */
export type InterpolationMode = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bezier' | 'cubic';

/**
 * Blend mode with alpha compositing support
 */
export type ExtendedBlendMode = BlendMode | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'soft-light' | 'hard-light' | 'difference' | 'exclusion';

/**
 * Porter-Duff compositing operators
 */
export type PorterDuffOperator = 
  | 'clear'
  | 'src'
  | 'dst'
  | 'src-over'
  | 'dst-over'
  | 'src-in'
  | 'dst-in'
  | 'src-out'
  | 'dst-out'
  | 'src-atop'
  | 'dst-atop'
  | 'xor'
  | 'plus';

/**
 * Gradient stop for color interpolation
 */
export interface GradientStop {
  position: number; // 0-1
  color: IColor;
}

/**
 * Configuration for color operations
 */
export interface ColorConfig {
  paletteSize?: number;
  defaultPalette?: boolean;
  precision?: number;
}

const DEFAULT_CONFIG: Required<Omit<ColorConfig, 'defaultPalette'>> & { defaultPalette: boolean } = {
  paletteSize: 256,
  defaultPalette: false,
  precision: 1000,
};

/**
 * Predefined color palettes
 */
export const PALETTES = {
  /**
   * Classic 16-color palette (DOS/ANSI inspired)
   */
  classic16: [
    { r: 0, g: 0, b: 0, a: 255 },       // 0: Black
    { r: 128, g: 0, b: 0, a: 255 },      // 1: Maroon
    { r: 0, g: 128, b: 0, a: 255 },      // 2: Green
    { r: 128, g: 128, b: 0, a: 255 },    // 3: Olive
    { r: 0, g: 0, b: 128, a: 255 },      // 4: Navy
    { r: 128, g: 0, b: 128, a: 255 },    // 5: Purple
    { r: 0, g: 128, b: 128, a: 255 },    // 6: Teal
    { r: 192, g: 192, b: 192, a: 255 },  // 7: Silver
    { r: 128, g: 128, b: 128, a: 255 },  // 8: Gray
    { r: 255, g: 0, b: 0, a: 255 },      // 9: Red
    { r: 0, g: 255, b: 0, a: 255 },      // 10: Lime
    { r: 255, g: 255, b: 0, a: 255 },    // 11: Yellow
    { r: 0, g: 0, b: 255, a: 255 },      // 12: Blue
    { r: 255, g: 0, b: 255, a: 255 },    // 13: Fuchsia
    { r: 0, g: 255, b: 255, a: 255 },    // 14: Aqua
    { r: 255, g: 255, b: 255, a: 255 },  // 15: White
  ],

  /**
   * 256-color grayscale palette
   */
  grayscale256: Array.from({ length: 256 }, (_, i) => ({
    r: i,
    g: i,
    b: i,
    a: 255,
  })),

  /**
   * PEAAI companion palette (optimized for pixel art)
   */
  peaaiCompanion: [
    { r: 0, g: 0, b: 0, a: 255 },         // 0: Transparent/Black
    { r: 255, g: 255, b: 255, a: 255 },   // 1: White (eyes, highlights)
    { r: 230, g: 230, b: 230, a: 255 },   // 2: Light gray (face base)
    { r: 180, g: 180, b: 180, a: 255 },  // 3: Medium gray (shadows)
    { r: 100, g: 100, b: 100, a: 255 },  // 4: Dark gray (deep shadows)
    { r: 255, g: 180, b: 180, a: 255 },  // 5: Light pink (blush)
    { r: 255, g: 100, b: 100, a: 255 },   // 6: Red (mouth, excited)
    { r: 255, g: 200, b: 100, a: 255 },  // 7: Orange (warm accent)
    { r: 255, g: 220, b: 50, a: 255 },   // 8: Yellow (happy)
    { r: 100, g: 255, b: 100, a: 255 },  // 9: Green (health/growth)
    { r: 100, g: 200, b: 255, a: 255 },  // 10: Sky blue (calm)
    { r: 50, g: 100, b: 255, a: 255 },   // 11: Blue (sad/cool)
  ],
};

/**
 * Pixel Color Engine
 * 
 * Provides color manipulation capabilities:
 * - Palette management
 * - Color interpolation for gradients
 * - Advanced blending modes
 * - Alpha compositing with Porter-Duff operators
 */
export class PixelColorEngine {
  private palette: Map<number, PaletteEntry>;
  private config: Required<ColorConfig>;
  private precision: number;

  constructor(config: ColorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.palette = new Map();
    this.precision = this.config.precision;

    if (config.defaultPalette) {
      this.loadPalette('peaaiCompanion');
    }
  }

  /**
   * Load a predefined palette
   */
  loadPalette(name: keyof typeof PALETTES): void {
    const colors = PALETTES[name];
    if (colors) {
      this.palette.clear();
      colors.forEach((color, index) => {
        this.palette.set(index, { index, color, name: `color_${index}` });
      });
    }
  }

  /**
   * Create a color palette
   */
  createPalette(name: string, entries?: PaletteEntry[]): ColorPalette {
    const paletteMap = new Map<number, PaletteEntry>();
    
    if (entries) {
      for (const entry of entries) {
        paletteMap.set(entry.index, entry);
      }
    }

    const palette: ColorPalette = {
      name,
      entries: paletteMap,
      getColor: (index: number) => paletteMap.get(index)?.color,
      getIndex: (color: IColor) => {
        for (const [index, entry] of paletteMap) {
          if (this.colorsEqual(entry.color, color)) {
            return index;
          }
        }
        return undefined;
      },
      addEntry: (index: number, color: IColor, entryName?: string) => {
        paletteMap.set(index, { index, color, name: entryName });
      },
      removeEntry: (index: number) => {
        paletteMap.delete(index);
      },
      getAllEntries: () => Array.from(paletteMap.values()),
    };

    return palette;
  }

  /**
   * Get color from palette by index
   */
  getPaletteColor(index: number): IColor | undefined {
    return this.palette.get(index)?.color;
  }

  /**
   * Get palette index for a color
   */
  getPaletteIndex(color: IColor): number | undefined {
    for (const [index, entry] of this.palette) {
      if (this.colorsEqual(entry.color, color)) {
        return index;
      }
    }
    return undefined;
  }

  /**
   * Add color to palette
   */
  addPaletteColor(index: number, color: IColor, name?: string): void {
    this.palette.set(index, { index, color, name });
  }

  /**
   * Interpolate between two colors
   */
  interpolate(color1: IColor, color2: IColor, t: number, mode: InterpolationMode = 'linear'): IColor {
    const clampedT = Math.max(0, Math.min(1, t));
    
    switch (mode) {
      case 'linear':
        return this.lerpColor(color1, color2, clampedT);
      
      case 'ease-in':
        return this.lerpColor(color1, color2, this.easeIn(clampedT));
      
      case 'ease-out':
        return this.lerpColor(color1, color2, this.easeOut(clampedT));
      
      case 'ease-in-out':
        return this.lerpColor(color1, color2, this.easeInOut(clampedT));
      
      case 'bezier':
        return this.bezierColor(color1, color2, clampedT);
      
      case 'cubic':
        return this.cubicColor(color1, color2, clampedT);
      
      default:
        return this.lerpColor(color1, color2, clampedT);
    }
  }

  /**
   * Linear interpolation between two colors
   */
  private lerpColor(c1: IColor, c2: IColor, t: number): IColor {
    return {
      r: Math.round(c1.r + (c2.r - c1.r) * t),
      g: Math.round(c1.g + (c2.g - c1.g) * t),
      b: Math.round(c1.b + (c2.b - c1.b) * t),
      a: Math.round(c1.a + (c2.a - c1.a) * t),
    };
  }

  /**
   * Bezier-style interpolation
   */
  private bezierColor(c1: IColor, c2: IColor, t: number): IColor {
    // Simple cubic bezier approximation
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    
    // P0=start, P1=start (control), P2=end (control), P3=end
    const factor = mt3 + 3 * mt2 * t + 3 * mt * t2;
    
    return {
      r: Math.round(c1.r + (c2.r - c1.r) * factor),
      g: Math.round(c1.g + (c2.g - c1.g) * factor),
      b: Math.round(c1.b + (c2.b - c1.b) * factor),
      a: Math.round(c1.a + (c2.a - c1.a) * factor),
    };
  }

  /**
   * Cubic interpolation with overshoot
   */
  private cubicColor(c1: IColor, c2: IColor, t: number): IColor {
    // Cubic ease with slight overshoot
    const t2 = t * t;
    const t3 = t2 * t;
    const factor = t3 * (6) - 15 * t2 + 10 * t;
    
    return {
      r: Math.round(c1.r + (c2.r - c1.r) * factor),
      g: Math.round(c1.g + (c2.g - c1.g) * factor),
      b: Math.round(c1.b + (c2.b - c1.b) * factor),
      a: Math.round(c1.a + (c2.a - c1.a) * factor),
    };
  }

  /**
   * Create a gradient between multiple colors
   */
  createGradient(stops: GradientStop[], samples: number): IColor[] {
    if (stops.length === 0) return [];
    if (stops.length === 1) return Array(samples).fill(stops[0].color);

    // Sort stops by position
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    
    // Ensure first stop is at 0 and last at 1
    if (sortedStops[0].position > 0) {
      sortedStops.unshift({ position: 0, color: sortedStops[0].color });
    }
    if (sortedStops[sortedStops.length - 1].position < 1) {
      sortedStops.push({ position: 1, color: sortedStops[sortedStops.length - 1].color });
    }

    const result: IColor[] = [];
    
    for (let i = 0; i < samples; i++) {
      const t = i / (samples - 1);
      
      // Find surrounding stops
      let lowerStop = sortedStops[0];
      let upperStop = sortedStops[sortedStops.length - 1];
      
      for (let j = 0; j < sortedStops.length - 1; j++) {
        if (t >= sortedStops[j].position && t <= sortedStops[j + 1].position) {
          lowerStop = sortedStops[j];
          upperStop = sortedStops[j + 1];
          break;
        }
      }

      // Interpolate between surrounding stops
      const localT = lowerStop.position === upperStop.position 
        ? 0 
        : (t - lowerStop.position) / (upperStop.position - lowerStop.position);
      
      result.push(this.interpolate(lowerStop.color, upperStop.color, localT));
    }

    return result;
  }

  /**
   * Blend two colors using extended blend modes
   */
  blendColors(src: IColor, dst: IColor, mode: ExtendedBlendMode): IColor {
    switch (mode) {
      case 'replace':
        return { ...src };
      
      case 'alpha':
        return this.alphaBlend(src, dst);
      
      case 'add':
        return this.addBlend(src, dst);
      
      case 'multiply':
        return this.multiplyBlend(src, dst);
      
      case 'screen':
        return this.screenBlend(src, dst);
      
      case 'overlay':
        return this.overlayBlend(src, dst);
      
      case 'darken':
        return this.darkenBlend(src, dst);
      
      case 'lighten':
        return this.lightenBlend(src, dst);
      
      case 'color-dodge':
        return this.colorDodgeBlend(src, dst);
      
      case 'color-burn':
        return this.colorBurnBlend(src, dst);
      
      case 'soft-light':
        return this.softLightBlend(src, dst);
      
      case 'hard-light':
        return this.hardLightBlend(src, dst);
      
      case 'difference':
        return this.differenceBlend(src, dst);
      
      case 'exclusion':
        return this.exclusionBlend(src, dst);
      
      default:
        return this.alphaBlend(src, dst);
    }
  }

  /**
   * Alpha blending (standard over operator)
   */
  alphaBlend(src: IColor, dst: IColor): IColor {
    const alphaSrc = src.a / 255;
    const alphaDst = dst.a / 255;
    const outAlpha = alphaSrc + alphaDst * (1 - alphaSrc);
    
    if (outAlpha === 0) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }

    return {
      r: Math.round((src.r * alphaSrc + dst.r * alphaDst * (1 - alphaSrc)) / outAlpha),
      g: Math.round((src.g * alphaSrc + dst.g * alphaDst * (1 - alphaSrc)) / outAlpha),
      b: Math.round((src.b * alphaSrc + dst.b * alphaDst * (1 - alphaSrc)) / outAlpha),
      a: Math.round(outAlpha * 255),
    };
  }

  /**
   * Additive blending
   */
  private addBlend(src: IColor, dst: IColor): IColor {
    return {
      r: Math.min(255, src.r + dst.r),
      g: Math.min(255, src.g + dst.g),
      b: Math.min(255, src.b + dst.b),
      a: Math.min(255, src.a + dst.a),
    };
  }

  /**
   * Multiply blending
   */
  private multiplyBlend(src: IColor, dst: IColor): IColor {
    const aSrc = src.a / 255;
    const aDst = dst.a / 255;
    
    return {
      r: Math.round((src.r * dst.r) / 255),
      g: Math.round((src.g * dst.g) / 255),
      b: Math.round((src.b * dst.b) / 255),
      a: Math.round((aSrc * aDst) * 255),
    };
  }

  /**
   * Screen blending
   */
  private screenBlend(src: IColor, dst: IColor): IColor {
    return {
      r: Math.round(255 - (255 - src.r) * (255 - dst.r) / 255),
      g: Math.round(255 - (255 - src.g) * (255 - dst.g) / 255),
      b: Math.round(255 - (255 - src.b) * (255 - dst.b) / 255),
      a: Math.round(Math.max(src.a, dst.a)),
    };
  }

  /**
   * Overlay blending
   */
  private overlayBlend(src: IColor, dst: IColor): IColor {
    const r = dst.r < 128 
      ? 2 * src.r * dst.r / 255 
      : 255 - 2 * (255 - src.r) * (255 - dst.r) / 255;
    const g = dst.g < 128 
      ? 2 * src.g * dst.g / 255 
      : 255 - 2 * (255 - src.g) * (255 - dst.g) / 255;
    const b = dst.b < 128 
      ? 2 * src.b * dst.b / 255 
      : 255 - 2 * (255 - src.b) * (255 - dst.b) / 255;
    
    return {
      r: Math.round(Math.max(0, Math.min(255, r))),
      g: Math.round(Math.max(0, Math.min(255, g))),
      b: Math.round(Math.max(0, Math.min(255, b))),
      a: Math.round(Math.max(src.a, dst.a)),
    };
  }

  /**
   * Darken blending
   */
  private darkenBlend(src: IColor, dst: IColor): IColor {
    return {
      r: Math.min(src.r, dst.r),
      g: Math.min(src.g, dst.g),
      b: Math.min(src.b, dst.b),
      a: Math.round(Math.max(src.a, dst.a)),
    };
  }

  /**
   * Lighten blending
   */
  private lightenBlend(src: IColor, dst: IColor): IColor {
    return {
      r: Math.max(src.r, dst.r),
      g: Math.max(src.g, dst.g),
      b: Math.max(src.b, dst.b),
      a: Math.round(Math.max(src.a, dst.a)),
    };
  }

  /**
   * Color dodge blending
   */
  private colorDodgeBlend(src: IColor, dst: IColor): IColor {
    return {
      r: dst.r === 255 ? 255 : Math.min(255, (src.r * 255) / (255 - dst.r)),
      g: dst.g === 255 ? 255 : Math.min(255, (src.g * 255) / (255 - dst.g)),
      b: dst.b === 255 ? 255 : Math.min(255, (src.b * 255) / (255 - dst.b)),
      a: Math.round(Math.max(src.a, dst.a)),
    };
  }

  /**
   * Color burn blending
   */
  private colorBurnBlend(src: IColor, dst: IColor): IColor {
    return {
      r: dst.r === 0 ? 0 : Math.max(0, 255 - (255 - src.r) * 255 / dst.r),
      g: dst.g === 0 ? 0 : Math.max(0, 255 - (255 - src.g) * 255 / dst.g),
      b: dst.b === 0 ? 0 : Math.max(0, 255 - (255 - src.b) * 255 / dst.b),
      a: Math.round(Math.max(src.a, dst.a)),
    };
  }

  /**
   * Soft light blending
   */
  private softLightBlend(src: IColor, dst: IColor): IColor {
    const r = (1 - 2 * src.r / 255) * dst.r * dst.r / 255 + 2 * src.r / 255 * dst.r;
    const g = (1 - 2 * src.g / 255) * dst.g * dst.g / 255 + 2 * src.g / 255 * dst.g;
    const b = (1 - 2 * src.b / 255) * dst.b * dst.b / 255 + 2 * src.b / 255 * dst.b;
    
    return {
      r: Math.round(Math.max(0, Math.min(255, r))),
      g: Math.round(Math.max(0, Math.min(255, g))),
      b: Math.round(Math.max(0, Math.min(255, b))),
      a: Math.round(Math.max(src.a, dst.a)),
    };
  }

  /**
   * Hard light blending
   */
  private hardLightBlend(src: IColor, dst: IColor): IColor {
    const r = dst.r < 128 
      ? 2 * src.r * dst.r / 255 
      : 255 - 2 * (255 - src.r) * (255 - dst.r) / 255;
    const g = dst.g < 128 
      ? 2 * src.g * dst.g / 255 
      : 255 - 2 * (255 - src.g) * (255 - dst.g) / 255;
    const b = dst.b < 128 
      ? 2 * src.b * dst.b / 255 
      : 255 - 2 * (255 - src.b) * (255 - dst.b) / 255;
    
    return {
      r: Math.round(Math.max(0, Math.min(255, r))),
      g: Math.round(Math.max(0, Math.min(255, g))),
      b: Math.round(Math.max(0, Math.min(255, b))),
      a: Math.round(Math.max(src.a, dst.a)),
    };
  }

  /**
   * Difference blending
   */
  private differenceBlend(src: IColor, dst: IColor): IColor {
    return {
      r: Math.abs(src.r - dst.r),
      g: Math.abs(src.g - dst.g),
      b: Math.abs(src.b - dst.b),
      a: Math.round(Math.max(src.a, dst.a)),
    };
  }

  /**
   * Exclusion blending
   */
  private exclusionBlend(src: IColor, dst: IColor): IColor {
    return {
      r: Math.round(src.r + dst.r - 2 * src.r * dst.r / 255),
      g: Math.round(src.g + dst.g - 2 * src.g * dst.g / 255),
      b: Math.round(src.b + dst.b - 2 * src.b * dst.b / 255),
      a: Math.round(Math.max(src.a, dst.a)),
    };
  }

  /**
   * Porter-Duff compositing operation
   */
  composite(src: IColor, dst: IColor, operator: PorterDuffOperator): IColor {
    const a = src.a / 255;
    const b = dst.a / 255;

    switch (operator) {
      case 'clear':
        return { r: 0, g: 0, b: 0, a: 0 };
      
      case 'src':
        return { ...src };
      
      case 'dst':
        return { ...dst };
      
      case 'src-over':
        return {
          r: Math.round(src.r * a + dst.r * b * (1 - a)),
          g: Math.round(src.g * a + dst.g * b * (1 - a)),
          b: Math.round(src.b * a + dst.b * b * (1 - a)),
          a: Math.round((a + b * (1 - a)) * 255),
        };
      
      case 'dst-over':
        return {
          r: Math.round(src.r * a * (1 - b) + dst.r * b),
          g: Math.round(src.g * a * (1 - b) + dst.g * b),
          b: Math.round(src.b * a * (1 - b) + dst.b * b),
          a: Math.round((a * (1 - b) + b) * 255),
        };
      
      case 'src-in':
        return {
          r: src.r,
          g: src.g,
          b: src.b,
          a: Math.round(a * b * 255),
        };
      
      case 'dst-in':
        return {
          r: dst.r,
          g: dst.g,
          b: dst.b,
          a: Math.round(a * b * 255),
        };
      
      case 'src-out':
        return {
          r: src.r,
          g: src.g,
          b: src.b,
          a: Math.round(a * (1 - b) * 255),
        };
      
      case 'dst-out':
        return {
          r: dst.r,
          g: dst.g,
          b: dst.b,
          a: Math.round(b * (1 - a) * 255),
        };
      
      case 'src-atop':
        return {
          r: Math.round(src.r * a + dst.r * b * (1 - a)),
          g: Math.round(src.g * a + dst.g * b * (1 - a)),
          b: Math.round(src.b * a + dst.b * b * (1 - a)),
          a: Math.round(b * 255),
        };
      
      case 'dst-atop':
        return {
          r: Math.round(src.r * a * (1 - b) + dst.r * b),
          g: Math.round(src.g * a * (1 - b) + dst.g * b),
          b: Math.round(src.b * a * (1 - b) + dst.b * b),
          a: Math.round(a * 255),
        };
      
      case 'xor':
        return {
          r: Math.round(src.r * a * (1 - b) + dst.r * b * (1 - a)),
          g: Math.round(src.g * a * (1 - b) + dst.g * b * (1 - a)),
          b: Math.round(src.b * a * (1 - b) + dst.b * b * (1 - a)),
          a: Math.round((a * (1 - b) + b * (1 - a)) * 255),
        };
      
      case 'plus':
        return {
          r: Math.min(255, src.r + dst.r),
          g: Math.min(255, src.g + dst.g),
          b: Math.min(255, src.b + dst.b),
          a: Math.min(255, src.a + dst.a),
        };
      
      default:
        return this.alphaBlend(src, dst);
    }
  }

  /**
   * Convert HSL to RGB
   */
  hslToRgb(h: number, s: number, l: number, a: number = 255): IColor {
    h = h % 360;
    if (h < 0) h += 360;
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0, Math.min(1, l));

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (h < 60) {
      r = c; g = x; b = 0;
    } else if (h < 120) {
      r = x; g = c; b = 0;
    } else if (h < 180) {
      r = 0; g = c; b = x;
    } else if (h < 240) {
      r = 0; g = x; b = c;
    } else if (h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
      a,
    };
  }

  /**
   * Convert RGB to HSL
   */
  rgbToHsl(color: IColor): { h: number; s: number; l: number; a: number } {
    const r = color.r / 255;
    const g = color.g / 255;
    const b = color.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    if (max === min) {
      return { h: 0, s: 0, l, a: color.a };
    }

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    let h = 0;
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }

    return { h, s, l, a: color.a };
  }

  /**
   * Convert hex color to IColor
   */
  hexToRgb(hex: string, alpha: number = 255): IColor | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: alpha,
      };
    }
    return null;
  }

  /**
   * Convert IColor to hex string
   */
  rgbToHex(color: IColor): string {
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }

  /**
   * Lighten a color
   */
  lighten(color: IColor, amount: number): IColor {
    const hsl = this.rgbToHsl(color);
    hsl.l = Math.min(1, hsl.l + amount);
    return this.hslToRgb(hsl.h, hsl.s, hsl.l, hsl.a);
  }

  /**
   * Darken a color
   */
  darken(color: IColor, amount: number): IColor {
    const hsl = this.rgbToHsl(color);
    hsl.l = Math.max(0, hsl.l - amount);
    return this.hslToRgb(hsl.h, hsl.s, hsl.l, hsl.a);
  }

  /**
   * Saturate a color
   */
  saturate(color: IColor, amount: number): IColor {
    const hsl = this.rgbToHsl(color);
    hsl.s = Math.max(0, Math.min(1, hsl.s + amount));
    return this.hslToRgb(hsl.h, hsl.s, hsl.l, hsl.a);
  }

  /**
   * Desaturate a color
   */
  desaturate(color: IColor, amount: number): IColor {
    const hsl = this.rgbToHsl(color);
    hsl.s = Math.max(0, hsl.s - amount);
    return this.hslToRgb(hsl.h, hsl.s, hsl.l, hsl.a);
  }

  /**
   * Check if two colors are equal
   */
  colorsEqual(c1: IColor, c2: IColor): boolean {
    return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b && c1.a === c2.a;
  }

  // Easing functions
  private easeIn(t: number): number {
    return t * t;
  }

  private easeOut(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  /**
   * Get palette entries
   */
  getPaletteEntries(): PaletteEntry[] {
    return Array.from(this.palette.values());
  }

  /**
   * Clear palette
   */
  clearPalette(): void {
    this.palette.clear();
  }

  /**
   * Get palette size
   */
  getPaletteSize(): number {
    return this.palette.size;
  }
}

export { PixelColorEngine as default };
