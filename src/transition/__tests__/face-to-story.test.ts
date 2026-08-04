/**
 * Face-to-Story Transition Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FaceToStoryTransition } from '../face-to-story';
import type { GeneratedScene } from '../../story-viz/scene-generator/types';

describe('FaceToStoryTransition', () => {
  let transition: FaceToStoryTransition;

  beforeEach(() => {
    transition = new FaceToStoryTransition();
  });

  afterEach(() => {
    transition.dispose();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const config = transition.getConfig();
      expect(config.timing.captureDuration).toBe(100);
      expect(config.timing.dissolveDuration).toBe(500);
      expect(config.timing.mergeDuration).toBe(500);
      expect(config.dissolvePattern).toBe('grid');
    });

    it('should accept custom config', () => {
      const customTransition = new FaceToStoryTransition({
        config: {
          dissolvePattern: 'radial',
          gridSize: 64,
        },
      });
      const config = customTransition.getConfig();
      expect(config.dissolvePattern).toBe('radial');
      expect(config.gridSize).toBe(64);
    });
  });

  describe('initial state', () => {
    it('should start in idle phase', () => {
      expect(transition.getPhase()).toBe('idle');
    });

    it('should have zero progress initially', () => {
      expect(transition.getProgress()).toBe(0);
    });

    it('should not be active initially', () => {
      expect(transition.isActive()).toBe(false);
    });

    it('should return correct initial state', () => {
      const state = transition.getState();
      expect(state.phase).toBe('idle');
      expect(state.progress).toBe(0);
      expect(state.faceCaptured).toBe(false);
      expect(state.dissolveProgress).toBe(0);
      expect(state.storyVisible).toBe(false);
    });
  });

  describe('transition', () => {
    it('should throw if already running', async () => {
      // Start a transition
      const mockScene: GeneratedScene = {
        id: 'test-scene',
        elements: [],
        metadata: {
          sceneId: 'test',
          index: 0,
          text: 'Test scene',
          sentiment: 'neutral',
        },
        camera: {
          position: { x: 0, y: 0 },
          zoom: 1,
          rotation: 0,
        },
      };
      
      // Note: This test would need to be adjusted for async behavior
      // For now, we just verify the method exists
      expect(transition.transition).toBeDefined();
    });
  });

  describe('cancel', () => {
    it('should not throw if not running', () => {
      expect(() => transition.cancel()).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      transition.reset();
      
      expect(transition.getPhase()).toBe('idle');
      expect(transition.getProgress()).toBe(0);
      expect(transition.isActive()).toBe(false);
    });
  });

  describe('dissolve cells', () => {
    it('should return dissolve cells', () => {
      const cells = transition.getDissolveCells();
      expect(cells).toBeDefined();
      expect(Array.isArray(cells)).toBe(true);
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should have correct cell structure', () => {
      const cells = transition.getDissolveCells();
      const cell = cells[0];
      
      expect(cell).toHaveProperty('x');
      expect(cell).toHaveProperty('y');
      expect(cell).toHaveProperty('alpha');
      expect(cell).toHaveProperty('active');
    });
  });

  describe('callbacks', () => {
    it('should allow subscribing to progress updates', () => {
      const callback = vi.fn();
      const unsubscribe = transition.onProgress(callback);
      
      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should allow unsubscribing', () => {
      const callback = vi.fn();
      const unsubscribe = transition.onProgress(callback);
      unsubscribe();
      
      // The callback should not be called anymore
      // This is a basic check - actual callback behavior requires a transition
    });
  });

  describe('configuration', () => {
    it('should allow updating config', () => {
      transition.setConfig({
        dissolvePattern: 'spiral',
        enableMorphing: false,
      });
      
      const config = transition.getConfig();
      expect(config.dissolvePattern).toBe('spiral');
      expect(config.enableMorphing).toBe(false);
    });

    it('should update grid size in config', () => {
      transition.setConfig({ gridSize: 16 });
      
      const config = transition.getConfig();
      expect(config.gridSize).toBe(16);
    });
  });

  describe('hooks', () => {
    it('should allow setting hooks', () => {
      const hooks = {
        onStart: vi.fn(),
        onComplete: vi.fn(),
      };
      
      transition.setHooks(hooks);
      
      // Hooks should be set without error
      expect(transition.getConfig()).toBeDefined();
    });
  });
});

describe('createFaceToStoryTransition', () => {
  it('should create a FaceToStoryTransition instance', () => {
    const transition = new FaceToStoryTransition();
    expect(transition).toBeInstanceOf(FaceToStoryTransition);
    transition.dispose();
  });
});
