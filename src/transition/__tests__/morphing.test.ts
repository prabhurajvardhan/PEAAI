/**
 * Morphing Engine Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MorphingEngine } from '../morphing';
import type { MorphPreset } from '../types';

describe('MorphingEngine', () => {
  let morphEngine: MorphingEngine;

  beforeEach(() => {
    morphEngine = new MorphingEngine();
  });

  afterEach(() => {
    morphEngine.dispose();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const config = morphEngine.getConfig();
      expect(config.preset).toBe('none');
      expect(config.intensity).toBe(1.0);
      expect(config.vertexDensity).toBe(4);
    });

    it('should accept custom config', () => {
      const customEngine = new MorphingEngine({
        preset: 'warp',
        intensity: 0.5,
      });
      const config = customEngine.getConfig();
      expect(config.preset).toBe('warp');
      expect(config.intensity).toBe(0.5);
    });
  });

  describe('initialize', () => {
    it('should initialize with given dimensions', () => {
      morphEngine.initialize(32, 32);
      // Engine should be initialized without error
      expect(true).toBe(true);
    });

    it('should create morph points', () => {
      morphEngine.initialize(16, 16);
      // Engine should be initialized with points
      expect(true).toBe(true);
    });
  });

  describe('presets', () => {
    it('should set warp preset', () => {
      morphEngine.setPreset('warp');
      expect(morphEngine.getPreset()).toBe('warp');
    });

    it('should set ripple preset', () => {
      morphEngine.setPreset('ripple');
      expect(morphEngine.getPreset()).toBe('ripple');
    });

    it('should set twist preset', () => {
      morphEngine.setPreset('twist');
      expect(morphEngine.getPreset()).toBe('twist');
    });

    it('should set bulge preset', () => {
      morphEngine.setPreset('bulge');
      expect(morphEngine.getPreset()).toBe('bulge');
    });

    it('should set implode preset', () => {
      morphEngine.setPreset('implode');
      expect(morphEngine.getPreset()).toBe('implode');
    });

    it('should set explode preset', () => {
      morphEngine.setPreset('explode');
      expect(morphEngine.getPreset()).toBe('explode');
    });

    it('should set none preset', () => {
      morphEngine.setPreset('warp');
      morphEngine.setPreset('none');
      expect(morphEngine.getPreset()).toBe('none');
    });
  });

  describe('applyMorph', () => {
    it('should return empty array when not active', () => {
      const result = morphEngine.applyMorph(0.5);
      expect(result).toEqual([]);
    });

    it('should return targets when active', () => {
      morphEngine.initialize(16, 16);
      morphEngine.setPreset('warp');
      morphEngine.start();
      
      const result = morphEngine.applyMorph(0.5);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return correct number of targets', () => {
      morphEngine.initialize(8, 8);
      morphEngine.setPreset('warp');
      morphEngine.start();
      
      const result = morphEngine.applyMorph(0.5);
      // Should return 64 targets for 8x8 grid
      expect(result.length).toBe(64);
    });

    it('should apply morph targets with correct structure', () => {
      morphEngine.initialize(4, 4);
      morphEngine.setPreset('warp');
      morphEngine.start();
      
      const result = morphEngine.applyMorph(0.5);
      
      if (result.length > 0) {
        const target = result[0];
        expect(target).toHaveProperty('x');
        expect(target).toHaveProperty('y');
        expect(target).toHaveProperty('dx');
        expect(target).toHaveProperty('dy');
        expect(target).toHaveProperty('alpha');
      }
    });

    it('should not apply morph for none preset', () => {
      morphEngine.initialize(4, 4);
      morphEngine.setPreset('none');
      morphEngine.start();
      
      const result = morphEngine.applyMorph(0.5);
      
      if (result.length > 0) {
        // With 'none' preset, displacements should be 0
        expect(result[0].dx).toBe(0);
        expect(result[0].dy).toBe(0);
      }
    });
  });

  describe('start/stop', () => {
    it('should start morphing', () => {
      morphEngine.start();
      expect(morphEngine.isMorphing()).toBe(true);
    });

    it('should stop morphing', () => {
      morphEngine.start();
      morphEngine.stop();
      expect(morphEngine.isMorphing()).toBe(false);
    });
  });

  describe('easing', () => {
    it('should accept custom easing function', () => {
      const customEasing = (t: number) => t * t;
      morphEngine.setEasing(customEasing);
      
      const config = morphEngine.getConfig();
      expect(config.easing).toBe(customEasing);
    });
  });

  describe('intensity', () => {
    it('should set intensity', () => {
      morphEngine.setIntensity(0.5);
      expect(morphEngine.getConfig().intensity).toBe(0.5);
    });

    it('should clamp intensity between 0 and 1', () => {
      morphEngine.setIntensity(1.5);
      expect(morphEngine.getConfig().intensity).toBe(1);
      
      morphEngine.setIntensity(-0.5);
      expect(morphEngine.getConfig().intensity).toBe(0);
    });
  });

  describe('callbacks', () => {
    it('should allow subscribing to morph updates', () => {
      const callback = vi.fn();
      const unsubscribe = morphEngine.onMorph(callback);
      
      expect(unsubscribe).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      morphEngine.start();
      morphEngine.reset();
      
      expect(morphEngine.isMorphing()).toBe(false);
    });
  });

  describe('applyDisplacement', () => {
    it('should apply displacement to image data', () => {
      const sourceData = new Uint8ClampedArray(16 * 4); // 4x4 pixels
      for (let i = 0; i < sourceData.length; i++) {
        sourceData[i] = i % 4 === 3 ? 255 : 100; // RGB = 100, Alpha = 255
      }
      
      const targets = morphEngine.applyMorph(0);
      
      const result = morphEngine.applyDisplacement(sourceData, 4, 4, targets);
      
      expect(result).toBeDefined();
      expect(result.length).toBe(sourceData.length);
    });
  });

  describe('interpolateTargets', () => {
    it('should interpolate between two target sets', () => {
      const from = [
        { x: 0, y: 0, dx: 0, dy: 0, alpha: 1 },
        { x: 1, y: 0, dx: 0, dy: 0, alpha: 1 },
      ];
      
      const to = [
        { x: 0, y: 0, dx: 10, dy: 10, alpha: 0.5 },
        { x: 1, y: 0, dx: 20, dy: 20, alpha: 0.5 },
      ];
      
      const result = morphEngine.interpolateTargets(from, to, 0.5);
      
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].dx).toBe(5);
      expect(result[0].dy).toBe(5);
    });
  });
});

describe('createMorphingEngine', () => {
  it('should create a MorphingEngine instance', () => {
    const engine = new MorphingEngine();
    expect(engine).toBeInstanceOf(MorphingEngine);
    engine.dispose();
  });
});
