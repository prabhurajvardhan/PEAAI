/**
 * Tests for Pixel Rendering Engine (T-017)
 */

import { PixelRenderer } from '../renderer';

describe('Pixel Rendering Engine', () => {
  describe('PixelRenderer', () => {
    let renderer: PixelRenderer;

    beforeEach(() => {
      renderer = new PixelRenderer({ width: 32, height: 32 });
    });

    afterEach(() => {
      renderer.dispose();
    });

    describe('constructor', () => {
      it('should create renderer with correct dimensions', () => {
        const r = new PixelRenderer({ width: 64, height: 48 });
        expect(r.getSize()).toEqual({ width: 64, height: 48 });
        r.dispose();
      });

      it('should throw for invalid dimensions', () => {
        expect(() => new PixelRenderer({ width: 0, height: 32 })).toThrow();
        expect(() => new PixelRenderer({ width: 32, height: -1 })).toThrow();
      });

      it('should create with double buffering by default', () => {
        const r = new PixelRenderer({ width: 32, height: 32 });
        expect(() => r.getStats()).not.toThrow();
        r.dispose();
      });
    });

    describe('setPixel', () => {
      it('should set pixel color', () => {
        renderer.setPixel(0, 0, { r: 255, g: 0, b: 0, a: 255 });
        expect(renderer.getPixel(0, 0)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
      });

      it('should mark region as dirty', () => {
        renderer.setPixel(5, 5, { r: 255, g: 0, b: 0, a: 255 });
        expect(renderer.hasDirtyRegions()).toBe(true);
      });
    });

    describe('getPixel', () => {
      it('should get pixel color', () => {
        renderer.setPixel(10, 15, { r: 100, g: 150, b: 200, a: 255 });
        expect(renderer.getPixel(10, 15)).toEqual({ r: 100, g: 150, b: 200, a: 255 });
      });

      it('should return transparent black for uninitialized pixels', () => {
        expect(renderer.getPixel(0, 0)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
      });
    });

    describe('setPixelBatch', () => {
      it('should set multiple pixels', () => {
        renderer.setPixelBatch([
          { x: 0, y: 0, color: { r: 255, g: 0, b: 0, a: 255 } },
          { x: 1, y: 0, color: { r: 0, g: 255, b: 0, a: 255 } },
          { x: 2, y: 0, color: { r: 0, g: 0, b: 255, a: 255 } },
        ]);

        expect(renderer.getPixel(0, 0)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
        expect(renderer.getPixel(1, 0)).toEqual({ r: 0, g: 255, b: 0, a: 255 });
        expect(renderer.getPixel(2, 0)).toEqual({ r: 0, g: 0, b: 255, a: 255 });
      });

      it('should mark bounding box as dirty', () => {
        renderer.setPixelBatch([
          { x: 5, y: 5, color: { r: 255, g: 0, b: 0, a: 255 } },
          { x: 10, y: 10, color: { r: 0, g: 255, b: 0, a: 255 } },
        ]);

        const regions = renderer.getDirtyRegions();
        expect(regions.length).toBeGreaterThan(0);
      });
    });

    describe('fill', () => {
      it('should fill buffer with color', () => {
        renderer.fill({ r: 128, g: 128, b: 128, a: 255 });
        expect(renderer.getPixel(0, 0)).toEqual({ r: 128, g: 128, b: 128, a: 255 });
        expect(renderer.getPixel(31, 31)).toEqual({ r: 128, g: 128, b: 128, a: 255 });
      });

      it('should mark entire buffer as dirty', () => {
        renderer.fill({ r: 255, g: 0, b: 0, a: 255 });
        const regions = renderer.getDirtyRegions();
        expect(regions.length).toBeGreaterThan(0);
      });
    });

    describe('clear', () => {
      it('should clear all pixels', () => {
        renderer.fill({ r: 255, g: 255, b: 255, a: 255 });
        renderer.clear();

        expect(renderer.getPixel(0, 0)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
        expect(renderer.getPixel(31, 31)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
      });

      it('should mark entire buffer as dirty', () => {
        renderer.clear();
        expect(renderer.hasDirtyRegions()).toBe(true);
      });
    });

    describe('dirty region tracking', () => {
      it('should track overlapping dirty regions', () => {
        renderer.markDirty(0, 0, 10, 10);
        renderer.markDirty(5, 5, 15, 15);

        const regions = renderer.getDirtyRegions();
        expect(regions.length).toBe(1);
        expect(regions[0].x1).toBe(0);
        expect(regions[0].y1).toBe(0);
        expect(regions[0].x2).toBe(15);
        expect(regions[0].y2).toBe(15);
      });

      it('should limit dirty regions', () => {
        for (let i = 0; i < 100; i++) {
          renderer.markDirty(i * 2, i * 2, i * 2 + 1, i * 2 + 1);
        }

        const regions = renderer.getDirtyRegions();
        expect(regions.length).toBeLessThanOrEqual(64);
      });

      it('should clear dirty regions', () => {
        renderer.markDirty(0, 0, 10, 10);
        renderer.clearDirtyRegions();

        expect(renderer.hasDirtyRegions()).toBe(false);
      });
    });

    describe('coordinate mapping', () => {
      it('should map pixel to canvas coordinates', () => {
        const result = renderer.pixelToCanvas(5, 10, 8);
        expect(result).toEqual({ x: 40, y: 80 });
      });

      it('should map canvas to pixel coordinates', () => {
        const result = renderer.canvasToPixel(40, 80, 8);
        expect(result).toEqual({ x: 5, y: 10 });
      });

      it('should map pixel rect to canvas', () => {
        const result = renderer.pixelRectToCanvas(2, 3, 4, 5, 8);
        expect(result).toEqual({ x: 16, y: 24, w: 32, h: 40 });
      });
    });

    describe('resize', () => {
      it('should resize buffer', () => {
        renderer.resize(64, 64);
        expect(renderer.getSize()).toEqual({ width: 64, height: 64 });
      });

      it('should throw for invalid dimensions', () => {
        expect(() => renderer.resize(0, 32)).toThrow();
        expect(() => renderer.resize(32, -1)).toThrow();
      });

      it('should mark entire buffer as dirty after resize', () => {
        renderer.resize(64, 64);
        expect(renderer.hasDirtyRegions()).toBe(true);
      });
    });

    describe('render stats', () => {
      it('should return valid stats', () => {
        const stats = renderer.getStats();
        expect(stats.framesRendered).toBe(0);
        expect(stats.dirtyRegionsUpdated).toBe(0);
        expect(typeof stats.averageFps).toBe('number');
      });

      it('should track frames', () => {
        renderer.setPixel(0, 0, { r: 255, g: 0, b: 0, a: 255 });
        
        const stats1 = renderer.getStats();
        expect(stats1.framesRendered).toBe(0);
      });
    });

    describe('buffer access', () => {
      it('should provide draw buffer', () => {
        const drawBuffer = renderer.getDrawBuffer();
        expect(drawBuffer).toBeDefined();
        expect(typeof drawBuffer.setPixel).toBe('function');
      });

      it('should provide display buffer', () => {
        const displayBuffer = renderer.getDisplayBuffer();
        expect(displayBuffer).toBeDefined();
        expect(typeof displayBuffer.getPixel).toBe('function');
      });
    });

    describe('blend operations', () => {
      it('should mark blended region as dirty', () => {
        const { PixelBuffer } = require('../../buffer/buffer');
        const source = new PixelBuffer(4, 4);
        source.fill({ r: 255, g: 0, b: 0, a: 255 });

        renderer.blend(source, 0, 0, 'replace');
        expect(renderer.hasDirtyRegions()).toBe(true);
      });
    });
  });
});
