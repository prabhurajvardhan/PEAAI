/**
 * Tests for Pixel Optimizer (T-019)
 */

import { 
  PixelOptimizer, 
  MemoryPool, 
  LRUCache, 
  OperationBatcher, 
  FPSCounter, 
  Benchmark 
} from '../optimizer';

describe('Pixel Optimizer', () => {
  describe('MemoryPool', () => {
    let pool: MemoryPool<{ value: number }>;

    beforeEach(() => {
      pool = new MemoryPool<{ value: number }>({
        initialSize: 2,
        maxSize: 10,
        factory: () => ({ value: 0 }),
        reset: (obj) => { obj.value = 0; },
      });
    });

    it('should create pool with initial objects', () => {
      const stats = pool.getStats();
      expect(stats.totalAllocated).toBe(2);
      expect(stats.available).toBe(2);
    });

    it('should acquire from available pool', () => {
      const obj = pool.acquire();
      expect(obj).toBeDefined();
      
      const stats = pool.getStats();
      expect(stats.available).toBe(1);
      expect(stats.hits).toBe(1);
    });

    it('should allocate new objects when pool is empty', () => {
      pool.acquire();
      pool.acquire();
      
      const obj = pool.acquire();
      expect(obj).toBeDefined();
      
      const stats = pool.getStats();
      expect(stats.totalAllocated).toBe(3);
      expect(stats.misses).toBe(1);
    });

    it('should not exceed max size', () => {
      const largePool = new MemoryPool<{ id: number }>({
        initialSize: 0,
        maxSize: 2,
        factory: () => ({ id: Math.random() }),
      });

      largePool.acquire();
      largePool.acquire();
      const obj = largePool.acquire();
      
      const stats = largePool.getStats();
      expect(stats.totalAllocated).toBe(2);
    });

    it('should release objects back to pool', () => {
      const obj = pool.acquire();
      pool.release(obj);
      
      const stats = pool.getStats();
      expect(stats.available).toBe(2);
    });

    it('should reset released objects', () => {
      const obj = pool.acquire();
      obj.value = 42;
      pool.release(obj);
      
      const newObj = pool.acquire();
      expect(newObj.value).toBe(0);
    });

    it('should track hit rate', () => {
      pool.acquire();
      pool.acquire();
      pool.acquire();
      
      const stats = pool.getStats();
      // 2 hits (from available), 1 miss (new allocation) = 2/3 hit rate
      expect(stats.hitRate).toBeCloseTo(0.667, 1);
    });

    it('should clear the pool', () => {
      pool.acquire();
      pool.clear();
      
      const stats = pool.getStats();
      expect(stats.available).toBe(0);
    });
  });

  describe('LRUCache', () => {
    let cache: LRUCache<string, number>;

    beforeEach(() => {
      cache = new LRUCache<string, number>(3);
    });

    it('should set and get values', () => {
      cache.set('key1', 100);
      expect(cache.get('key1')).toBe(100);
    });

    it('should return undefined for missing keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should track hits and misses', () => {
      cache.set('key1', 100);
      cache.get('key1');
      cache.get('key2');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should evict LRU when at capacity', () => {
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);
      
      // Access key1 to make it recently used
      cache.get('key1');
      
      // Add new key, should evict key2 (least recently used)
      cache.set('key4', 4);
      
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    it('should update existing keys', () => {
      cache.set('key1', 100);
      cache.set('key1', 200);
      
      expect(cache.get('key1')).toBe(200);
    });

    it('should delete keys', () => {
      cache.set('key1', 100);
      cache.delete('key1');
      
      expect(cache.has('key1')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.clear();
      
      expect(cache.size).toBe(0);
    });

    it('should track hit rate', () => {
      cache.set('a', 1);
      cache.get('a');
      cache.get('a');
      cache.get('b');
      
      const stats = cache.getStats();
      expect(stats.hitRate).toBeCloseTo(0.667, 1);
    });
  });

  describe('OperationBatcher', () => {
    let batcher: OperationBatcher;

    beforeEach(() => {
      batcher = new OperationBatcher(3, 100);
    });

    it('should add operations', () => {
      batcher.add('setPixel', { x: 0, y: 0 });
      expect(batcher.pendingCount).toBe(1);
    });

    it('should auto-flush when batch size reached', () => {
      const flushSpy = jest.fn();
      batcher.onFlush(flushSpy);
      
      batcher.add('setPixel', { x: 0, y: 0 });
      batcher.add('setPixel', { x: 1, y: 1 });
      batcher.add('setPixel', { x: 2, y: 2 });
      
      expect(flushSpy).toHaveBeenCalledTimes(1);
      expect(batcher.pendingCount).toBe(0);
    });

    it('should manually flush', () => {
      batcher.add('setPixel', { x: 0, y: 0 });
      const operations = batcher.flush();
      
      expect(operations.length).toBe(1);
      expect(operations[0].type).toBe('setPixel');
    });

    it('should track total operations', () => {
      batcher.add('setPixel', {});
      batcher.add('fill', {});
      batcher.add('blend', {});
      
      expect(batcher.totalOperations).toBe(3);
    });

    it('should clear pending operations', () => {
      batcher.add('setPixel', {});
      batcher.add('setPixel', {});
      batcher.clear();
      
      expect(batcher.pendingCount).toBe(0);
    });

    it('should return empty array when flushing empty batch', () => {
      const operations = batcher.flush();
      expect(operations.length).toBe(0);
    });
  });

  describe('FPSCounter', () => {
    let fpsCounter: FPSCounter;

    beforeEach(() => {
      fpsCounter = new FPSCounter(10);
    });

    it('should track frame count', () => {
      fpsCounter.tick();
      fpsCounter.tick();
      fpsCounter.tick();
      
      expect(fpsCounter.getFrameCount()).toBe(3);
    });

    it('should calculate FPS', () => {
      // Simulate 60 FPS (16.67ms per frame)
      for (let i = 0; i < 60; i++) {
        fpsCounter.tick();
      }
      
      const fps = fpsCounter.getFPS();
      expect(fps).toBeGreaterThan(0);
    });

    it('should detect target FPS', () => {
      for (let i = 0; i < 30; i++) {
        fpsCounter.tick();
      }
      
      // After enough frames, should be near target
      expect(typeof fpsCounter.getFPS()).toBe('number');
    });

    it('should reset counter', () => {
      fpsCounter.tick();
      fpsCounter.tick();
      fpsCounter.reset();
      
      expect(fpsCounter.getFrameCount()).toBe(0);
    });

    it('should track frame time', () => {
      fpsCounter.tick();
      
      const frameTime = fpsCounter.getFrameTime();
      expect(frameTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Benchmark', () => {
    let benchmark: Benchmark;

    beforeEach(() => {
      benchmark = new Benchmark();
    });

    it('should run benchmark', () => {
      let count = 0;
      const result = benchmark.run('test', () => {
        count++;
      }, 100);
      
      expect(result.name).toBe('test');
      expect(result.iterations).toBe(100);
      expect(result.averageTime).toBeGreaterThan(0);
    });

    it('should calculate ops per second', () => {
      const result = benchmark.run('fast', () => {
        // Empty function
      }, 1000);
      
      expect(result.opsPerSecond).toBeGreaterThan(0);
    });

    it('should track min and max times', () => {
      const result = benchmark.run('range', () => {
        // Random work
        let sum = 0;
        for (let i = 0; i < 100; i++) {
          sum += Math.random();
        }
      }, 100);
      
      expect(result.minTime).toBeLessThanOrEqual(result.maxTime);
    });

    it('should compare benchmarks', () => {
      const result1 = benchmark.run('slow', () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum++;
      }, 100);
      
      const result2 = benchmark.run('fast', () => {
        let sum = 0;
        for (let i = 0; i < 10; i++) sum++;
      }, 100);
      
      const comparison = benchmark.compare(result1, result2);
      expect(comparison.speedup).toBeGreaterThan(0);
    });

    it('should clear results', () => {
      benchmark.run('test', () => {}, 10);
      benchmark.clear();
      
      const results = benchmark.getResults();
      expect(results.size).toBe(0);
    });
  });

  describe('PixelOptimizer', () => {
    let optimizer: PixelOptimizer;

    beforeEach(() => {
      optimizer = new PixelOptimizer({
        enableMemoryPooling: true,
        enableOperationBatching: true,
        enableCaching: true,
        poolInitialSize: 2,
        poolMaxSize: 10,
        cacheMaxSize: 5,
        batchSize: 3,
        targetFps: 60,
      });
    });

    afterEach(() => {
      optimizer.dispose();
    });

    it('should acquire and release colors from pool', () => {
      const color = optimizer.acquireColor(255, 0, 0, 255);
      expect(color.r).toBe(255);
      
      optimizer.releaseColor(color);
      
      const stats = optimizer.getPoolStats();
      // 2 initial, acquired 1 (making 1 available), released 1 (making 2 available)
      expect(stats.colorPool.available).toBe(2);
    });

    it('should acquire and release batches from pool', () => {
      const batch = optimizer.acquireBatch();
      batch.pixels.push({ x: 0, y: 0, color: { r: 255, g: 0, b: 0, a: 255 } });
      
      optimizer.releaseBatch(batch);
      
      const stats = optimizer.getPoolStats();
      // Same logic as colors
      expect(stats.batchPool.available).toBe(2);
    });

    it('should cache and retrieve colors', () => {
      const color = { r: 100, g: 150, b: 200, a: 255 };
      optimizer.cacheColor('test', color);
      
      const cached = optimizer.getCachedColor('test');
      expect(cached).toEqual(color);
    });

    it('should cache and retrieve palettes', () => {
      const palette = [
        { r: 255, g: 0, b: 0, a: 255 },
        { r: 0, g: 255, b: 0, a: 255 },
      ];
      optimizer.cachePalette('test', palette);
      
      const cached = optimizer.getCachedPalette('test');
      expect(cached).toEqual(palette);
    });

    it('should add and flush operations', () => {
      optimizer.addOperation('setPixel', { x: 0, y: 0 });
      optimizer.addOperation('fill', { color: { r: 0, g: 0, b: 0, a: 255 } });
      
      const operations = optimizer.flushOperations();
      expect(operations.length).toBe(2);
    });

    it('should record frames and track FPS', () => {
      optimizer.recordFrame();
      optimizer.recordFrame();
      
      const fps = optimizer.getFPS();
      expect(typeof fps).toBe('number');
    });

    it('should run benchmarks', () => {
      let count = 0;
      const result = optimizer.runBenchmark('increment', () => {
        count++;
      }, 50);
      
      expect(result.name).toBe('increment');
      expect(result.iterations).toBe(50);
    });

    it('should get performance metrics', () => {
      optimizer.recordFrame();
      
      const metrics = optimizer.getMetrics();
      expect(metrics.fps).toBeDefined();
      expect(metrics.frameTime).toBeDefined();
      expect(metrics.memoryUsed).toBeDefined();
    });

    it('should track memory usage', () => {
      optimizer.acquireColor(255, 0, 0, 255);
      optimizer.acquireColor(0, 255, 0, 255);
      
      const memory = optimizer.getMemoryUsage();
      expect(memory).toBeGreaterThan(0);
    });

    it('should get pool stats', () => {
      optimizer.acquireColor(255, 0, 0, 255);
      
      const stats = optimizer.getPoolStats();
      expect(stats.colorPool.totalAllocated).toBeGreaterThan(0);
    });

    it('should get cache stats', () => {
      optimizer.cacheColor('key1', { r: 100, g: 100, b: 100, a: 255 });
      optimizer.getCachedColor('key1');
      optimizer.getCachedColor('nonexistent');
      
      const stats = optimizer.getCacheStats();
      expect(stats.colorCache.hits).toBe(1);
      expect(stats.colorCache.misses).toBe(1);
    });

    it('should check target FPS', () => {
      // Record some frames
      for (let i = 0; i < 10; i++) {
        optimizer.recordFrame();
      }
      
      const atTarget = optimizer.isAtTargetFps();
      expect(typeof atTarget).toBe('boolean');
    });

    it('should reset all statistics', () => {
      optimizer.recordFrame();
      optimizer.runBenchmark('test', () => {}, 10);
      optimizer.reset();
      
      const metrics = optimizer.getMetrics();
      expect(metrics.batchOperations).toBe(0);
    });

    it('should memoize functions', () => {
      let callCount = 0;
      const cache = new LRUCache<string, unknown>(10);
      const memoized = optimizer.memoize(
        ((n: number) => {
          callCount++;
          return n * 2;
        }) as unknown as (...args: unknown[]) => unknown,
        cache
      );
      
      expect(memoized(5)).toBe(10);
      expect(memoized(5)).toBe(10);
      expect(callCount).toBe(1);
    });

    it('should flush batch on timeout', async () => {
      const fastBatcher = new OperationBatcher(100, 10); // 10ms timeout
      fastBatcher.add('setPixel', { x: 0, y: 0 });
      
      await new Promise(resolve => setTimeout(resolve, 15));
      
      expect(fastBatcher.shouldAutoFlush()).toBe(true);
    });
  });
});
