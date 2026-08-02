/**
 * Pixel Rendering Engine - High-performance pixel rendering with double buffering
 * 
 * Features:
 * - Pixel-to-canvas coordinate mapping
 * - Double buffering (front/back buffer swap)
 * - Dirty region tracking (only render changed areas)
 * - Batch rendering (group pixel operations)
 * - 60 FPS target optimization
 */

import { IPixelBuffer, PixelBuffer } from '../buffer/buffer';
import { IColor, IPosition, IPixelBufferExtended } from '../types';

/**
 * Dirty region rectangle
 */
export interface DirtyRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Batch operation for grouped pixel updates
 */
export interface BatchOperation {
  type: 'set' | 'fill' | 'blend' | 'clear';
  data?: {
    x?: number;
    y?: number;
    color?: IColor;
    pixels?: Array<{ x: number; y: number; color: IColor }>;
    source?: IPixelBuffer;
    offsetX?: number;
    offsetY?: number;
    mode?: 'replace' | 'alpha' | 'add' | 'multiply';
  };
}

/**
 * Render statistics for performance monitoring
 */
export interface RenderStats {
  framesRendered: number;
  dirtyRegionsUpdated: number;
  batchOperationsCount: number;
  lastFrameTime: number;
  averageFps: number;
}

/**
 * Configuration for the renderer
 */
export interface RendererConfig {
  width: number;
  height: number;
  enableDoubleBuffering?: boolean;
  enableDirtyTracking?: boolean;
  maxDirtyRegions?: number;
  batchSize?: number;
}

const DEFAULT_CONFIG: Required<Omit<RendererConfig, 'width' | 'height'>> = {
  enableDoubleBuffering: true,
  enableDirtyTracking: true,
  maxDirtyRegions: 64,
  batchSize: 256,
};

/**
 * Pixel Rendering Engine
 * 
 * Provides high-performance pixel rendering with:
 * - Double buffering to prevent tearing
 * - Dirty region tracking for optimized redraws
 * - Batch operations for efficient updates
 */
export class PixelRenderer {
  private frontBuffer: IPixelBuffer;
  private backBuffer: IPixelBuffer;
  private canvasBuffer: IPixelBuffer;
  private width: number;
  private height: number;
  private enableDoubleBuffering: boolean;
  private enableDirtyTracking: boolean;
  private maxDirtyRegions: number;
  private batchSize: number;
  
  private dirtyRegions: DirtyRect[];
  private pendingBatch: BatchOperation[];
  private useBackBuffer: boolean;
  
  private framesRendered: number;
  private lastFrameTime: number;
  private frameTimeHistory: number[];
  private fpsUpdateInterval: number;
  private lastFpsUpdate: number;
  
  private isDirty: boolean;
  private isRendering: boolean;

  constructor(config: RendererConfig) {
    if (config.width <= 0 || config.height <= 0) {
      throw new Error('Width and height must be positive');
    }

    this.width = config.width;
    this.height = config.height;
    this.enableDoubleBuffering = config.enableDoubleBuffering ?? DEFAULT_CONFIG.enableDoubleBuffering;
    this.enableDirtyTracking = config.enableDirtyTracking ?? DEFAULT_CONFIG.enableDirtyTracking;
    this.maxDirtyRegions = config.maxDirtyRegions ?? DEFAULT_CONFIG.maxDirtyRegions;
    this.batchSize = config.batchSize ?? DEFAULT_CONFIG.batchSize;

    // Initialize buffers
    this.frontBuffer = new PixelBuffer(this.width, this.height);
    this.backBuffer = this.enableDoubleBuffering ? new PixelBuffer(this.width, this.height) : this.frontBuffer;
    this.canvasBuffer = new PixelBuffer(this.width, this.height);

    this.dirtyRegions = [];
    this.pendingBatch = [];
    this.useBackBuffer = true;
    
    this.framesRendered = 0;
    this.lastFrameTime = 0;
    this.frameTimeHistory = [];
    this.fpsUpdateInterval = 500;
    this.lastFpsUpdate = performance.now();
    
    this.isDirty = false;
    this.isRendering = false;
  }

  /**
   * Get the active buffer for drawing
   */
  getDrawBuffer(): IPixelBuffer {
    return this.useBackBuffer ? this.backBuffer : this.frontBuffer;
  }

  /**
   * Get the display buffer (front buffer)
   */
  getDisplayBuffer(): IPixelBuffer {
    return this.frontBuffer;
  }

  /**
   * Set a single pixel
   */
  setPixel(x: number, y: number, color: IColor): void {
    this.getDrawBuffer().setPixel(x, y, color);
    this.markDirty(x, y, x + 1, y + 1);
  }

  /**
   * Get a pixel color
   */
  getPixel(x: number, y: number): IColor {
    return this.getDrawBuffer().getPixel(x, y);
  }

  /**
   * Set multiple pixels in a batch
   */
  setPixelBatch(pixels: Array<{ x: number; y: number; color: IColor }>): void {
    const buffer = this.getDrawBuffer();
    const batch = {
      pixels: pixels.map(p => ({ x: p.x, y: p.y, color: p.color })),
    };
    
    buffer.setPixelBatch(batch);
    
    // Mark the bounding box as dirty
    let minX = this.width, minY = this.height, maxX = 0, maxY = 0;
    for (const p of pixels) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    this.markDirty(minX, minY, maxX + 1, maxY + 1);
  }

  /**
   * Fill the entire buffer with a color
   */
  fill(color: IColor): void {
    this.getDrawBuffer().fill(color);
    this.markDirty(0, 0, this.width, this.height);
  }

  /**
   * Blend another buffer onto the draw buffer
   */
  blend(source: IPixelBuffer, offsetX: number, offsetY: number, mode: 'replace' | 'alpha' | 'add' | 'multiply' = 'alpha'): void {
    this.getDrawBuffer().blend(source, offsetX, offsetY, mode);
    
    // Mark the blended region as dirty
    const sourceWidth = source.getWidth();
    const sourceHeight = source.getHeight();
    this.markDirty(
      Math.max(0, offsetX),
      Math.max(0, offsetY),
      Math.min(this.width, offsetX + sourceWidth),
      Math.min(this.height, offsetY + sourceHeight)
    );
  }

  /**
   * Clear all pixels
   */
  clear(): void {
    this.getDrawBuffer().clear();
    this.markDirty(0, 0, this.width, this.height);
  }

  /**
   * Mark a region as dirty (needs redraw)
   */
  markDirty(x1: number, y1: number, x2: number, y2: number): void {
    if (!this.enableDirtyTracking) {
      this.isDirty = true;
      return;
    }

    // Clamp to buffer bounds
    const left = Math.max(0, Math.min(x1, x2));
    const top = Math.max(0, Math.min(y1, y2));
    const right = Math.min(this.width, Math.max(x1, x2));
    const bottom = Math.min(this.height, Math.max(y1, y2));

    if (left >= right || top >= bottom) return;

    // Check if this region overlaps with existing regions
    for (const region of this.dirtyRegions) {
      if (this.regionsOverlap(left, top, right, bottom, region.x1, region.y1, region.x2, region.y2)) {
        // Merge regions
        region.x1 = Math.min(region.x1, left);
        region.y1 = Math.min(region.y1, top);
        region.x2 = Math.max(region.x2, right);
        region.y2 = Math.max(region.y2, bottom);
        this.isDirty = true;
        return;
      }
    }

    // Add new region if under limit
    if (this.dirtyRegions.length < this.maxDirtyRegions) {
      this.dirtyRegions.push({ x1: left, y1: top, x2: right, y2: bottom });
    } else {
      // Merge with first region
      const first = this.dirtyRegions[0];
      first.x1 = Math.min(first.x1, left);
      first.y1 = Math.min(first.y1, top);
      first.x2 = Math.max(first.x2, right);
      first.y2 = Math.max(first.y2, bottom);
    }

    this.isDirty = true;
  }

  /**
   * Check if two regions overlap
   */
  private regionsOverlap(x1: number, y1: number, x2: number, y2: number,
                          x3: number, y3: number, x4: number, y4: number): boolean {
    return !(x2 <= x3 || x4 <= x1 || y2 <= y3 || y4 <= y1);
  }

  /**
   * Get the dirty regions
   */
  getDirtyRegions(): DirtyRect[] {
    return [...this.dirtyRegions];
  }

  /**
   * Clear dirty regions
   */
  clearDirtyRegions(): void {
    this.dirtyRegions = [];
    this.isDirty = false;
  }

  /**
   * Check if there are dirty regions
   */
  hasDirtyRegions(): boolean {
    return this.dirtyRegions.length > 0 || this.isDirty;
  }

  /**
   * Render to a canvas context
   */
  render(canvasCtx: CanvasRenderingContext2D, width?: number, height?: number): void {
    if (this.isRendering) return;
    this.isRendering = true;

    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.framesRendered++;

    // Update FPS calculation
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }

    // Swap buffers if double buffering is enabled
    if (this.enableDoubleBuffering) {
      this.swapBuffers();
    }

    // Copy to canvas buffer
    this.copyBuffer(this.getDisplayBuffer(), this.canvasBuffer);

    // Create ImageData and render
    const imageData = this.canvasBuffer.toImageData();
    
    if (this.enableDirtyTracking && this.dirtyRegions.length > 0) {
      // Only render dirty regions
      this.renderDirtyRegions(canvasCtx, imageData);
      this.dirtyRegions = [];
    } else {
      // Render entire canvas
      const w = width ?? this.width;
      const h = height ?? this.height;
      canvasCtx.putImageData(imageData, 0, 0, 0, 0, w, h);
    }

    this.isDirty = false;
    this.isRendering = false;
  }

  /**
   * Swap front and back buffers
   */
  swapBuffers(): void {
    if (this.enableDoubleBuffering) {
      const temp = this.frontBuffer;
      this.frontBuffer = this.backBuffer;
      this.backBuffer = temp;
      this.useBackBuffer = !this.useBackBuffer;
    }
  }

  /**
   * Copy data from source to destination buffer
   */
  private copyBuffer(source: IPixelBuffer, dest: IPixelBuffer): void {
    const sourceExt = source as unknown as IPixelBufferExtended;
    const destExt = dest as unknown as IPixelBufferExtended;
    const data = sourceExt.getData();
    destExt.setData(new Uint8ClampedArray(data));
  }

  /**
   * Render only dirty regions to canvas
   */
  private renderDirtyRegions(ctx: CanvasRenderingContext2D, fullImageData: ImageData): void {
    for (const region of this.dirtyRegions) {
      const w = region.x2 - region.x1;
      const h = region.y2 - region.y1;
      
      if (w > 0 && h > 0) {
        const regionData = ctx.createImageData(w, h);
        
        // Copy data for this region
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const srcIdx = ((region.y1 + y) * this.width + (region.x1 + x)) * 4;
            const destIdx = (y * w + x) * 4;
            
            regionData.data[destIdx] = fullImageData.data[srcIdx];
            regionData.data[destIdx + 1] = fullImageData.data[srcIdx + 1];
            regionData.data[destIdx + 2] = fullImageData.data[srcIdx + 2];
            regionData.data[destIdx + 3] = fullImageData.data[srcIdx + 3];
          }
        }
        
        ctx.putImageData(regionData, region.x1, region.y1);
      }
    }
  }

  /**
   * Get rendering statistics
   */
  getStats(): RenderStats {
    const avgFrameTime = this.frameTimeHistory.length > 0
      ? this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length
      : 0;

    return {
      framesRendered: this.framesRendered,
      dirtyRegionsUpdated: this.dirtyRegions.length,
      batchOperationsCount: this.pendingBatch.length,
      lastFrameTime: this.lastFrameTime,
      averageFps: avgFrameTime > 0 ? 1000 / avgFrameTime : 0,
    };
  }

  /**
   * Get current FPS
   */
  getFps(): number {
    const stats = this.getStats();
    return stats.averageFps;
  }

  /**
   * Map pixel coordinates to canvas coordinates
   */
  pixelToCanvas(pixelX: number, pixelY: number, pixelSize: number): IPosition {
    return {
      x: pixelX * pixelSize,
      y: pixelY * pixelSize,
    };
  }

  /**
   * Map canvas coordinates to pixel coordinates
   */
  canvasToPixel(canvasX: number, canvasY: number, pixelSize: number): IPosition {
    return {
      x: Math.floor(canvasX / pixelSize),
      y: Math.floor(canvasY / pixelSize),
    };
  }

  /**
   * Map a rectangle from pixel to canvas coordinates
   */
  pixelRectToCanvas(x: number, y: number, w: number, h: number, pixelSize: number): { x: number; y: number; w: number; h: number } {
    return {
      x: x * pixelSize,
      y: y * pixelSize,
      w: w * pixelSize,
      h: h * pixelSize,
    };
  }

  /**
   * Get buffer dimensions
   */
  getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Resize the renderer
   */
  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) {
      throw new Error('Width and height must be positive');
    }

    this.width = width;
    this.height = height;
    this.frontBuffer.resize(width, height);
    
    if (this.enableDoubleBuffering) {
      this.backBuffer.resize(width, height);
    }
    this.canvasBuffer.resize(width, height);
    
    this.markDirty(0, 0, width, height);
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.dirtyRegions = [];
    this.pendingBatch = [];
    this.frameTimeHistory = [];
  }
}

export { PixelRenderer as default };
