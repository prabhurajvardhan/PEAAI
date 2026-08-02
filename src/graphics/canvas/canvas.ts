/**
 * Canvas Engine - Core HTML5 canvas management with DPR support
 * 
 * Features:
 * - Canvas element creation and management
 * - 2D context management
 * - Device Pixel Ratio (DPR) scaling for crisp pixels
 * - Container sizing and resize handling
 * - Pause/resume rendering
 */

import { IPixelBuffer, PixelBuffer } from '../buffer/buffer';
import { ISize } from '../types';

export interface ICanvas {
  initialize(container: HTMLElement): void;
  destroy(): void;
  render(): void;
  clear(): void;
  getPixelBuffer(): IPixelBuffer;
  setSize(width: number, height: number): void;
  getSize(): ISize;
  setPixelScale(scale: number): void;
  isInitialized(): boolean;
  pause(): void;
  resume(): void;
}

export interface CanvasConfig {
  width?: number;
  height?: number;
  pixelScale?: number;
  autoRender?: boolean;
}

const DEFAULT_CONFIG = {
  width: 32,
  height: 32,
  pixelScale: 1,
  autoRender: true,
};

export class CanvasEngine implements ICanvas {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private container: HTMLElement | null = null;
  private pixelBuffer: IPixelBuffer | null = null;
  private width: number;
  private height: number;
  private pixelScale: number;
  private dpr: number;
  private autoRender: boolean;
  private initialized: boolean = false;
  private paused: boolean = false;
  private resizeObserver: ResizeObserver | null = null;

  constructor(config: CanvasConfig = {}) {
    const { width, height, pixelScale, autoRender } = { ...DEFAULT_CONFIG, ...config };
    this.width = width ?? DEFAULT_CONFIG.width;
    this.height = height ?? DEFAULT_CONFIG.height;
    this.pixelScale = pixelScale ?? DEFAULT_CONFIG.pixelScale;
    this.autoRender = autoRender ?? DEFAULT_CONFIG.autoRender;
    this.dpr = 1;
  }

  initialize(container: HTMLElement): void {
    if (this.initialized) {
      this.destroy();
    }

    this.container = container;
    this.dpr = this.getDevicePixelRatio();

    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.imageRendering = 'pixelated';
    this.canvas.style.imageRendering = 'crisp-edges';

    const ctx = this.canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;

    this.updateCanvasSize();
    container.appendChild(this.canvas);

    this.pixelBuffer = new PixelBuffer(this.width, this.height);

    this.setupResizeObserver();

    this.initialized = true;
  }

  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.canvas && this.container) {
      this.container.removeChild(this.canvas);
    }

    this.canvas = null;
    this.ctx = null;
    this.container = null;
    this.pixelBuffer = null;
    this.initialized = false;
    this.paused = false;
  }

  render(): void {
    if (!this.ctx || !this.pixelBuffer || !this.canvas || this.paused) {
      return;
    }

    const imageData = this.pixelBuffer.toImageData();
    this.ctx.putImageData(imageData, 0, 0);
  }

  clear(): void {
    if (!this.ctx || !this.canvas) {
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.pixelBuffer) {
      this.pixelBuffer.fill({ r: 0, g: 0, b: 0, a: 0 });
    }
  }

  getPixelBuffer(): IPixelBuffer {
    if (!this.pixelBuffer) {
      throw new Error('Canvas not initialized');
    }
    return this.pixelBuffer;
  }

  setSize(width: number, height: number): void {
    if (width <= 0 || height <= 0) {
      throw new Error('Width and height must be positive');
    }

    this.width = width;
    this.height = height;

    if (this.initialized) {
      this.updateCanvasSize();

      if (this.pixelBuffer) {
        this.pixelBuffer.resize(width, height);
      }
    }
  }

  getSize(): ISize {
    return {
      width: this.width,
      height: this.height,
    };
  }

  setPixelScale(scale: number): void {
    if (scale <= 0) {
      throw new Error('Pixel scale must be positive');
    }

    this.pixelScale = scale;

    if (this.initialized) {
      this.updateCanvasSize();
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  getContext(): CanvasRenderingContext2D | null {
    return this.ctx;
  }

  getDPR(): number {
    return this.dpr;
  }

  getPixelScale(): number {
    return this.pixelScale;
  }

  private getDevicePixelRatio(): number {
    if (typeof window !== 'undefined' && window.devicePixelRatio) {
      return window.devicePixelRatio;
    }
    return 1;
  }

  private updateCanvasSize(): void {
    if (!this.canvas) return;

    const scaledWidth = this.width * this.pixelScale * this.dpr;
    const scaledHeight = this.height * this.pixelScale * this.dpr;

    this.canvas.width = scaledWidth;
    this.canvas.height = scaledHeight;
    this.canvas.style.width = `${this.width * this.pixelScale}px`;
    this.canvas.style.height = `${this.height * this.pixelScale}px`;

    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
    }
  }

  private setupResizeObserver(): void {
    if (!this.container || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });

    this.resizeObserver.observe(this.container);
  }

  private handleResize(): void {
    this.dpr = this.getDevicePixelRatio();
    this.updateCanvasSize();

    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
    }
  }
}

export { CanvasEngine as default };
