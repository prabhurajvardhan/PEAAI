/**
 * Tests for Memory Management Module
 */

import {
  MemoryTracker,
  LeakDetector,
  CleanupManager,
  GCHintManager,
} from '../index';

describe('Memory Management Module', () => {
  describe('MemoryTracker', () => {
    let tracker: MemoryTracker;

    beforeEach(() => {
      tracker = new MemoryTracker();
    });

    it('should create tracker with default config', () => {
      const t = new MemoryTracker();
      expect(t).toBeDefined();
      expect(typeof t.getMemoryStats).toBe('function');
      expect(typeof t.takeSnapshot).toBe('function');
    });

    it('should create tracker with custom config', () => {
      const t = new MemoryTracker({
        sampleInterval: 2000,
        historySize: 50,
      });
      expect(t).toBeDefined();
    });

    it('should check if supported', () => {
      const isSupported = tracker.isSupported();
      expect(typeof isSupported).toBe('boolean');
    });

    it('should get memory stats', () => {
      const stats = tracker.getMemoryStats();
      expect(stats === null || typeof stats.usedJSHeapSize === 'number').toBe(true);
    });

    it('should take snapshot', () => {
      const snapshot = tracker.takeSnapshot();
      expect(snapshot === null || snapshot.stats).toBeDefined();
    });

    it('should register update callback', () => {
      const callback = jest.fn();
      const unsubscribe = tracker.onUpdate(callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should register warning callback', () => {
      const callback = jest.fn();
      const unsubscribe = tracker.onWarning(callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should get snapshots', () => {
      const snapshots = tracker.getSnapshots();
      expect(Array.isArray(snapshots)).toBe(true);
    });

    it('should get latest snapshot', () => {
      const snapshot = tracker.getLatestSnapshot();
      expect(snapshot === null || snapshot.stats).toBeDefined();
    });

    it('should format bytes', () => {
      expect(tracker.formatBytes(0)).toBe('0 B');
      expect(tracker.formatBytes(1024)).toBe('1 KB');
      expect(tracker.formatBytes(1024 * 1024)).toBe('1 MB');
    });

    it('should get formatted stats', () => {
      const stats = tracker.getFormattedStats();
      expect(stats === null || typeof stats.used === 'string').toBe(true);
    });

    it('should clear history', () => {
      tracker.takeSnapshot();
      tracker.clearHistory();
      expect(tracker.getSnapshots().length).toBe(0);
    });

    it('should get stats', () => {
      const stats = tracker.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.snapshotCount).toBe('number');
      expect(typeof stats.isSupported).toBe('boolean');
    });
  });

  describe('LeakDetector', () => {
    let detector: LeakDetector;

    beforeEach(() => {
      detector = new LeakDetector();
    });

    it('should create detector with default config', () => {
      const d = new LeakDetector();
      expect(d).toBeDefined();
      expect(typeof d.detectLeaks).toBe('function');
      expect(typeof d.reportLeak).toBe('function');
    });

    it('should create detector with custom config', () => {
      const d = new LeakDetector({
        checkInterval: 5000,
        maxCandidates: 100,
      });
      expect(d).toBeDefined();
    });

    it('should create baseline', () => {
      detector.createBaseline();
      expect(detector.getStats().hasBaseline).toBe(true);
    });

    it('should take snapshot', () => {
      const snapshot = detector.takeSnapshot();
      expect(snapshot).toBeDefined();
      expect(typeof snapshot.get('eventListeners')).toBe('number');
    });

    it('should detect leaks', () => {
      detector.createBaseline();
      const leaks = detector.detectLeaks();
      expect(Array.isArray(leaks)).toBe(true);
    });

    it('should report leak', () => {
      const id = detector.reportLeak('timer', 'Test leak');
      expect(typeof id).toBe('string');
    });

    it('should get candidates', () => {
      const candidates = detector.getCandidates();
      expect(Array.isArray(candidates)).toBe(true);
    });

    it('should get candidates by type', () => {
      const candidates = detector.getCandidatesByType('timer');
      expect(Array.isArray(candidates)).toBe(true);
    });

    it('should clear candidates', () => {
      detector.clearCandidates();
      expect(detector.getCandidates().length).toBe(0);
    });

    it('should get stats', () => {
      const stats = detector.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.candidateCount).toBe('number');
    });

    it('should reset', () => {
      detector.reportLeak('timer', 'Test leak');
      detector.reset();
      expect(detector.getCandidates().length).toBe(0);
    });
  });

  describe('CleanupManager', () => {
    let manager: CleanupManager;

    beforeEach(() => {
      manager = new CleanupManager();
    });

    it('should create manager with default config', () => {
      const m = new CleanupManager();
      expect(m).toBeDefined();
      expect(typeof m.register).toBe('function');
      expect(typeof m.cleanup).toBe('function');
    });

    it('should create manager with custom config', () => {
      const m = new CleanupManager({
        enableLogging: true,
        timeout: 10000,
      });
      expect(m).toBeDefined();
    });

    it('should register hook', () => {
      const hook = jest.fn();
      const id = manager.register('test-hook', hook);
      expect(typeof id).toBe('string');
      expect(manager.has(id)).toBe(true);
    });

    it('should register once hook', () => {
      const hook = jest.fn();
      const id = manager.once('test-once', hook);
      expect(typeof id).toBe('string');
    });

    it('should unregister hook', () => {
      const hook = jest.fn();
      const id = manager.register('test-hook', hook);
      expect(manager.unregister(id)).toBe(true);
      expect(manager.has(id)).toBe(false);
    });

    it('should check if registered', () => {
      const hook = jest.fn();
      manager.register('test-hook', hook);
      expect(manager.isRegistered('test-hook')).toBe(true);
    });

    it('should get hooks', () => {
      const hooks = manager.getHooks();
      expect(Array.isArray(hooks)).toBe(true);
    });

    it('should get pending count', () => {
      const hook = jest.fn();
      manager.register('test-hook', hook);
      expect(manager.getPendingCount()).toBe(1);
    });

    it('should clear', () => {
      manager.register('test-hook', jest.fn());
      manager.clear();
      expect(manager.getPendingCount()).toBe(0);
    });

    it('should get stats', () => {
      const stats = manager.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalHooks).toBe('number');
    });
  });

  describe('GCHintManager', () => {
    let manager: GCHintManager;

    beforeEach(() => {
      manager = new GCHintManager();
    });

    it('should create manager with default config', () => {
      const m = new GCHintManager();
      expect(m).toBeDefined();
      expect(typeof m.requestGC).toBe('function');
      expect(typeof m.startAutoHints).toBe('function');
    });

    it('should create manager with custom config', () => {
      const m = new GCHintManager({
        autoHintInterval: 60000,
        heapThreshold: 0.9,
      });
      expect(m).toBeDefined();
    });

    it('should request GC', () => {
      expect(() => manager.requestGC()).not.toThrow();
    });

    it('should start and stop auto hints', () => {
      manager.startAutoHints();
      expect(manager.isAutoHintsEnabled()).toBe(true);
      manager.stopAutoHints();
      expect(manager.isAutoHintsEnabled()).toBe(false);
    });

    it('should optimize array', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(() => manager.optimizeArray(arr)).not.toThrow();
    });

    it('should clear map', () => {
      const map = new Map([['a', 1], ['b', 2]]);
      expect(() => manager.clearMap(map)).not.toThrow();
      expect(map.size).toBe(0);
    });

    it('should clear set', () => {
      const set = new Set([1, 2, 3]);
      expect(() => manager.clearSet(set)).not.toThrow();
      expect(set.size).toBe(0);
    });

    it('should suggest cleanup', () => {
      const suggestions = manager.suggestCleanup();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should get hint history', () => {
      manager.requestGC();
      const history = manager.getHintHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should get recent hints', () => {
      const hints = manager.getRecentHints(5);
      expect(Array.isArray(hints)).toBe(true);
    });

    it('should clear history', () => {
      manager.requestGC();
      manager.clearHistory();
      expect(manager.getHintHistory().length).toBe(0);
    });

    it('should get stats', () => {
      const stats = manager.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.hintCount).toBe('number');
    });

    it('should reset', () => {
      manager.startAutoHints();
      manager.reset();
      expect(manager.isAutoHintsEnabled()).toBe(false);
    });
  });
});
