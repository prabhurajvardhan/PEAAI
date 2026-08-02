/**
 * Tests for Render Optimization Module
 */

import {
  DirtyRegionTracker,
  RenderBatcher,
  FrameSkipController,
  PerformanceProfiler,
} from '../index';

describe('Render Optimization Module', () => {
  describe('DirtyRegionTracker', () => {
    let tracker: DirtyRegionTracker;

    beforeEach(() => {
      tracker = new DirtyRegionTracker();
    });

    it('should create tracker with default config', () => {
      const t = new DirtyRegionTracker();
      expect(t).toBeDefined();
      expect(typeof t.markDirty).toBe('function');
      expect(typeof t.getDirtyRegions).toBe('function');
      expect(typeof t.frame).toBe('function');
    });

    it('should create tracker with custom config', () => {
      const t = new DirtyRegionTracker({
        maxRegions: 10,
        mergeDistance: 5,
      });
      expect(t).toBeDefined();
    });

    it('should mark dirty region', () => {
      tracker.markDirty(10, 20, 100, 50);
      expect(tracker.hasDirtyRegions()).toBe(true);
    });

    it('should mark dirty rect', () => {
      tracker.markDirtyRect({ x: 0, y: 0, width: 100, height: 100 });
      expect(tracker.hasDirtyRegions()).toBe(true);
    });

    it('should mark full redraw', () => {
      tracker.markFullRedraw();
      expect(tracker.needsFullRedraw()).toBe(true);
    });

    it('should get dirty regions', () => {
      tracker.markDirty(10, 20, 100, 50);
      const regions = tracker.getDirtyRegions();
      expect(Array.isArray(regions)).toBe(true);
      expect(regions.length).toBeGreaterThan(0);
    });

    it('should get stats', () => {
      tracker.markDirty(10, 20, 100, 50);
      const stats = tracker.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.dirtyCount).toBe('number');
      expect(typeof stats.totalDirtyArea).toBe('number');
    });

    it('should frame', () => {
      tracker.markDirty(10, 20, 100, 50);
      tracker.frame();
      expect(tracker.getDirtyRegions().length).toBe(0);
    });

    it('should reset', () => {
      tracker.markDirty(10, 20, 100, 50);
      tracker.reset();
      expect(tracker.getDirtyRegions().length).toBe(0);
    });

    it('should union regions', () => {
      const regions = [
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 20, y: 20, width: 10, height: 10 },
      ];
      const union = tracker.unionRegions(regions);
      expect(union).toBeDefined();
      expect(union!.x).toBe(0);
      expect(union!.y).toBe(0);
      expect(union!.width).toBe(30);
      expect(union!.height).toBe(30);
    });
  });

  describe('RenderBatcher', () => {
    let batcher: RenderBatcher;

    beforeEach(() => {
      jest.useFakeTimers();
      batcher = new RenderBatcher();
    });

    afterEach(() => {
      jest.useRealTimers();
      batcher.clear();
    });

    it('should create batcher with default config', () => {
      const b = new RenderBatcher();
      expect(b).toBeDefined();
      expect(typeof b.add).toBe('function');
      expect(typeof b.flush).toBe('function');
    });

    it('should create batcher with custom config', () => {
      const b = new RenderBatcher({
        maxBatchSize: 50,
        maxWaitTime: 10,
      });
      expect(b).toBeDefined();
    });

    it('should add item', () => {
      const render = jest.fn();
      batcher.add({ id: 'test-item', render, priority: 1 });
      expect(batcher.has('test-item')).toBe(true);
    });

    it('should remove item', () => {
      const render = jest.fn();
      batcher.add({ id: 'test-item', render, priority: 1 });
      expect(batcher.remove('test-item')).toBe(true);
      expect(batcher.has('test-item')).toBe(false);
    });

    it('should flush', () => {
      const render = jest.fn();
      batcher.addRender('test-item', render, 1);
      batcher.flush();
      expect(render).toHaveBeenCalled();
    });

    it('should check size', () => {
      expect(batcher.size()).toBe(0);
      batcher.add({ id: 'test-item', render: jest.fn(), priority: 1 });
      expect(batcher.size()).toBe(1);
    });

    it('should clear', () => {
      batcher.add({ id: 'test-item', render: jest.fn(), priority: 1 });
      batcher.clear();
      expect(batcher.isEmpty()).toBe(true);
    });

    it('should get stats', () => {
      const stats = batcher.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.pendingCount).toBe('number');
    });
  });

  describe('FrameSkipController', () => {
    let tracker: DirtyRegionTracker;
    let controller: FrameSkipController;

    beforeEach(() => {
      tracker = new DirtyRegionTracker();
      controller = new FrameSkipController(tracker);
    });

    it('should create controller with default config', () => {
      const c = new FrameSkipController(tracker);
      expect(c).toBeDefined();
      expect(typeof c.shouldRender).toBe('function');
      expect(typeof c.frame).toBe('function');
    });

    it('should create controller with custom config', () => {
      const c = new FrameSkipController(tracker, {
        skipThreshold: 0.2,
        maxSkipsBeforeForce: 5,
      });
      expect(c).toBeDefined();
    });

    it('should check if frame should render', () => {
      tracker.markDirty(10, 20, 100, 50);
      const shouldRender = controller.shouldRender();
      expect(typeof shouldRender).toBe('boolean');
    });

    it('should get stats', () => {
      const stats = controller.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.frameCount).toBe('number');
      expect(typeof stats.skipRatio).toBe('number');
    });

    it('should force render', () => {
      controller.forceRender();
      expect(controller.shouldRender()).toBe(true);
    });

    it('should reset', () => {
      controller.reset();
      const stats = controller.getStats();
      expect(stats.frameCount).toBe(0);
    });
  });

  describe('PerformanceProfiler', () => {
    let profiler: PerformanceProfiler;

    beforeEach(() => {
      profiler = new PerformanceProfiler();
    });

    it('should create profiler', () => {
      expect(profiler).toBeDefined();
      expect(typeof profiler.mark).toBe('function');
      expect(typeof profiler.measure).toBe('function');
      expect(typeof profiler.recordFrame).toBe('function');
    });

    it('should start and stop', () => {
      profiler.start();
      expect(profiler.isActive()).toBe(true);
      profiler.stop();
      expect(profiler.isActive()).toBe(false);
    });

    it('should mark', () => {
      profiler.mark('test-mark');
      profiler.mark('test-mark-2');
    });

    it('should measure', () => {
      profiler.mark('start');
      profiler.mark('end');
      profiler.measure('test-measure', 'start', 'end');
    });

    it('should record frame', () => {
      profiler.recordFrame(16.67);
      const stats = profiler.getStats();
      expect(stats.totalFrames).toBe(1);
    });

    it('should get stats', () => {
      profiler.recordFrame(16.67);
      profiler.recordFrame(15.5);
      const stats = profiler.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalFrames).toBe(2);
      expect(typeof stats.avgFrameTime).toBe('number');
    });

    it('should set budgets', () => {
      profiler.setBudgets({ frameTime: 20 });
      const stats = profiler.getStats();
      expect(stats).toBeDefined();
    });

    it('should clear', () => {
      profiler.mark('test');
      profiler.recordFrame(16.67);
      profiler.clear();
      const measures = profiler.getMeasures();
      expect(measures.length).toBe(0);
    });
  });
});
