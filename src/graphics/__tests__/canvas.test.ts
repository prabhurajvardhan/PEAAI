/**
 * Tests for Canvas Engine Module (T-013)
 * 
 * These tests focus on the unit-testable aspects of CanvasEngine
 * without requiring full DOM canvas support.
 */

import { CanvasEngine } from '../canvas/canvas';

describe('Canvas Engine Module', () => {
  describe('CanvasEngine', () => {
    describe('constructor', () => {
      it('should create canvas engine with default config', () => {
        const engine = new CanvasEngine();
        expect(engine).toBeDefined();
        expect(engine.isInitialized()).toBe(false);
        engine.destroy();
      });

      it('should create canvas engine with custom config', () => {
        const engine = new CanvasEngine({ width: 64, height: 64, pixelScale: 2 });
        expect(engine).toBeDefined();
        expect(engine.isInitialized()).toBe(false);
        engine.destroy();
      });

      it('should return correct initial size', () => {
        const engine = new CanvasEngine({ width: 32, height: 32 });
        expect(engine.getSize()).toEqual({ width: 32, height: 32 });
        engine.destroy();
      });

      it('should return correct pixel scale', () => {
        const engine = new CanvasEngine({ pixelScale: 1 });
        expect(engine.getPixelScale()).toBe(1);
        engine.destroy();
      });

      it('should store autoRender config', () => {
        const engine1 = new CanvasEngine({ autoRender: true });
        const engine2 = new CanvasEngine({ autoRender: false });
        expect(engine1).toBeDefined();
        expect(engine2).toBeDefined();
        engine1.destroy();
        engine2.destroy();
      });
    });

    describe('setSize', () => {
      let engine: CanvasEngine;

      beforeEach(() => {
        engine = new CanvasEngine({ width: 32, height: 32 });
      });

      afterEach(() => {
        engine.destroy();
      });

      it('should set canvas size', () => {
        engine.setSize(64, 64);
        expect(engine.getSize()).toEqual({ width: 64, height: 64 });
      });

      it('should throw for invalid size', () => {
        expect(() => engine.setSize(0, 32)).toThrow();
        expect(() => engine.setSize(32, -1)).toThrow();
      });

      it('should throw for negative size', () => {
        expect(() => engine.setSize(-5, 32)).toThrow();
      });

      it('should preserve size on same dimensions', () => {
        const size1 = engine.getSize();
        engine.setSize(32, 32);
        const size2 = engine.getSize();
        expect(size1).toEqual(size2);
      });
    });

    describe('setPixelScale', () => {
      let engine: CanvasEngine;

      beforeEach(() => {
        engine = new CanvasEngine({ width: 32, height: 32 });
      });

      afterEach(() => {
        engine.destroy();
      });

      it('should set pixel scale', () => {
        engine.setPixelScale(2);
        expect(engine.getPixelScale()).toBe(2);
      });

      it('should throw for invalid scale', () => {
        expect(() => engine.setPixelScale(0)).toThrow();
        expect(() => engine.setPixelScale(-1)).toThrow();
      });

      it('should accept fractional scales', () => {
        engine.setPixelScale(0.5);
        expect(engine.getPixelScale()).toBe(0.5);
      });

      it('should accept large scales', () => {
        engine.setPixelScale(10);
        expect(engine.getPixelScale()).toBe(10);
      });
    });

    describe('destroy', () => {
      it('should handle destroy when not initialized', () => {
        const engine = new CanvasEngine();
        expect(() => engine.destroy()).not.toThrow();
      });

      it('should return isInitialized as false after destroy', () => {
        const engine = new CanvasEngine({ width: 32, height: 32 });
        engine.destroy();
        expect(engine.isInitialized()).toBe(false);
      });

      it('should be idempotent', () => {
        const engine = new CanvasEngine({ width: 32, height: 32 });
        engine.destroy();
        expect(() => engine.destroy()).not.toThrow();
      });
    });

    describe('pause/resume', () => {
      let engine: CanvasEngine;

      beforeEach(() => {
        engine = new CanvasEngine({ width: 32, height: 32 });
      });

      afterEach(() => {
        engine.destroy();
      });

      it('should allow pause and resume', () => {
        engine.pause();
        engine.resume();
        // No error means success
      });

      it('should allow multiple pause calls', () => {
        engine.pause();
        engine.pause();
        engine.pause();
        // No error means success
      });

      it('should allow multiple resume calls', () => {
        engine.pause();
        engine.resume();
        engine.resume();
        engine.resume();
        // No error means success
      });
    });

    describe('DPR handling', () => {
      let engine: CanvasEngine;

      beforeEach(() => {
        engine = new CanvasEngine({ width: 32, height: 32 });
      });

      afterEach(() => {
        engine.destroy();
      });

      it('should have valid DPR value', () => {
        const dpr = engine.getDPR();
        expect(typeof dpr).toBe('number');
        expect(dpr).toBeGreaterThanOrEqual(1);
      });

      it('should return numeric DPR', () => {
        expect(typeof engine.getDPR()).toBe('number');
      });
    });

    describe('getCanvas/getContext', () => {
      let engine: CanvasEngine;

      beforeEach(() => {
        engine = new CanvasEngine({ width: 32, height: 32 });
      });

      afterEach(() => {
        engine.destroy();
      });

      it('should return null for uninitialized canvas', () => {
        expect(engine.getCanvas()).toBeNull();
        expect(engine.getContext()).toBeNull();
      });
    });

    describe('getPixelBuffer', () => {
      let engine: CanvasEngine;

      beforeEach(() => {
        engine = new CanvasEngine({ width: 32, height: 32 });
      });

      afterEach(() => {
        engine.destroy();
      });

      it('should throw when not initialized', () => {
        expect(() => engine.getPixelBuffer()).toThrow();
      });
    });

    describe('render', () => {
      let engine: CanvasEngine;

      beforeEach(() => {
        engine = new CanvasEngine({ width: 32, height: 32 });
      });

      afterEach(() => {
        engine.destroy();
      });

      it('should not throw when not initialized', () => {
        // render is a no-op when not initialized
        expect(() => engine.render()).not.toThrow();
      });
    });

    describe('clear', () => {
      let engine: CanvasEngine;

      beforeEach(() => {
        engine = new CanvasEngine({ width: 32, height: 32 });
      });

      afterEach(() => {
        engine.destroy();
      });

      it('should not throw when not initialized', () => {
        expect(() => engine.clear()).not.toThrow();
      });
    });
  });
});
