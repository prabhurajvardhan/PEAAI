/**
 * Performance Engine (M11)
 * 
 * Provides comprehensive performance monitoring and optimization capabilities
 * for PEAAI including FPS monitoring, render optimization, lazy loading,
 * GPU optimization, and memory management.
 */

// Re-export all modules
export * from './lazy';
export * from './fps';
export * from './render';
export * from './gpu';
export * from './memory';

/**
 * Performance Engine version
 */
export const PERFORMANCE_VERSION = '1.0.0';

/**
 * Target frame rate for all performance operations
 */
export const TARGET_FRAME_RATE = 60;

/**
 * Frame time budget in milliseconds (1000ms / 60fps)
 */
export const FRAME_TIME_MS = 16.67;

/**
 * Memory warning threshold (70% of heap limit)
 */
export const MEMORY_WARNING_THRESHOLD = 0.7;

/**
 * Memory critical threshold (90% of heap limit)
 */
export const MEMORY_CRITICAL_THRESHOLD = 0.9;
