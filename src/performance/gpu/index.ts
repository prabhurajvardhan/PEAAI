/**
 * Performance Engine - GPU Optimization Module
 * 
 * Provides GPU optimization capabilities including layer promotion,
 * composite layers, will-change management, and GPU memory tracking.
 */

export {
  default as LayerPromotionManager,
  type LayerPriority,
  type LayerPromotionConfig,
  type LayerInfo,
} from './layer-promotion';

export {
  default as CompositeLayerManager,
  type CompositeMode,
  type CompositeLayerConfig,
  type CompositeLayer,
} from './composite-layers';

export {
  default as WillChangeManager,
  type WillChangeProperty,
  type WillChangeConfig,
  type WillChangeHint,
} from './will-change';

export {
  default as GPUMemoryTracker,
  type GPUMemoryStats,
  type TrackedGPUObject,
  type GPUMemoryConfig,
} from './gpu-memory';

export const GPU_VERSION = '1.0.0';
