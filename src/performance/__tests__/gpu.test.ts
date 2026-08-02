/**
 * Tests for GPU Optimization Module
 */

import {
  LayerPromotionManager,
  CompositeLayerManager,
  WillChangeManager,
  GPUMemoryTracker,
} from '../index';

describe('GPU Optimization Module', () => {
  describe('LayerPromotionManager', () => {
    let manager: LayerPromotionManager;

    beforeEach(() => {
      manager = new LayerPromotionManager();
    });

    it('should create manager with default config', () => {
      const m = new LayerPromotionManager();
      expect(m).toBeDefined();
      expect(typeof m.promote).toBe('function');
      expect(typeof m.demote).toBe('function');
    });

    it('should create manager with custom config', () => {
      const m = new LayerPromotionManager({
        maxLayers: 20,
        defaultPriority: 'high',
      });
      expect(m).toBeDefined();
    });

    it('should check if promoted', () => {
      const element = document.createElement('div');
      expect(manager.isPromoted(element)).toBe(false);
    });

    it('should get stats', () => {
      const stats = manager.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.promotedCount).toBe('number');
      expect(typeof stats.maxLayers).toBe('number');
    });

    it('should enable/disable', () => {
      manager.disable();
      expect(manager.isEnabled()).toBe(false);
      manager.enable();
      expect(manager.isEnabled()).toBe(true);
    });

    it('should clear', () => {
      manager.clear();
      const stats = manager.getStats();
      expect(stats.promotedCount).toBe(0);
    });
  });

  describe('CompositeLayerManager', () => {
    let manager: CompositeLayerManager;

    beforeEach(() => {
      manager = new CompositeLayerManager();
    });

    it('should create manager with default config', () => {
      const m = new CompositeLayerManager();
      expect(m).toBeDefined();
      expect(typeof m.createLayer).toBe('function');
      expect(typeof m.removeLayer).toBe('function');
    });

    it('should create manager with custom config', () => {
      const m = new CompositeLayerManager({
        mode: 'multiple',
        enableIsolation: false,
      });
      expect(m).toBeDefined();
    });

    it('should set mode', () => {
      manager.setMode('single');
      const stats = manager.getStats();
      expect(stats.mode).toBe('single');
    });

    it('should check if layered', () => {
      const element = document.createElement('div');
      expect(manager.isLayered(element)).toBe(false);
    });

    it('should get layer count', () => {
      expect(manager.getLayerCount()).toBe(0);
    });

    it('should get stats', () => {
      const stats = manager.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.layerCount).toBe('number');
    });

    it('should clear', () => {
      manager.clear();
      expect(manager.getLayerCount()).toBe(0);
    });
  });

  describe('WillChangeManager', () => {
    let manager: WillChangeManager;

    beforeEach(() => {
      manager = new WillChangeManager();
    });

    it('should create manager with default config', () => {
      const m = new WillChangeManager();
      expect(m).toBeDefined();
      expect(typeof m.hint).toBe('function');
      expect(typeof m.removeHint).toBe('function');
    });

    it('should create manager with custom config', () => {
      const m = new WillChangeManager({
        optimizationLevel: 'aggressive',
        hintDuration: 1000,
      });
      expect(m).toBeDefined();
    });

    it('should check if hinted', () => {
      const element = document.createElement('div');
      expect(manager.isHinted(element)).toBe(false);
    });

    it('should set optimization level', () => {
      manager.setOptimizationLevel('aggressive');
      const stats = manager.getStats();
      expect(stats.optimizationLevel).toBe('aggressive');
    });

    it('should get stats', () => {
      const stats = manager.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.activeHints).toBe('number');
    });

    it('should cleanup all', () => {
      manager.cleanupAll();
      const stats = manager.getStats();
      expect(stats.activeHints).toBe(0);
    });
  });

  describe('GPUMemoryTracker', () => {
    let tracker: GPUMemoryTracker;

    beforeEach(() => {
      tracker = new GPUMemoryTracker();
    });

    it('should create tracker with default config', () => {
      const t = new GPUMemoryTracker();
      expect(t).toBeDefined();
      expect(typeof t.track).toBe('function');
      expect(typeof t.untrack).toBe('function');
    });

    it('should create tracker with custom config', () => {
      const t = new GPUMemoryTracker({
        warningThreshold: 0.6,
        criticalThreshold: 0.8,
      });
      expect(t).toBeDefined();
    });

    it('should track object', () => {
      tracker.track('test-obj', 'texture', 1024);
      expect(tracker.getObject('test-obj')).toBeDefined();
    });

    it('should untrack object', () => {
      tracker.track('test-obj', 'texture', 1024);
      expect(tracker.untrack('test-obj')).toBe(true);
      expect(tracker.getObject('test-obj')).toBeUndefined();
    });

    it('should get stats', () => {
      tracker.track('test-obj', 'texture', 1024);
      const stats = tracker.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.estimatedMemory).toBe('number');
      expect(typeof stats.trackedObjects).toBe('number');
    });

    it('should format bytes', () => {
      expect(tracker.formatBytes(0)).toBe('0 B');
      expect(tracker.formatBytes(1024)).toBe('1 KB');
      expect(tracker.formatBytes(1024 * 1024)).toBe('1 MB');
    });

    it('should get device info', () => {
      const info = tracker.getDeviceInfo();
      expect(info).toBeDefined();
      expect(typeof info.isSupported).toBe('boolean');
    });

    it('should clear', () => {
      tracker.track('test-obj', 'texture', 1024);
      tracker.clear();
      const stats = tracker.getStats();
      expect(stats.trackedObjects).toBe(0);
    });
  });
});
