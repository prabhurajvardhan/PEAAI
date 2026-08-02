/**
 * Shared types for Pixel Graphics Engine
 */

/**
 * Color representation with RGBA components
 */
export interface IColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Pixel batch for batch operations
 */
export interface IPixelBatch {
  pixels: Array<{ x: number; y: number; color: IColor }>;
}

/**
 * Blend modes for pixel operations
 */
export type BlendMode = 'replace' | 'alpha' | 'add' | 'multiply';

/**
 * Canvas configuration
 */
export interface ICanvasConfig {
  width?: number;
  height?: number;
  pixelScale?: number;
  dpr?: number;
}

/**
 * Grid configuration
 */
export interface IGridConfig {
  gridWidth: number;
  gridHeight: number;
  pixelWidth: number;
  pixelHeight: number;
}

/**
 * Position interface for coordinates
 */
export interface IPosition {
  x: number;
  y: number;
}

/**
 * Size interface
 */
export interface ISize {
  width: number;
  height: number;
}

/**
 * Extended pixel buffer interface with data access
 */
export interface IPixelBufferExtended extends Omit<IPixelBuffer, never> {
  getData(): Uint8ClampedArray;
  setData(data: Uint8ClampedArray): void;
}
