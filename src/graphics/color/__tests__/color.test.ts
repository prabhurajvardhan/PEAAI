/**
 * Tests for Pixel Color Engine (T-018)
 */

import { PixelColorEngine, PALETTES } from '../color';

describe('Pixel Color Engine', () => {
  describe('PixelColorEngine', () => {
    let colorEngine: PixelColorEngine;

    beforeEach(() => {
      colorEngine = new PixelColorEngine();
    });

    describe('constructor', () => {
      it('should create with default config', () => {
        const ce = new PixelColorEngine();
        expect(ce).toBeDefined();
      });

      it('should create with custom config', () => {
        const ce = new PixelColorEngine({ paletteSize: 128 });
        expect(ce).toBeDefined();
      });
    });

    describe('palette operations', () => {
      it('should load predefined palette', () => {
        colorEngine.loadPalette('peaaiCompanion');
        const color = colorEngine.getPaletteColor(0);
        expect(color).toEqual({ r: 0, g: 0, b: 0, a: 255 });
      });

      it('should add color to palette', () => {
        colorEngine.addPaletteColor(100, { r: 255, g: 0, b: 0, a: 255 }, 'red');
        const color = colorEngine.getPaletteColor(100);
        expect(color).toEqual({ r: 255, g: 0, b: 0, a: 255 });
      });

      it('should get palette index for color', () => {
        colorEngine.addPaletteColor(5, { r: 100, g: 100, b: 100, a: 255 });
        const index = colorEngine.getPaletteIndex({ r: 100, g: 100, b: 100, a: 255 });
        expect(index).toBe(5);
      });

      it('should return undefined for unknown color index', () => {
        const color = colorEngine.getPaletteColor(999);
        expect(color).toBeUndefined();
      });

      it('should get all palette entries', () => {
        colorEngine.addPaletteColor(0, { r: 0, g: 0, b: 0, a: 255 });
        colorEngine.addPaletteColor(1, { r: 255, g: 255, b: 255, a: 255 });
        const entries = colorEngine.getPaletteEntries();
        expect(entries.length).toBe(2);
      });

      it('should clear palette', () => {
        colorEngine.loadPalette('peaaiCompanion');
        colorEngine.clearPalette();
        expect(colorEngine.getPaletteSize()).toBe(0);
      });
    });

    describe('color interpolation', () => {
      it('should interpolate linearly', () => {
        const c1 = { r: 0, g: 0, b: 0, a: 255 };
        const c2 = { r: 255, g: 255, b: 255, a: 255 };
        
        const result = colorEngine.interpolate(c1, c2, 0.5, 'linear');
        expect(result.r).toBeGreaterThanOrEqual(127);
        expect(result.r).toBeLessThanOrEqual(128);
        expect(result.g).toBeGreaterThanOrEqual(127);
        expect(result.g).toBeLessThanOrEqual(128);
        expect(result.b).toBeGreaterThanOrEqual(127);
        expect(result.b).toBeLessThanOrEqual(128);
      });

      it('should interpolate with ease-in', () => {
        const c1 = { r: 0, g: 0, b: 0, a: 255 };
        const c2 = { r: 255, g: 255, b: 255, a: 255 };
        
        const result = colorEngine.interpolate(c1, c2, 0.5, 'ease-in');
        expect(result.r).toBeLessThan(127);
      });

      it('should interpolate with ease-out', () => {
        const c1 = { r: 0, g: 0, b: 0, a: 255 };
        const c2 = { r: 255, g: 255, b: 255, a: 255 };
        
        const result = colorEngine.interpolate(c1, c2, 0.5, 'ease-out');
        expect(result.r).toBeGreaterThan(127);
      });

      it('should interpolate with ease-in-out', () => {
        const c1 = { r: 0, g: 0, b: 0, a: 255 };
        const c2 = { r: 255, g: 255, b: 255, a: 255 };
        
        const result = colorEngine.interpolate(c1, c2, 0.5, 'ease-in-out');
        expect(result.r).toBeGreaterThanOrEqual(127);
        expect(result.r).toBeLessThanOrEqual(128);
      });

      it('should clamp t value', () => {
        const c1 = { r: 0, g: 0, b: 0, a: 255 };
        const c2 = { r: 255, g: 255, b: 255, a: 255 };
        
        const result1 = colorEngine.interpolate(c1, c2, -0.5, 'linear');
        expect(result1).toEqual(c1);
        
        const result2 = colorEngine.interpolate(c1, c2, 1.5, 'linear');
        expect(result2).toEqual(c2);
      });
    });

    describe('gradient creation', () => {
      it('should create gradient with multiple stops', () => {
        const stops = [
          { position: 0, color: { r: 255, g: 0, b: 0, a: 255 } },
          { position: 0.5, color: { r: 0, g: 255, b: 0, a: 255 } },
          { position: 1, color: { r: 0, g: 0, b: 255, a: 255 } },
        ];
        
        const gradient = colorEngine.createGradient(stops, 5);
        expect(gradient.length).toBe(5);
        expect(gradient[0]).toEqual({ r: 255, g: 0, b: 0, a: 255 });
        expect(gradient[4]).toEqual({ r: 0, g: 0, b: 255, a: 255 });
      });

      it('should return empty array for no stops', () => {
        const gradient = colorEngine.createGradient([], 5);
        expect(gradient.length).toBe(0);
      });

      it('should return single color for single stop', () => {
        const stops = [
          { position: 0.5, color: { r: 128, g: 128, b: 128, a: 255 } },
        ];
        
        const gradient = colorEngine.createGradient(stops, 10);
        expect(gradient.length).toBe(10);
        expect(gradient[0]).toEqual({ r: 128, g: 128, b: 128, a: 255 });
      });
    });

    describe('blend modes', () => {
      it('should blend with replace mode', () => {
        const src = { r: 255, g: 0, b: 0, a: 255 };
        const dst = { r: 0, g: 255, b: 0, a: 255 };
        
        const result = colorEngine.blendColors(src, dst, 'replace');
        expect(result).toEqual(src);
      });

      it('should blend with alpha mode', () => {
        const src = { r: 255, g: 0, b: 0, a: 128 };
        const dst = { r: 0, g: 255, b: 0, a: 255 };
        
        const result = colorEngine.blendColors(src, dst, 'alpha');
        expect(result.r).toBeGreaterThan(0);
        expect(result.g).toBeGreaterThan(0);
      });

      it('should blend with multiply mode', () => {
        const src = { r: 128, g: 128, b: 128, a: 255 };
        const dst = { r: 128, g: 128, b: 128, a: 255 };
        
        const result = colorEngine.blendColors(src, dst, 'multiply');
        expect(result.r).toBe(64);
      });

      it('should blend with add mode', () => {
        const src = { r: 100, g: 100, b: 100, a: 255 };
        const dst = { r: 100, g: 100, b: 100, a: 255 };
        
        const result = colorEngine.blendColors(src, dst, 'add');
        expect(result).toEqual({ r: 200, g: 200, b: 200, a: 255 });
      });

      it('should blend with screen mode', () => {
        const src = { r: 255, g: 0, b: 0, a: 255 };
        const dst = { r: 0, g: 255, b: 0, a: 255 };
        
        const result = colorEngine.blendColors(src, dst, 'screen');
        expect(result.r).toBe(255);
        expect(result.g).toBe(255);
      });

      it('should blend with overlay mode', () => {
        const src = { r: 200, g: 200, b: 200, a: 255 };
        const dst = { r: 100, g: 100, b: 100, a: 255 };
        
        const result = colorEngine.blendColors(src, dst, 'overlay');
        expect(result.r).toBeGreaterThan(0);
      });

      it('should blend with darken mode', () => {
        const src = { r: 200, g: 100, b: 50, a: 255 };
        const dst = { r: 100, g: 150, b: 200, a: 255 };
        
        const result = colorEngine.blendColors(src, dst, 'darken');
        expect(result.r).toBe(100);
        expect(result.g).toBe(100);
        expect(result.b).toBe(50);
      });

      it('should blend with lighten mode', () => {
        const src = { r: 200, g: 100, b: 50, a: 255 };
        const dst = { r: 100, g: 150, b: 200, a: 255 };
        
        const result = colorEngine.blendColors(src, dst, 'lighten');
        expect(result.r).toBe(200);
        expect(result.g).toBe(150);
        expect(result.b).toBe(200);
      });

      it('should blend with difference mode', () => {
        const src = { r: 100, g: 100, b: 100, a: 255 };
        const dst = { r: 150, g: 150, b: 150, a: 255 };
        
        const result = colorEngine.blendColors(src, dst, 'difference');
        expect(result.r).toBe(50);
      });
    });

    describe('Porter-Duff compositing', () => {
      it('should composite with src-over', () => {
        const src = { r: 255, g: 0, b: 0, a: 255 };
        const dst = { r: 0, g: 0, b: 255, a: 255 };
        
        const result = colorEngine.composite(src, dst, 'src-over');
        expect(result.r).toBe(255);
        expect(result.a).toBe(255);
      });

      it('should composite with clear', () => {
        const src = { r: 255, g: 0, b: 0, a: 255 };
        const dst = { r: 0, g: 0, b: 255, a: 255 };
        
        const result = colorEngine.composite(src, dst, 'clear');
        expect(result).toEqual({ r: 0, g: 0, b: 0, a: 0 });
      });

      it('should composite with src', () => {
        const src = { r: 255, g: 0, b: 0, a: 255 };
        const dst = { r: 0, g: 0, b: 255, a: 255 };
        
        const result = colorEngine.composite(src, dst, 'src');
        expect(result).toEqual(src);
      });

      it('should composite with dst', () => {
        const src = { r: 255, g: 0, b: 0, a: 255 };
        const dst = { r: 0, g: 0, b: 255, a: 255 };
        
        const result = colorEngine.composite(src, dst, 'dst');
        expect(result).toEqual(dst);
      });

      it('should composite with src-in', () => {
        const src = { r: 255, g: 0, b: 0, a: 128 };
        const dst = { r: 0, g: 0, b: 255, a: 255 };
        
        const result = colorEngine.composite(src, dst, 'src-in');
        expect(result.a).toBeLessThan(255);
      });

      it('should composite with plus', () => {
        const src = { r: 100, g: 100, b: 100, a: 255 };
        const dst = { r: 100, g: 100, b: 100, a: 255 };
        
        const result = colorEngine.composite(src, dst, 'plus');
        expect(result).toEqual({ r: 200, g: 200, b: 200, a: 255 });
      });
    });

    describe('color conversion', () => {
      it('should convert HSL to RGB', () => {
        const color = colorEngine.hslToRgb(0, 1, 0.5, 255);
        expect(color).toEqual({ r: 255, g: 0, b: 0, a: 255 });
      });

      it('should convert HSL green', () => {
        const color = colorEngine.hslToRgb(120, 1, 0.5, 255);
        expect(color).toEqual({ r: 0, g: 255, b: 0, a: 255 });
      });

      it('should convert HSL blue', () => {
        const color = colorEngine.hslToRgb(240, 1, 0.5, 255);
        expect(color).toEqual({ r: 0, g: 0, b: 255, a: 255 });
      });

      it('should convert RGB to HSL', () => {
        const result = colorEngine.rgbToHsl({ r: 255, g: 0, b: 0, a: 255 });
        expect(result.h).toBe(0);
        expect(result.s).toBe(1);
        expect(result.l).toBeCloseTo(0.5);
      });

      it('should convert hex to RGB', () => {
        const color = colorEngine.hexToRgb('#FF0000', 255);
        expect(color).toEqual({ r: 255, g: 0, b: 0, a: 255 });
      });

      it('should convert hex with #', () => {
        const color = colorEngine.hexToRgb('#00FF00');
        expect(color).toEqual({ r: 0, g: 255, b: 0, a: 255 });
      });

      it('should return null for invalid hex', () => {
        const color = colorEngine.hexToRgb('invalid');
        expect(color).toBeNull();
      });

      it('should convert RGB to hex', () => {
        const hex = colorEngine.rgbToHex({ r: 255, g: 0, b: 0, a: 255 });
        expect(hex).toBe('#ff0000');
      });

      it('should convert white to hex', () => {
        const hex = colorEngine.rgbToHex({ r: 255, g: 255, b: 255, a: 255 });
        expect(hex).toBe('#ffffff');
      });
    });

    describe('color adjustments', () => {
      it('should lighten color', () => {
        const color = { r: 100, g: 100, b: 100, a: 255 };
        const result = colorEngine.lighten(color, 0.2);
        expect(result.r).toBeGreaterThan(100);
      });

      it('should darken color', () => {
        const color = { r: 200, g: 200, b: 200, a: 255 };
        const result = colorEngine.darken(color, 0.2);
        expect(result.r).toBeLessThan(200);
      });

      it('should saturate color', () => {
        const color = { r: 128, g: 128, b: 128, a: 255 };
        const result = colorEngine.saturate(color, 0.5);
        expect(result).toBeDefined();
      });

      it('should desaturate color', () => {
        const color = { r: 255, g: 0, b: 0, a: 255 };
        const result = colorEngine.desaturate(color, 0.5);
        expect(result).toBeDefined();
      });

      it('should check color equality', () => {
        const c1 = { r: 100, g: 100, b: 100, a: 255 };
        const c2 = { r: 100, g: 100, b: 100, a: 255 };
        const c3 = { r: 200, g: 100, b: 100, a: 255 };
        
        expect(colorEngine.colorsEqual(c1, c2)).toBe(true);
        expect(colorEngine.colorsEqual(c1, c3)).toBe(false);
      });
    });

    describe('predefined palettes', () => {
      it('should have classic16 palette', () => {
        expect(PALETTES.classic16.length).toBe(16);
        expect(PALETTES.classic16[0]).toEqual({ r: 0, g: 0, b: 0, a: 255 });
        expect(PALETTES.classic16[15]).toEqual({ r: 255, g: 255, b: 255, a: 255 });
      });

      it('should have grayscale256 palette', () => {
        expect(PALETTES.grayscale256.length).toBe(256);
        expect(PALETTES.grayscale256[0]).toEqual({ r: 0, g: 0, b: 0, a: 255 });
        expect(PALETTES.grayscale256[255]).toEqual({ r: 255, g: 255, b: 255, a: 255 });
      });

      it('should have peaaiCompanion palette', () => {
        expect(PALETTES.peaaiCompanion.length).toBe(12);
        expect(PALETTES.peaaiCompanion[0]).toEqual({ r: 0, g: 0, b: 0, a: 255 });
      });
    });

    describe('createPalette', () => {
      it('should create a custom palette', () => {
        const palette = colorEngine.createPalette('test', [
          { index: 0, color: { r: 0, g: 0, b: 0, a: 255 } },
          { index: 1, color: { r: 255, g: 255, b: 255, a: 255 } },
        ]);
        
        expect(palette.name).toBe('test');
        expect(palette.getColor(0)).toEqual({ r: 0, g: 0, b: 0, a: 255 });
        expect(palette.getColor(1)).toEqual({ r: 255, g: 255, b: 255, a: 255 });
      });

      it('should add entries to palette', () => {
        const palette = colorEngine.createPalette('test');
        palette.addEntry(5, { r: 128, g: 128, b: 128, a: 255 }, 'gray');
        
        expect(palette.getColor(5)).toEqual({ r: 128, g: 128, b: 128, a: 255 });
        expect(palette.getAllEntries().length).toBe(1);
      });

      it('should remove entries from palette', () => {
        const palette = colorEngine.createPalette('test', [
          { index: 0, color: { r: 0, g: 0, b: 0, a: 255 } },
        ]);
        palette.removeEntry(0);
        
        expect(palette.getColor(0)).toBeUndefined();
      });
    });
  });
});
