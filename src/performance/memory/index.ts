/**
 * Performance Engine - Memory Management Module
 * 
 * Provides memory management capabilities including usage tracking,
 * leak detection, cleanup hooks, and garbage collection hints.
 */

export {
  default as MemoryTracker,
  type MemoryStats,
  type MemorySnapshot,
  type MemoryConfig,
} from './memory-tracker';

export {
  default as LeakDetector,
  type LeakCandidate,
  type LeakType,
  type LeakDetectionConfig,
} from './leak-detector';

export {
  default as CleanupManager,
  type CleanupHook,
  type CleanupRegistration,
  type CleanupHookConfig,
  createCleanupHook,
} from './cleanup-hooks';

export {
  default as GCHintManager,
  type GCHintConfig,
  createWeakRef,
  createFinalizationRegistry,
} from './gc-hints';

export const MEMORY_VERSION = '1.0.0';
export const DEFAULT_HEAP_WARNING_THRESHOLD = 0.7;
export const DEFAULT_HEAP_CRITICAL_THRESHOLD = 0.9;
