/**
 * Performance Engine - Render Optimization Module
 * 
 * Provides render optimization capabilities including dirty region tracking,
 * render batching, frame skipping, and performance profiling.
 */

export {
  default as DirtyRegionTracker,
  type Rect,
  type DirtyRegionConfig,
} from './dirty-region';

export {
  default as RenderBatcher,
  type RenderBatchItem,
  type RenderBatcherConfig,
} from './render-batcher';

export {
  default as FrameSkipController,
  type FrameSkipConfig,
} from './frame-skip';

export {
  default as PerformanceProfiler,
  type ProfilerMark,
  type ProfilerMeasure,
  type ProfilerStats,
  type PerformanceBudget,
  type BudgetStatus,
} from './performance-profiler';

export const RENDER_VERSION = '1.0.0';
export const TARGET_FPS = 60;
export const FRAME_TIME_BUDGET = 16.67;
