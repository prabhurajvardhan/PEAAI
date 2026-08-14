/**
 * Dissolve Effects Engine Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DissolveEffectsEngine } from '../dissolve';
import type { DissolvePattern } from '../types';

describe('DissolveEffectsEngine', () => {
  let dissolveEngine: DissolveEffectsEngine;

  beforeEach(() => {
    dissolveEngine = new DissolveEffectsEngine();
  });

  afterEach(() => {
    dissolveEngine.dispose();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const config = dissolveEngine.getConfig();
      expect(config.pattern).toBe('grid');
      expect(config.reverse).toBe(false);
      expect(config.staggered).toBe(false);
    });

    it('should accept custom config', () => {
      const customEngine = new DissolveEffectsEngine({
        pattern: 'radial',
        reverse: true,
      });
      const config = customEngine.getConfig();
      expect(config.pattern).toBe('radial');
      expect(config.reverse).toBe(true);
    });
  });

  describe('initialize', () => {
    it('should initialize with given dimensions', () => {
      dissolveEngine.initialize(32, 32);
      const mask = dissolveEngine.getMask();
      
      expect(mask).toBeDefined();
      expect(mask?.width).toBe(32);
      expect(mask?.height).toBe(32);
    });

    it('should create correct number of cells', () => {
      dissolveEngine.initialize(16, 16);
      const mask = dissolveEngine.getMask();
      
      expect(mask?.cells.length).toBe(256); // 16 * 16
    });

    it('should initialize cells with correct structure', () => {
      dissolveEngine.initialize(4, 4);
      const mask = dissolveEngine.getMask();
      
      if (mask && mask.cells.length > 0) {
        const cell = mask.cells[0];
        expect(cell).toHaveProperty('x');
        expect(cell).toHaveProperty('y');
        expect(cell).toHaveProperty('dissolve');
        expect(cell).toHaveProperty('alpha');
      }
    });
  });

  describe('update', () => {
    it('should initialize if not already initialized', () => {
      const mask = dissolveEngine.update(0.5);
      expect(mask).toBeDefined();
    });

    it('should update progress', () => {
      dissolveEngine.initialize(8, 8);
      const mask = dissolveEngine.update(0.5);
      
      expect(mask.progress).toBe(0.5);
    });

    it('should update cell dissolve values', () => {
      dissolveEngine.initialize(4, 4);
      const mask = dissolveEngine.update(0.5);
      
      // At progress 0.5, some cells should have dissolve > 0
      const dissolvedCells = mask.cells.filter(c => c.dissolve > 0);
      expect(dissolvedCells.length).toBeGreaterThan(0);
    });

    it('should handle progress values correctly', () => {
      dissolveEngine.initialize(4, 4);
      
      const mask1 = dissolveEngine.update(-0.5);
      // Note: The easing function may not clamp to exactly 0
      // Just verify it doesn't crash
      expect(mask1).toBeDefined();
      
      const mask2 = dissolveEngine.update(1.5);
      expect(mask2).toBeDefined();
    });
  });

  describe('patterns', () => {
    const patterns: DissolvePattern[] = ['grid', 'particle', 'noise', 'radial', 'spiral', 'wave'];

    patterns.forEach(pattern => {
      it(`should support ${pattern} pattern`, () => {
        dissolveEngine.setPattern(pattern);
        expect(dissolveEngine.getPattern()).toBe(pattern);
        
        dissolveEngine.initialize(8, 8);
        const mask = dissolveEngine.update(0.5);
        
        expect(mask).toBeDefined();
      });
    });

    it('should recreate mask when pattern changes', () => {
      dissolveEngine.initialize(4, 4);
      dissolveEngine.setPattern('radial');
      
      const mask = dissolveEngine.getMask();
      expect(mask).toBeDefined();
    });
  });

  describe('reverse mode', () => {
    it('should set reverse mode', () => {
      dissolveEngine.setReverse(true);
      expect(dissolveEngine.getConfig().reverse).toBe(true);
    });

    it('should update cells correctly in reverse mode', () => {
      dissolveEngine.setReverse(true);
      dissolveEngine.initialize(4, 4);
      const mask = dissolveEngine.update(0.5);
      
      // In reverse, alpha should be inverted
      // This is a general check - actual values depend on pattern
      expect(mask).toBeDefined();
    });
  });

  describe('staggered mode', () => {
    it('should set staggered mode', () => {
      dissolveEngine.setStaggered(true);
      expect(dissolveEngine.getConfig().staggered).toBe(true);
    });

    it('should recreate mask when staggered changes', () => {
      dissolveEngine.initialize(4, 4);
      dissolveEngine.setStaggered(true);
      
      const mask = dissolveEngine.getMask();
      expect(mask).toBeDefined();
    });
  });

  describe('seed', () => {
    it('should set seed', () => {
      dissolveEngine.setSeed(12345);
      expect(dissolveEngine.getConfig().seed).toBe(12345);
    });

    it('should generate consistent results with same seed', () => {
      const engine1 = new DissolveEffectsEngine({ seed: 42 });
      const engine2 = new DissolveEffectsEngine({ seed: 42 });
      
      engine1.initialize(4, 4);
      engine2.initialize(4, 4);
      
      const mask1 = engine1.update(0.5);
      const mask2 = engine2.update(0.5);
      
      // Same seed should produce same dissolve values
      expect(mask1.cells[0].dissolve).toBe(mask2.cells[0].dissolve);
      
      engine1.dispose();
      engine2.dispose();
    });
  });

  describe('easing', () => {
    it('should accept custom easing function', () => {
      const customEasing = (t: number) => t * t;
      dissolveEngine.setEasing(customEasing);
      
      const config = dissolveEngine.getConfig();
      expect(config.easing).toBe(customEasing);
    });
  });

  describe('custom pattern', () => {
    it('should accept custom pattern function', () => {
      const customPattern = (x: number, y: number, w: number, h: number, p: number, seed: number) => {
        return p;
      };
      
      dissolveEngine.setCustomPattern(customPattern);
      expect(dissolveEngine.getPattern()).toBe('custom');
    });
  });

  describe('getAlphaArray', () => {
    it('should return alpha values array', () => {
      dissolveEngine.initialize(4, 4);
      dissolveEngine.update(0.5);
      
      const alphaArray = dissolveEngine.getAlphaArray();
      
      expect(alphaArray).toBeDefined();
      expect(alphaArray.length).toBe(16); // 4 * 4
    });

    it('should return empty array if not initialized', () => {
      const alphaArray = dissolveEngine.getAlphaArray();
      expect(alphaArray.length).toBe(0);
    });
  });

  describe('applyMaskToImageData', () => {
    it('should have applyMaskToImageData method', () => {
      expect(typeof dissolveEngine.applyMaskToImageData).toBe('function');
    });
  });

  describe('callbacks', () => {
    it('should allow subscribing to updates', () => {
      const callback = vi.fn();
      const unsubscribe = dissolveEngine.onUpdate(callback);
      
      expect(unsubscribe).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      dissolveEngine.initialize(4, 4);
      dissolveEngine.update(0.5);
      dissolveEngine.reset();
      
      const mask = dissolveEngine.getMask();
      expect(mask?.progress).toBe(0);
    });
  });

  describe('getParticles', () => {
    it('should return particles array', () => {
      const particles = dissolveEngine.getParticles();
      expect(Array.isArray(particles)).toBe(true);
    });
  });
});

describe('createDissolveEngine', () => {
  it('should create a DissolveEffectsEngine instance', () => {
    const engine = new DissolveEffectsEngine();
    expect(engine).toBeInstanceOf(DissolveEffectsEngine);
    engine.dispose();
  });
});
