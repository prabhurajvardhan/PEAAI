/**
 * Pixel Optimizer - Performance optimization for pixel graphics
 * 
 * Features:
 * - Memory pooling (object pools for reusable objects)
 * - Operation batching (group pixel operations)
 * - Cache optimization (LRU cache for colors, palettes)
 * - Performance benchmarks (FPS tracking, timing)
 */

import { IColor } from '../types';

/**
 * Memory pool for reusing objects
 */
export interface PoolConfig<T> {
  initialSize?: number;
  maxSize?: number;
  factory: () => T;
  reset?: (obj: T) => void;
}

/**
 * Cached item with metadata
 */
interface CacheItem<T> {
  value: T;
  accessCount: number;
  lastAccess: number;
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  opsPerSecond: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsed: number;
  memoryPoolHits: number;
  memoryPoolMisses: number;
  cacheHitRate: number;
  batchOperations: number;
}

/**
 * Operation type for batching
 */
export type OperationType = 
  | 'setPixel'
  | 'getPixel'
  | 'fill'
  | 'blend'
  | 'copy'
  | 'clear';

/**
 * Batched operation
 */
export interface BatchedOperation {
  type: OperationType;
  timestamp: number;
  data: unknown;
}

/**
 * Configuration for the optimizer
 */
export interface OptimizerConfig {
  enableMemoryPooling?: boolean;
  enableOperationBatching?: boolean;
  enableCaching?: boolean;
  poolInitialSize?: number;
  poolMaxSize?: number;
  cacheMaxSize?: number;
  batchSize?: number;
  batchTimeout?: number;
  targetFps?: number;
}

const DEFAULT_CONFIG: Required<Omit<OptimizerConfig, 'cacheMaxSize'>> & { cacheMaxSize: number } = {
  enableMemoryPooling: true,
  enableOperationBatching: true,
  enableCaching: true,
  poolInitialSize: 16,
  poolMaxSize: 256,
  cacheMaxSize: 1024,
  batchSize: 64,
  batchTimeout: 16, // ~60fps
  targetFps: 60,
};

/**
 * Memory Pool for reusing objects
 */
export class MemoryPool<T> {
  private pool: T[];
  private available: T[];
  private factory: () => T;
  private reset?: (obj: T) => void;
  private maxSize: number;
  private totalAllocated: number;
  private hits: number;
  private misses: number;

  constructor(config: PoolConfig<T>) {
    this.factory = config.factory;
    this.reset = config.reset;
    this.maxSize = config.maxSize ?? 256;
    this.pool = [];
    this.available = [];
    this.totalAllocated = 0;
    this.hits = 0;
    this.misses = 0;

    // Pre-allocate initial objects
    const initialSize = config.initialSize ?? 0;
    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.factory());
      this.totalAllocated++;
    }
  }

  /**
   * Acquire an object from the pool
   */
  acquire(): T {
    if (this.available.length > 0) {
      this.hits++;
      return this.available.pop()!;
    }

    if (this.totalAllocated < this.maxSize) {
      this.misses++;
      this.totalAllocated++;
      return this.factory();
    }

    // At max capacity, create without pooling
    this.misses++;
    return this.factory();
  }

  /**
   * Release an object back to the pool
   */
  release(obj: T): void {
    if (this.reset) {
      this.reset(obj);
    }

    if (this.available.length < this.maxSize) {
      this.available.push(obj);
    }
  }

  /**
   * Clear the pool
   */
  clear(): void {
    this.pool = [];
    this.available = [];
  }

  /**
   * Get pool statistics
   */
  getStats(): { totalAllocated: number; available: number; hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      totalAllocated: this.totalAllocated,
      available: this.available.length,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }
}

/**
 * LRU Cache implementation
 */
export class LRUCache<K, V> {
  private cache: Map<K, CacheItem<V>>;
  private maxSize: number;
  private accessCount: number;
  private hits: number;
  private misses: number;

  constructor(maxSize: number = 1024) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.accessCount = 0;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get a value from cache
   */
  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (item) {
      this.hits++;
      this.accessCount++;
      item.accessCount++;
      item.lastAccess = this.accessCount;
      return item.value;
    }
    this.misses++;
    return undefined;
  }

  /**
   * Set a value in cache
   */
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      const item = this.cache.get(key)!;
      item.value = value;
      item.accessCount++;
      item.lastAccess = ++this.accessCount;
      return;
    }

    // Evict least recently used if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      accessCount: 1,
      lastAccess: ++this.accessCount,
    });
  }

  /**
   * Check if key exists in cache
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a key from cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    let lruKey: K | null = null;
    let lruTime = Infinity;

    for (const [key, item] of this.cache) {
      if (item.lastAccess < lruTime) {
        lruTime = item.lastAccess;
        lruKey = key;
      }
    }

    if (lruKey !== null) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }
}

/**
 * Operation Batcher for grouping operations
 */
export class OperationBatcher {
  private pending: BatchedOperation[];
  private batchSize: number;
  private batchTimeout: number;
  private lastFlush: number;
  private flushCallback?: (operations: BatchedOperation[]) => void;
  private operationsCount: number;

  constructor(batchSize: number = 64, batchTimeout: number = 16) {
    this.pending = [];
    this.batchSize = batchSize;
    this.batchTimeout = batchTimeout;
    this.lastFlush = performance.now();
    this.operationsCount = 0;
  }

  /**
   * Add an operation to the batch
   */
  add(type: OperationType, data: unknown): void {
    this.pending.push({
      type,
      timestamp: performance.now(),
      data,
    });
    this.operationsCount++;

    // Auto-flush if batch is full
    if (this.pending.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Set the flush callback
   */
  onFlush(callback: (operations: BatchedOperation[]) => void): void {
    this.flushCallback = callback;
  }

  /**
   * Flush pending operations
   */
  flush(): BatchedOperation[] {
    if (this.pending.length === 0) {
      return [];
    }

    const operations = [...this.pending];
    
    if (this.flushCallback) {
      this.flushCallback(operations);
    }

    this.pending = [];
    this.lastFlush = performance.now();
    
    return operations;
  }

  /**
   * Check if batch should auto-flush
   */
  shouldAutoFlush(): boolean {
    const elapsed = performance.now() - this.lastFlush;
    return this.pending.length > 0 && elapsed >= this.batchTimeout;
  }

  /**
   * Get pending operations count
   */
  get pendingCount(): number {
    return this.pending.length;
  }

  /**
   * Get total operations processed
   */
  get totalOperations(): number {
    return this.operationsCount;
  }

  /**
   * Clear pending operations
   */
  clear(): void {
    this.pending = [];
  }
}

/**
 * Performance Benchmark utility
 */
export class Benchmark {
  private results: Map<string, number[]>;

  constructor() {
    this.results = new Map();
  }

  /**
   * Run a benchmark
   */
  run(name: string, fn: () => void, iterations: number = 1000): BenchmarkResult {
    const times: number[] = [];
    
    // Warmup
    for (let i = 0; i < 10; i++) {
      fn();
    }

    // Actual benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      const end = performance.now();
      times.push(end - start);
    }

    const totalTime = times.reduce((a, b) => a + b, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const opsPerSecond = 1000 / averageTime;

    this.results.set(name, times);

    return {
      name,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      opsPerSecond,
    };
  }

  /**
   * Compare two benchmark results
   */
  compare(result1: BenchmarkResult, result2: BenchmarkResult): { faster: string; speedup: number } {
    const speedup = result2.averageTime / result1.averageTime;
    return {
      faster: result1.averageTime < result2.averageTime ? result1.name : result2.name,
      speedup,
    };
  }

  /**
   * Get all stored results
   */
  getResults(): Map<string, number[]> {
    return this.results;
  }

  /**
   * Clear all results
   */
  clear(): void {
    this.results.clear();
  }
}

/**
 * FPS Counter
 */
export class FPSCounter {
  private frameTimes: number[];
  private maxFrames: number;
  private lastFrameTime: number;
  private frameCount: number;
  private fps: number;
  private frameTime: number;

  constructor(maxFrames: number = 60) {
    this.frameTimes = [];
    this.maxFrames = maxFrames;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fps = 0;
    this.frameTime = 0;
  }

  /**
   * Record a frame
   */
  tick(): void {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.frameTime = delta;

    this.frameTimes.push(delta);
    if (this.frameTimes.length > this.maxFrames) {
      this.frameTimes.shift();
    }

    this.frameCount++;
    this.updateFPS();
  }

  /**
   * Update FPS calculation
   */
  private updateFPS(): void {
    if (this.frameTimes.length === 0) {
      this.fps = 0;
      return;
    }

    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Get average frame time in ms
   */
  getFrameTime(): number {
    return this.frameTime;
  }

  /**
   * Get total frames rendered
   */
  getFrameCount(): number {
    return this.frameCount;
  }

  /**
   * Check if running at target FPS
   */
  isAtTargetFps(targetFps: number): boolean {
    return this.fps >= targetFps;
  }

  /**
   * Reset the counter
   */
  reset(): void {
    this.frameTimes = [];
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fps = 0;
    this.frameTime = 0;
  }
}

/**
 * Pixel Optimizer - Main optimizer class
 */
export class PixelOptimizer {
  private config: typeof DEFAULT_CONFIG;
  
  // Pools
  private colorPool: MemoryPool<IColor>;
  private batchPool: MemoryPool<{ pixels: Array<{ x: number; y: number; color: IColor }> }>;
  
  // Caches
  private colorCache: LRUCache<string, IColor>;
  private paletteCache: LRUCache<string, IColor[]>;
  
  // Batching
  private batcher: OperationBatcher;
  
  // Performance tracking
  private fpsCounter: FPSCounter;
  private benchmarks: Benchmark;

  constructor(config: OptimizerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize memory pools
    this.colorPool = new MemoryPool<IColor>({
      initialSize: this.config.poolInitialSize,
      maxSize: this.config.poolMaxSize,
      factory: () => ({ r: 0, g: 0, b: 0, a: 0 }),
      reset: (c) => { c.r = 0; c.g = 0; c.b = 0; c.a = 0; },
    });

    this.batchPool = new MemoryPool<{ pixels: Array<{ x: number; y: number; color: IColor }> }>({
      initialSize: this.config.poolInitialSize,
      maxSize: this.config.poolMaxSize,
      factory: () => ({ pixels: [] }),
      reset: (b) => { b.pixels.length = 0; },
    });

    // Initialize caches
    this.colorCache = new LRUCache(this.config.cacheMaxSize);
    this.paletteCache = new LRUCache(this.config.cacheMaxSize);

    // Initialize batcher
    this.batcher = new OperationBatcher(this.config.batchSize, this.config.batchTimeout);

    // Initialize performance tracking
    this.fpsCounter = new FPSCounter();
    this.benchmarks = new Benchmark();
  }

  /**
   * Get a color object from pool
   */
  acquireColor(r: number = 0, g: number = 0, b: number = 0, a: number = 255): IColor {
    const color = this.colorPool.acquire();
    color.r = r;
    color.g = g;
    color.b = b;
    color.a = a;
    return color;
  }

  /**
   * Release a color object back to pool
   */
  releaseColor(color: IColor): void {
    this.colorPool.release(color);
  }

  /**
   * Get a batch object from pool
   */
  acquireBatch(): { pixels: Array<{ x: number; y: number; color: IColor }> } {
    return this.batchPool.acquire();
  }

  /**
   * Release a batch object back to pool
   */
  releaseBatch(batch: { pixels: Array<{ x: number; y: number; color: IColor }> }): void {
    this.batchPool.release(batch);
  }

  /**
   * Add operation to batch
   */
  addOperation(type: OperationType, data: unknown): void {
    this.batcher.add(type, data);
  }

  /**
   * Flush batched operations
   */
  flushOperations(): BatchedOperation[] {
    return this.batcher.flush();
  }

  /**
   * Check if batch should auto-flush
   */
  shouldFlushBatch(): boolean {
    return this.batcher.shouldAutoFlush();
  }

  /**
   * Get cached color
   */
  getCachedColor(key: string): IColor | undefined {
    return this.colorCache.get(key);
  }

  /**
   * Cache a color
   */
  cacheColor(key: string, color: IColor): void {
    this.colorCache.set(key, color);
  }

  /**
   * Get cached palette
   */
  getCachedPalette(key: string): IColor[] | undefined {
    return this.paletteCache.get(key);
  }

  /**
   * Cache a palette
   */
  cachePalette(key: string, palette: IColor[]): void {
    this.paletteCache.set(key, palette);
  }

  /**
   * Record a frame (for FPS tracking)
   */
  recordFrame(): void {
    this.fpsCounter.tick();
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fpsCounter.getFPS();
  }

  /**
   * Run a benchmark
   */
  runBenchmark(name: string, fn: () => void, iterations?: number): BenchmarkResult {
    return this.benchmarks.run(name, fn, iterations);
  }

  /**
   * Get all performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      fps: this.fpsCounter.getFPS(),
      frameTime: this.fpsCounter.getFrameTime(),
      memoryUsed: this.getMemoryUsage(),
      memoryPoolHits: this.colorPool.getStats().hits,
      memoryPoolMisses: this.colorPool.getStats().misses,
      cacheHitRate: this.colorCache.getStats().hitRate,
      batchOperations: this.batcher.totalOperations,
    };
  }

  /**
   * Get memory usage estimate
   */
  getMemoryUsage(): number {
    const colorPoolStats = this.colorPool.getStats();
    const batchPoolStats = this.batchPool.getStats();
    
    // Estimate: each color is 4 bytes * 4 components + overhead
    // Each batch is array of pixel refs + overhead
    const colorMemory = colorPoolStats.totalAllocated * 32; // 32 bytes per color object estimate
    const batchMemory = batchPoolStats.totalAllocated * 256; // 256 bytes per batch estimate
    const cacheMemory = this.colorCache.size * 32 + this.paletteCache.size * 256;
    
    return colorMemory + batchMemory + cacheMemory;
  }

  /**
   * Get memory pool statistics
   */
  getPoolStats(): { 
    colorPool: { 
      totalAllocated: number; 
      available: number; 
      hits: number; 
      misses: number; 
      hitRate: number 
    }; 
    batchPool: { 
      totalAllocated: number; 
      available: number; 
      hits: number; 
      misses: number; 
      hitRate: number 
    } 
  } {
    return {
      colorPool: this.colorPool.getStats(),
      batchPool: this.batchPool.getStats(),
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { 
    colorCache: { 
      size: number; 
      maxSize: number; 
      hits: number; 
      misses: number; 
      hitRate: number 
    }; 
    paletteCache: { 
      size: number; 
      maxSize: number; 
      hits: number; 
      misses: number; 
      hitRate: number 
    } 
  } {
    return {
      colorCache: this.colorCache.getStats(),
      paletteCache: this.paletteCache.getStats(),
    };
  }

  /**
   * Check if at target FPS
   */
  isAtTargetFps(): boolean {
    return this.fpsCounter.isAtTargetFps(this.config.targetFps);
  }

  /**
   * Reset all statistics
   */
  reset(): void {
    this.fpsCounter.reset();
    this.benchmarks.clear();
  }

  /**
   * Optimize a function by caching results
   */
  memoize<T extends (...args: unknown[]) => unknown>(fn: T, cache: LRUCache<string, unknown>): T {
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      const cached = cache.get(key);
      if (cached !== undefined) {
        return cached;
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.colorPool.clear();
    this.batchPool.clear();
    this.colorCache.clear();
    this.paletteCache.clear();
    this.batcher.clear();
    this.reset();
  }
}

export { PixelOptimizer as default };
