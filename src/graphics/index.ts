/**
 * Pixel Graphics Engine (M03)
 * 
 * Core pixel rendering infrastructure for PEAAI.
 * 
 * @packageDocumentation
 */

export { CanvasEngine, ICanvas } from './canvas';
export { PixelGridManager, IGridManager } from './grid';
export { PixelBuffer, IPixelBuffer } from './buffer';
export {
  PixelAssignmentEngine,
  IPixelAssignmentEngine,
} from './pixel-assignment';
export type {
  IColor,
  IPixelBatch,
  BlendMode,
  ICanvasConfig,
  IGridConfig,
  IPosition,
  ISize,
} from './types';
export type {
  DirtyRect,
  BatchOperation,
  RenderStats,
  RendererConfig,
} from './rendering';
export type {
  PaletteEntry,
  ColorPalette,
  InterpolationMode,
  ExtendedBlendMode,
  PorterDuffOperator,
  GradientStop,
  ColorConfig,
} from './color';
export type {
  PoolConfig,
  BenchmarkResult,
  PerformanceMetrics,
  OperationType,
  BatchedOperation,
  OptimizerConfig,
} from './optimizer';
