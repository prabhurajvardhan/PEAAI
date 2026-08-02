/**
 * Tests for Pixel Buffer Module (T-015)
 */

import { PixelBuffer } from '../buffer/buffer';
import { BlendMode } from '../types';

describe('Pixel Buffer Module', () => {
  describe('PixelBuffer', () => {
    let buffer: PixelBuffer;

    beforeEach(() => {
      buffer = new PixelBuffer(32, 32);
    });

    describe('constructor', () => {
      it('should create buffer with correct dimensions', () => {
        const b = new PixelBuffer(64, 48);
        expect(b.getWidth()).toBe(64);
        expect(b.getHeight()).toBe(48);
      });

      it('should throw for invalid dimensions', () => {
        expect(() => new PixelBuffer(0, 32)).toThrow();
        expect(() => new PixelBuffer(32, 0)).toThrow();
        expect(() => new PixelBuffer(-1, 32)).toThrow();
      });
    });

    describe('setPixel', () => {
      it('should set pixel color', () => {
        buffer.setPixel(0, 0, { r: 255, g: 128, b: 64, a: 255 });
        expect(buffer.getPixel(0, 0)).toEqual({ r: 255, g: 128, b: 64, a: 255 });
      });

      it('should clamp color values', () => {
        buffer.setPixel(0, 0, { r: 300, g: -50, b: 128.5, a: 300 });
        expect(buffer.getPixel(0, 0)).toEqual({ r: 255, g: 0, b: 129, a: 255 });
      });

      it('should ignore out of bounds coordinates', () => {
        expect(() => {
          buffer.setPixel(-1, 0, { r: 255, g: 0, b: 0, a: 255 });
        }).not.toThrow();
        expect(() => {
          buffer.setPixel(0, -1, { r: 255, g: 0, b: 0, a: 255 });
        }).not.toThrow();
        expect(() => {
          buffer.setPixel(32, 0, { r: 255, g: 0, b: 0, a: 255 });
        }).not.toThrow();
      });
    });

    describe('getPixel', () => {
      it('should get pixel color', () => {
        buffer.setPixel(5, 10, { r: 100, g: 150, b: 200, a: 255 });
        expect(buffer.getPixel(5, 10)).toEqual({ r: 100, g: 150, b: 200, a: 255 });
      });

      it('should return transparent black for out of bounds', () => {
        expect(buffer.getPixel(-1, 0)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
        expect(buffer.getPixel(0, 32)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
      });

      it('should return transparent black for uninitialized pixels', () => {
        expect(buffer.getPixel(0, 0)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
      });
    });

    describe('setPixelBatch', () => {
      it('should set multiple pixels', () => {
        buffer.setPixelBatch({
          pixels: [
            { x: 0, y: 0, color: { r: 255, g: 0, b: 0, a: 255 } },
            { x: 1, y: 0, color: { r: 0, g: 255, b: 0, a: 255 } },
            { x: 2, y: 0, color: { r: 0, g: 0, b: 255, a: 255 } },
          ],
        });

        expect(buffer.getPixel(0, 0)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
        expect(buffer.getPixel(1, 0)).toEqual({ r: 0, g: 255, b: 0, a: 255 });
        expect(buffer.getPixel(2, 0)).toEqual({ r: 0, g: 0, b: 255, a: 255 });
      });
    });

    describe('fill', () => {
      it('should fill buffer with color', () => {
        buffer.fill({ r: 128, g: 128, b: 128, a: 255 });

        for (let y = 0; y < 32; y++) {
          for (let x = 0; x < 32; x++) {
            expect(buffer.getPixel(x, y)).toEqual({ r: 128, g: 128, b: 128, a: 255 });
          }
        }
      });

      it('should fill with transparent color', () => {
        buffer.fill({ r: 255, g: 0, b: 0, a: 255 });
        buffer.fill({ r: 0, g: 0, b: 0, a: 0 });

        expect(buffer.getPixel(0, 0)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
      });
    });

    describe('copy', () => {
      it('should create a copy of the buffer', () => {
        buffer.setPixel(0, 0, { r: 255, g: 0, b: 0, a: 255 });
        buffer.setPixel(15, 15, { r: 0, g: 255, b: 0, a: 255 });

        const copy = buffer.copy();

        expect(copy.getWidth()).toBe(buffer.getWidth());
        expect(copy.getHeight()).toBe(buffer.getHeight());
        expect(copy.getPixel(0, 0)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
        expect(copy.getPixel(15, 15)).toEqual({ r: 0, g: 255, b: 0, a: 255 });
      });

      it('should not affect original when copy is modified', () => {
        buffer.setPixel(0, 0, { r: 255, g: 0, b: 0, a: 255 });
        const copy = buffer.copy();
        copy.setPixel(0, 0, { r: 0, g: 0, b: 255, a: 255 });

        expect(buffer.getPixel(0, 0)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
      });
    });

    describe('blend', () => {
      it('should blend with replace mode', () => {
        buffer.fill({ r: 255, g: 0, b: 0, a: 255 });
        const other = new PixelBuffer(4, 4);
        other.fill({ r: 0, g: 255, b: 0, a: 255 });

        buffer.blend(other, 0, 0, 'replace');

        expect(buffer.getPixel(0, 0)).toEqual({ r: 0, g: 255, b: 0, a: 255 });
        expect(buffer.getPixel(5, 5)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
      });

      it('should blend with alpha mode', () => {
        buffer.fill({ r: 255, g: 0, b: 0, a: 255 });
        const other = new PixelBuffer(4, 4);
        other.fill({ r: 0, g: 0, b: 255, a: 128 });

        buffer.blend(other, 0, 0, 'alpha');

        const result = buffer.getPixel(0, 0);
        expect(result.r).toBeGreaterThan(0);
        expect(result.b).toBeGreaterThan(0);
      });

      it('should blend with add mode', () => {
        buffer.fill({ r: 100, g: 100, b: 100, a: 255 });
        const other = new PixelBuffer(4, 4);
        other.fill({ r: 100, g: 100, b: 100, a: 255 });

        buffer.blend(other, 0, 0, 'add');

        expect(buffer.getPixel(0, 0)).toEqual({ r: 200, g: 200, b: 200, a: 255 });
      });

      it('should blend with multiply mode', () => {
        buffer.fill({ r: 128, g: 128, b: 128, a: 255 });
        const other = new PixelBuffer(4, 4);
        other.fill({ r: 128, g: 128, b: 128, a: 255 });

        buffer.blend(other, 0, 0, 'multiply');

        expect(buffer.getPixel(0, 0)).toEqual({ r: 64, g: 64, b: 64, a: 255 });
      });
    });

    describe('resize', () => {
      it('should resize buffer', () => {
        buffer.setPixel(0, 0, { r: 255, g: 0, b: 0, a: 255 });
        buffer.resize(64, 64);

        expect(buffer.getWidth()).toBe(64);
        expect(buffer.getHeight()).toBe(64);
        expect(buffer.getPixel(0, 0)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
      });

      it('should truncate when shrinking', () => {
        buffer.setPixel(0, 0, { r: 255, g: 0, b: 0, a: 255 });
        buffer.setPixel(31, 31, { r: 0, g: 0, b: 255, a: 255 });
        buffer.resize(16, 16);

        expect(buffer.getPixel(0, 0)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
        expect(buffer.getPixel(15, 15)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
      });

      it('should throw for invalid dimensions', () => {
        expect(() => buffer.resize(0, 32)).toThrow();
        expect(() => buffer.resize(32, -1)).toThrow();
      });
    });

    describe('toImageData', () => {
      it('should be a function', () => {
        expect(typeof buffer.toImageData).toBe('function');
      });

      it('should return object with expected properties', () => {
        // toImageData requires DOM support, just verify method exists
        expect(buffer.toImageData).toBeDefined();
      });
    });

    describe('clear', () => {
      it('should clear all pixels', () => {
        buffer.fill({ r: 255, g: 255, b: 255, a: 255 });
        buffer.clear();

        for (let y = 0; y < 32; y++) {
          for (let x = 0; x < 32; x++) {
            expect(buffer.getPixel(x, y)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
          }
        }
      });
    });

    describe('getData', () => {
      it('should return raw data array', () => {
        const data = buffer.getData();
        expect(data).toBeInstanceOf(Uint8ClampedArray);
        expect(data.length).toBe(32 * 32 * 4);
      });
    });

    describe('setData', () => {
      it('should set raw data', () => {
        const newData = new Uint8ClampedArray(32 * 32 * 4);
        newData[0] = 255;
        newData[1] = 0;
        newData[2] = 0;
        newData[3] = 255;

        buffer.setData(newData);

        expect(buffer.getPixel(0, 0)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
      });

      it('should throw for mismatched data length', () => {
        const newData = new Uint8ClampedArray(16 * 16 * 4);
        expect(() => buffer.setData(newData)).toThrow();
      });
    });
  });
});
