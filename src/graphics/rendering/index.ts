/**
 * Pixel Rendering Engine Module
 * 
 * Exports the PixelRenderer class implementing high-performance pixel rendering
 * with double buffering, dirty region tracking, and batch operations.
 */

export { PixelRenderer } from './renderer';
export type { DirtyRect, BatchOperation, RenderStats, RendererConfig } from './renderer';
