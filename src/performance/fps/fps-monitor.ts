/**
 * FPS Monitor - Frame timing and FPS calculation
 */

export interface FrameTiming {
  deltaTime: number;
  timestamp: number;
  fps: number;
  frameTime: number;
}

export interface FPSConfig {
  targetFPS?: number;
  sampleSize?: number;
  updateInterval?: number;
  alertThreshold?: number;
}

const defaultConfig: Required<FPSConfig> = {
  targetFPS: 60,
  sampleSize: 60,
  updateInterval: 500,
  alertThreshold: 0.8,
};

export class FPSMonitor {
  private config: Required<FPSConfig>;
  private timestamps: number[] = [];
  private frameCount: number = 0;
  private lastUpdateTime: number = 0;
  private lastFrameTime: number = 0;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private callbacks: Set<(timing: FrameTiming) => void> = new Set();
  private alertCallbacks: Set<(fps: number, targetFPS: number) => void> = new Set();

  constructor(config: FPSConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.timestamps = [];
    this.frameCount = 0;
    this.lastUpdateTime = performance.now();
    this.lastFrameTime = performance.now();

    this.tick();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private tick = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    this.timestamps.push(now);
    this.frameCount++;

    if (this.timestamps.length > this.config.sampleSize) {
      this.timestamps.shift();
    }

    if (now - this.lastUpdateTime >= this.config.updateInterval) {
      this.update();
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  private update(): void {
    const now = performance.now();
    const elapsed = now - this.lastUpdateTime;
    this.lastUpdateTime = now;
    const deltaTime = elapsed;

    const fps = this.calculateFPS();
    const frameTime = elapsed;

    const timing: FrameTiming = {
      deltaTime,
      timestamp: now,
      fps,
      frameTime,
    };

    this.callbacks.forEach((callback) => callback(timing));

    if (fps < this.config.targetFPS * this.config.alertThreshold) {
      this.alertCallbacks.forEach((callback) => callback(fps, this.config.targetFPS));
    }
  }

  calculateFPS(): number {
    if (this.timestamps.length < 2) return 0;

    const elapsed = this.timestamps[this.timestamps.length - 1] - this.timestamps[0];
    if (elapsed <= 0) return 0;

    const frameCount = this.timestamps.length - 1;
    return Math.round((frameCount / elapsed) * 1000);
  }

  getCurrentFPS(): number {
    return this.calculateFPS();
  }

  getFrameTime(): number {
    if (this.timestamps.length < 2) return 0;
    return this.lastFrameTime - (this.timestamps[this.timestamps.length - 1] || 0);
  }

  onFrame(callback: (timing: FrameTiming) => void): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  onAlert(callback: (fps: number, targetFPS: number) => void): () => void {
    this.alertCallbacks.add(callback);
    return () => {
      this.alertCallbacks.delete(callback);
    };
  }

  getStats(): {
    fps: number;
    avgFPS: number;
    minFPS: number;
    maxFPS: number;
    frameCount: number;
    targetFPS: number;
  } {
    const fps = this.calculateFPS();
    const recentFPS = this.getRecentFPSArray();

    return {
      fps,
      avgFPS: this.calculateAverage(recentFPS),
      minFPS: this.calculateMin(recentFPS),
      maxFPS: this.calculateMax(recentFPS),
      frameCount: this.frameCount,
      targetFPS: this.config.targetFPS,
    };
  }

  private getRecentFPSArray(): number[] {
    const fpsArray: number[] = [];
    const windowSize = Math.min(10, this.timestamps.length - 1);

    for (let i = 0; i < windowSize; i++) {
      const idx = this.timestamps.length - 1 - i;
      if (idx > 0) {
        const delta = this.timestamps[idx] - this.timestamps[idx - 1];
        if (delta > 0) {
          fpsArray.push(1000 / delta);
        }
      }
    }

    return fpsArray;
  }

  private calculateAverage(arr: number[]): number {
    if (arr.length === 0) return 0;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }

  private calculateMin(arr: number[]): number {
    if (arr.length === 0) return 0;
    return Math.round(Math.min(...arr));
  }

  private calculateMax(arr: number[]): number {
    if (arr.length === 0) return 0;
    return Math.round(Math.max(...arr));
  }

  reset(): void {
    this.timestamps = [];
    this.frameCount = 0;
    this.lastUpdateTime = performance.now();
    this.lastFrameTime = performance.now();
  }

  setTargetFPS(fps: number): void {
    this.config.targetFPS = fps;
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

export { FPSMonitor as default };
