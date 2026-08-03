/**
 * Timeline Engine - Core animation timeline management
 * 
 * Features:
 * - Frame-based animation at 60 FPS
 * - Time scaling for speed control
 * - Pause/resume functionality
 * - Frame callbacks for smooth animations
 * - Duration and seeking
 */

export interface IAnimationTimeline {
  play(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  seek(time: number): void;
  getDuration(): number;
  getCurrentTime(): number;
  getProgress(): number;
  setTimeScale(scale: number): void;
  getTimeScale(): number;
  isPlaying(): boolean;
  isPaused(): boolean;
  onFrame(callback: (progress: number, deltaTime: number) => void): () => void;
  onComplete(callback: () => void): () => void;
  onStart(callback: () => void): () => void;
  update(currentTime: number): void;
  destroy(): void;
}

export interface TimelineConfig {
  duration: number;
  autoPlay?: boolean;
  loop?: boolean;
  loopCount?: number;
  timeScale?: number;
}

const DEFAULT_CONFIG = {
  autoPlay: false,
  loop: false,
  loopCount: 1,
  timeScale: 1,
};

const FPS = 60;
const FRAME_TIME = 1000 / FPS;

export class TimelineEngine implements IAnimationTimeline {
  private duration: number;
  private currentTime: number = 0;
  private timeScale: number;
  private loop: boolean;
  private loopCount: number;
  private currentLoop: number = 0;
  private autoPlay: boolean;
  
  private isRunning: boolean = false;
  private isPausedState: boolean = false;
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private accumulatedTime: number = 0;
  
  private frameCallbacks: Set<(progress: number, deltaTime: number) => void> = new Set();
  private completeCallbacks: Set<() => void> = new Set();
  private startCallbacks: Set<() => void> = new Set();
  private hasStarted: boolean = false;
  private wasPlaying: boolean = false;

  constructor(config: TimelineConfig) {
    this.duration = config.duration;
    this.autoPlay = config.autoPlay ?? DEFAULT_CONFIG.autoPlay;
    this.loop = config.loop ?? DEFAULT_CONFIG.loop;
    this.loopCount = config.loopCount ?? DEFAULT_CONFIG.loopCount;
    this.timeScale = config.timeScale ?? DEFAULT_CONFIG.timeScale;

    if (this.autoPlay) {
      this.play();
    }
  }

  play(): void {
    if (this.isRunning) return;
    
    if (!this.hasStarted) {
      this.hasStarted = true;
      this.emitStart();
    }

    this.isRunning = true;
    this.isPausedState = false;
    this.lastFrameTime = performance.now();
    this.wasPlaying = true;
    this.tick();
  }

  pause(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.isPausedState = true;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resume(): void {
    if (this.isPausedState) {
      this.isRunning = true;
      this.isPausedState = false;
      this.lastFrameTime = performance.now();
      this.wasPlaying = true;
      this.tick();
    }
  }

  stop(): void {
    this.isRunning = false;
    this.isPausedState = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  seek(time: number): void {
    const clampedTime = Math.max(0, Math.min(this.duration, time));
    const wasRunning = this.isRunning;
    
    if (this.isRunning) {
      this.pause();
    }
    
    this.currentTime = clampedTime;
    this.accumulatedTime = 0;
    
    const progress = this.getProgress();
    this.emitFrame(progress, 0);
    
    if (wasRunning) {
      this.play();
    }
  }

  getDuration(): number {
    return this.duration;
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  getProgress(): number {
    if (this.duration === 0) return 0;
    return this.currentTime / this.duration;
  }

  setTimeScale(scale: number): void {
    if (scale < 0) {
      throw new Error('Time scale must be non-negative');
    }
    this.timeScale = scale;
  }

  getTimeScale(): number {
    return this.timeScale;
  }

  isPlaying(): boolean {
    return this.isRunning;
  }

  isPaused(): boolean {
    return this.isPausedState;
  }

  onFrame(callback: (progress: number, deltaTime: number) => void): () => void {
    this.frameCallbacks.add(callback);
    return () => this.frameCallbacks.delete(callback);
  }

  onComplete(callback: () => void): () => void {
    this.completeCallbacks.add(callback);
    return () => this.completeCallbacks.delete(callback);
  }

  onStart(callback: () => void): () => void {
    this.startCallbacks.add(callback);
    return () => this.startCallbacks.delete(callback);
  }

  destroy(): void {
    this.stop();
    this.frameCallbacks.clear();
    this.completeCallbacks.clear();
    this.startCallbacks.clear();
  }

  update(currentTime: number): void {
    // Manual update for external loop control
    if (!this.isRunning) return;

    let deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Apply time scale
    deltaTime *= this.timeScale;

    // Accumulate time
    this.accumulatedTime += deltaTime;

    // Process frames in fixed time steps for consistent 60 FPS
    while (this.accumulatedTime >= FRAME_TIME) {
      this.accumulatedTime -= FRAME_TIME;
      this.currentTime += FRAME_TIME;

      if (this.currentTime >= this.duration) {
        this.currentTime = this.duration;
        const progress = this.getProgress();
        this.emitFrame(progress, FRAME_TIME);

        if (this.loop && (this.loopCount === 0 || this.currentLoop < this.loopCount - 1)) {
          this.currentLoop++;
          this.currentTime = 0;
        } else {
          this.stop();
          this.emitComplete();
          return;
        }
      } else {
        const progress = this.getProgress();
        this.emitFrame(progress, FRAME_TIME);
      }
    }
  }

  private tick = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    let deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Apply time scale
    deltaTime *= this.timeScale;

    // Accumulate time
    this.accumulatedTime += deltaTime;

    // Process frames in fixed time steps for consistent 60 FPS
    while (this.accumulatedTime >= FRAME_TIME) {
      this.accumulatedTime -= FRAME_TIME;
      this.currentTime += FRAME_TIME;

      if (this.currentTime >= this.duration) {
        this.currentTime = this.duration;
        const progress = this.getProgress();
        this.emitFrame(progress, FRAME_TIME);

        if (this.loop && (this.loopCount === 0 || this.currentLoop < this.loopCount - 1)) {
          this.currentLoop++;
          this.currentTime = 0;
        } else {
          this.stop();
          this.emitComplete();
          return;
        }
      } else {
        const progress = this.getProgress();
        this.emitFrame(progress, FRAME_TIME);
      }
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  private emitFrame(progress: number, deltaTime: number): void {
    for (const callback of this.frameCallbacks) {
      try {
        callback(progress, deltaTime);
      } catch (error) {
        console.error('Error in timeline frame callback:', error);
      }
    }
  }

  private emitComplete(): void {
    for (const callback of this.completeCallbacks) {
      try {
        callback();
      } catch (error) {
        console.error('Error in timeline complete callback:', error);
      }
    }
  }

  private emitStart(): void {
    for (const callback of this.startCallbacks) {
      try {
        callback();
      } catch (error) {
        console.error('Error in timeline start callback:', error);
      }
    }
  }
}

export { TimelineEngine as default };
