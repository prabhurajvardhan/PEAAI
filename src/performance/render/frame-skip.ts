/**
 * Frame Skip - Skip unchanged frames for performance
 */

import { DirtyRegionTracker } from './dirty-region';

export interface FrameSkipConfig {
  skipThreshold?: number;
  minFrameInterval?: number;
  maxSkipsBeforeForce?: number;
  compareContent?: boolean;
}

const defaultConfig: Required<FrameSkipConfig> = {
  skipThreshold: 0.1,
  minFrameInterval: 16.67,
  maxSkipsBeforeForce: 3,
  compareContent: false,
};

export class FrameSkipController {
  private config: Required<FrameSkipConfig>;
  private dirtyTracker: DirtyRegionTracker;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private skipCount: number = 0;
  private totalSkips: number = 0;
  private forceNextFrame: boolean = false;
  private lastContentHash: string = '';
  private contentProvider?: () => string;
  private renderCallback?: () => void;

  constructor(dirtyTracker: DirtyRegionTracker, config: FrameSkipConfig = {}) {
    this.dirtyTracker = dirtyTracker;
    this.config = { ...defaultConfig, ...config };
  }

  setContentProvider(provider: () => string): void {
    this.contentProvider = provider;
  }

  setRenderCallback(callback: () => void): void {
    this.renderCallback = callback;
  }

  shouldRender(): boolean {
    const now = performance.now();
    const elapsed = now - this.lastFrameTime;

    if (elapsed < this.config.minFrameInterval) {
      return false;
    }

    if (this.forceNextFrame) {
      this.forceNextFrame = false;
      return true;
    }

    if (!this.dirtyTracker.hasDirtyRegions()) {
      return false;
    }

    if (this.skipCount >= this.config.maxSkipsBeforeForce) {
      this.skipCount = 0;
      return true;
    }

    const stats = this.dirtyTracker.getStats();
    const pixelCount = stats.totalDirtyArea;
    const canvasSize = 32 * 32;
    const dirtyRatio = pixelCount / canvasSize;

    if (dirtyRatio < this.config.skipThreshold) {
      this.skipCount++;
      this.totalSkips++;
      return false;
    }

    if (this.config.compareContent && this.contentProvider) {
      const currentHash = this.contentProvider();
      if (currentHash === this.lastContentHash) {
        this.skipCount++;
        this.totalSkips++;
        return false;
      }
      this.lastContentHash = currentHash;
    }

    this.skipCount = 0;
    return true;
  }

  frame(): void {
    this.frameCount++;
    this.lastFrameTime = performance.now();
    this.dirtyTracker.frame();
  }

  forceRender(): void {
    this.forceNextFrame = true;
    this.skipCount = 0;
  }

  render(): void {
    if (this.shouldRender()) {
      if (this.renderCallback) {
        this.renderCallback();
      }
      this.frame();
    }
  }

  getStats(): {
    frameCount: number;
    skipCount: number;
    totalSkips: number;
    skipRatio: number;
    lastFrameTime: number;
    shouldForceRender: boolean;
  } {
    const skipRatio = this.frameCount > 0 ? this.totalSkips / this.frameCount : 0;

    return {
      frameCount: this.frameCount,
      skipCount: this.skipCount,
      totalSkips: this.totalSkips,
      skipRatio,
      lastFrameTime: this.lastFrameTime,
      shouldForceRender: this.skipCount >= this.config.maxSkipsBeforeForce,
    };
  }

  reset(): void {
    this.frameCount = 0;
    this.skipCount = 0;
    this.totalSkips = 0;
    this.lastFrameTime = 0;
    this.forceNextFrame = false;
    this.lastContentHash = '';
    this.dirtyTracker.reset();
  }

  setSkipThreshold(threshold: number): void {
    this.config.skipThreshold = Math.max(0, Math.min(1, threshold));
  }

  setMaxSkipsBeforeForce(max: number): void {
    this.config.maxSkipsBeforeForce = max;
  }

  setMinFrameInterval(interval: number): void {
    this.config.minFrameInterval = interval;
  }

  getDirtyTracker(): DirtyRegionTracker {
    return this.dirtyTracker;
  }

  isFrameDue(): boolean {
    const now = performance.now();
    return now - this.lastFrameTime >= this.config.minFrameInterval;
  }

  getTimeUntilNextFrame(): number {
    const now = performance.now();
    const elapsed = now - this.lastFrameTime;
    return Math.max(0, this.config.minFrameInterval - elapsed);
  }
}

export { FrameSkipController as default };
