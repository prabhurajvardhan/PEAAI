/**
 * Pixel Optimizer Module
 * 
 * Exports optimization utilities for pixel graphics:
 * - MemoryPool: Object pooling for memory efficiency
 * - LRUCache: LRU cache for frequently accessed data
 * - OperationBatcher: Batch pixel operations
 * - FPSCounter: Frame rate tracking
 * - Benchmark: Performance benchmarking
 * - PixelOptimizer: Main optimizer class
 */

export {
  PixelOptimizer,
  MemoryPool,
  LRUCache,
  OperationBatcher,
  FPSCounter,
  Benchmark,
} from './optimizer';

export type {
  PoolConfig,
  BenchmarkResult,
  PerformanceMetrics,
  OperationType,
  BatchedOperation,
  OptimizerConfig,
} from './optimizer';
