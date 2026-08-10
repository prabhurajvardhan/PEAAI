/**
 * Transition Timeline Controller
 * 
 * Coordinates transition timing and synchronization.
 * 
 * Features:
 * - Duration control
 * - Sync with animations
 * - Interrupt handling
 * - Pre/post hooks
 */

import type { IFaceState } from '../../companion/geometry/types';
import type { GeneratedScene } from '../../story-viz/scene-generator/types';
import type { 
  TransitionMode, 
  TransitionPhase, 
  TransitionLifecycleHooks,
  TransitionHooks,
} from '../types';
import type { 
  TimelineConfig, 
  TimelineState,
  TimelineCallback,
  TimelineEvent,
  TimelineEventType,
  TimelineSegment,
  TimelineKeyframe,
  TransitionRequest,
  AnimationSyncData,
  ScheduledHook,
  DEFAULT_TIMELINE_CONFIG,
} from './types';

/**
 * Transition Timeline Controller
 */
export class TransitionTimelineController {
  private config: TimelineConfig;
  private state: TimelineState;
  private segments: TimelineSegment[] = [];
  private scheduledHooks: ScheduledHook[] = [];
  private currentTransition: TransitionRequest | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private animationFrameId: number | null = null;
  private callbacks: Set<TimelineCallback> = new Set();
  private eventListeners: Map<TimelineEventType, Set<(event: TimelineEvent) => void>> = new Map();

  constructor(config?: Partial<TimelineConfig>) {
    this.config = {
      ...DEFAULT_TIMELINE_CONFIG,
      ...config,
      hooks: {
        ...DEFAULT_TIMELINE_CONFIG.hooks,
        ...config?.hooks,
      },
    };
    
    this.state = this.createInitialState();
  }

  /**
   * Create initial timeline state
   */
  private createInitialState(): TimelineState {
    return {
      isPlaying: false,
      isPaused: false,
      isComplete: false,
      currentTime: 0,
      duration: this.config.totalDuration,
      progress: 0,
      phase: 'idle',
    };
  }

  /**
   * Build timeline segments
   */
  private buildSegments(): void {
    this.segments = [];
    let currentTime = 0;
    
    // Capture segment
    const captureSegment: TimelineSegment = {
      id: 'capture',
      name: 'Capture',
      startTime: currentTime,
      endTime: currentTime + this.config.captureDuration,
      phase: 'capturing',
      duration: this.config.captureDuration,
    };
    this.segments.push(captureSegment);
    currentTime = captureSegment.endTime;
    
    // Dissolve segment
    const dissolveSegment: TimelineSegment = {
      id: 'dissolve',
      name: 'Dissolve',
      startTime: currentTime,
      endTime: currentTime + this.config.dissolveDuration,
      phase: 'dissolving',
      duration: this.config.dissolveDuration,
    };
    this.segments.push(dissolveSegment);
    currentTime = dissolveSegment.endTime;
    
    // Merge segment
    const mergeSegment: TimelineSegment = {
      id: 'merge',
      name: 'Merge',
      startTime: currentTime,
      endTime: currentTime + this.config.mergeDuration,
      phase: 'merging',
      duration: this.config.mergeDuration,
    };
    this.segments.push(mergeSegment);
    currentTime = mergeSegment.endTime;
    
    // Fade segment
    const fadeSegment: TimelineSegment = {
      id: 'fade',
      name: 'Fade',
      startTime: currentTime,
      endTime: currentTime + this.config.fadeDuration,
      phase: 'complete',
      duration: this.config.fadeDuration,
    };
    this.segments.push(fadeSegment);
    
    this.config.totalDuration = fadeSegment.endTime;
  }

  /**
   * Start a transition
   */
  async start(request: TransitionRequest): Promise<void> {
    if (this.isRunning && !this.config.enableInterruption) {
      throw new Error('Transition already in progress and interruption is disabled');
    }
    
    // If already running, interrupt
    if (this.isRunning) {
      await this.interrupt();
    }
    
    this.currentTransition = request;
    this.isRunning = true;
    this.isPaused = false;
    this.state = this.createInitialState();
    this.state.isPlaying = true;
    
    // Build segments
    this.buildSegments();
    
    // Schedule hooks
    this.scheduleHooks();
    
    // Execute pre-hooks
    await this.executePreHooks(request.mode);
    
    // Start timing
    this.startTime = performance.now();
    this.pausedTime = 0;
    
    this.emit('play', { type: 'play' } as TimelineEvent);
    
    // Start animation loop
    this.runAnimationLoop();
  }

  /**
   * Run the animation loop
   */
  private runAnimationLoop(): void {
    if (!this.isRunning || this.isPaused) return;
    
    const update = () => {
      if (!this.isRunning || this.isPaused) return;
      
      const elapsed = performance.now() - this.startTime - this.pausedTime;
      this.update(elapsed);
      
      if (this.state.isComplete) {
        this.complete();
      } else if (this.isRunning) {
        this.animationFrameId = requestAnimationFrame(update);
      }
    };
    
    this.animationFrameId = requestAnimationFrame(update);
  }

  /**
   * Update timeline state
   */
  private update(elapsed: number): void {
    const { totalDuration } = this.config;
    
    if (elapsed >= totalDuration) {
      this.state.currentTime = totalDuration;
      this.state.progress = 1;
      this.state.isComplete = true;
      this.state.phase = 'complete';
      this.notifyCallbacks();
      return;
    }
    
    this.state.currentTime = elapsed;
    this.state.progress = elapsed / totalDuration;
    
    // Update phase based on current time
    const segment = this.getSegmentAtTime(elapsed);
    if (segment && segment.phase !== this.state.phase) {
      const oldPhase = this.state.phase;
      this.state.phase = segment.phase;
      this.emit('phaseChange', { 
        type: 'phaseChange', 
        phase: segment.phase,
        previousPhase: oldPhase 
      } as TimelineEvent);
    }
    
    // Execute scheduled hooks
    this.executeScheduledHooks(elapsed);
    
    this.notifyCallbacks();
    this.emit('progress', { 
      type: 'progress', 
      currentTime: elapsed,
      phase: this.state.phase 
    } as TimelineEvent);
  }

  /**
   * Get segment at a specific time
   */
  private getSegmentAtTime(time: number): TimelineSegment | null {
    for (const segment of this.segments) {
      if (time >= segment.startTime && time < segment.endTime) {
        return segment;
      }
    }
    return null;
  }

  /**
   * Get progress within current phase
   */
  getPhaseProgress(): number {
    const segment = this.getSegmentAtTime(this.state.currentTime);
    if (!segment) return 1;
    
    const segmentElapsed = this.state.currentTime - segment.startTime;
    return segmentElapsed / segment.duration;
  }

  /**
   * Schedule hooks for execution
   */
  private scheduleHooks(): void {
    this.scheduledHooks = [];
    const hooks = this.config.hooks;
    
    // Schedule pre-face hook
    if (hooks.preFace) {
      this.scheduledHooks.push({
        name: 'preFace',
        time: 0,
        handler: hooks.preFace,
        executed: false,
      });
    }
    
    // Schedule post-face hook
    if (hooks.postFace) {
      const postFaceTime = this.config.totalDuration - 50; // Near the end
      this.scheduledHooks.push({
        name: 'postFace',
        time: postFaceTime,
        handler: hooks.postFace,
        executed: false,
      });
    }
    
    // Schedule pre-story hook
    if (hooks.preStory) {
      this.scheduledHooks.push({
        name: 'preStory',
        time: this.config.captureDuration + 50,
        handler: hooks.preStory,
        executed: false,
      });
    }
    
    // Schedule post-story hook
    if (hooks.postStory) {
      this.scheduledHooks.push({
        name: 'postStory',
        time: this.config.captureDuration + this.config.dissolveDuration + 50,
        handler: hooks.postStory,
        executed: false,
      });
    }
  }

  /**
   * Execute scheduled hooks
   */
  private async executeScheduledHooks(currentTime: number): Promise<void> {
    for (const hook of this.scheduledHooks) {
      if (!hook.executed && currentTime >= hook.time) {
        hook.executed = true;
        try {
          await hook.handler();
        } catch (error) {
          console.error(`Error executing hook ${hook.name}:`, error);
        }
      }
    }
  }

  /**
   * Execute pre-transition hooks
   */
  private async executePreHooks(mode: TransitionMode): Promise<void> {
    const hooks = this.config.hooks;
    
    try {
      if (mode === 'face-to-story') {
        await hooks.preStory?.();
      } else {
        await hooks.preFace?.();
      }
    } catch (error) {
      console.error('Error executing pre-hooks:', error);
    }
  }

  /**
   * Complete the transition
   */
  private async complete(): Promise<void> {
    this.isRunning = false;
    this.state.isPlaying = false;
    this.state.isComplete = true;
    this.state.phase = 'complete';
    
    // Execute post-hooks
    if (this.currentTransition) {
      const hooks = this.config.hooks;
      try {
        if (this.currentTransition.mode === 'face-to-story') {
          await hooks.postStory?.();
        } else {
          await hooks.postFace?.();
        }
      } catch (error) {
        console.error('Error executing post-hooks:', error);
      }
    }
    
    this.notifyCallbacks();
    this.emit('complete', { 
      type: 'complete',
      currentTime: this.state.currentTime,
      phase: this.state.phase 
    } as TimelineEvent);
    
    // Clean up
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Pause the timeline
   */
  pause(): void {
    if (!this.isRunning || this.isPaused) return;
    
    this.isPaused = true;
    this.pausedTime = performance.now();
    this.state.isPaused = true;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.emit('pause', { 
      type: 'pause',
      currentTime: this.state.currentTime,
      phase: this.state.phase 
    } as TimelineEvent);
    
    this.notifyCallbacks();
  }

  /**
   * Resume the timeline
   */
  resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    
    const pauseDuration = performance.now() - this.pausedTime;
    this.startTime += pauseDuration;
    this.isPaused = false;
    this.state.isPaused = false;
    
    this.emit('play', { 
      type: 'play',
      currentTime: this.state.currentTime,
      phase: this.state.phase 
    } as TimelineEvent);
    
    this.runAnimationLoop();
    this.notifyCallbacks();
  }

  /**
   * Stop the timeline
   */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.state = this.createInitialState();
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.emit('stop', { 
      type: 'stop',
      currentTime: 0,
      phase: 'idle' 
    } as TimelineEvent);
    
    this.notifyCallbacks();
  }

  /**
   * Seek to a specific time
   */
  seek(time: number): void {
    const clampedTime = Math.max(0, Math.min(time, this.config.totalDuration));
    
    this.state.currentTime = clampedTime;
    this.state.progress = clampedTime / this.config.totalDuration;
    
    // Update phase
    const segment = this.getSegmentAtTime(clampedTime);
    if (segment) {
      this.state.phase = segment.phase;
    }
    
    this.emit('seek', { 
      type: 'seek',
      currentTime: clampedTime,
      phase: this.state.phase 
    } as TimelineEvent);
    
    this.notifyCallbacks();
  }

  /**
   * Interrupt the current transition
   */
  async interrupt(): Promise<void> {
    if (!this.isRunning) return;
    
    const wasRunning = this.isRunning;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.isRunning = false;
    this.isPaused = false;
    this.state = this.createInitialState();
    this.state.phase = 'cancelled';
    
    this.emit('interrupt', { 
      type: 'interrupt',
      currentTime: this.state.currentTime,
      phase: 'cancelled' 
    } as TimelineEvent);
    
    this.notifyCallbacks();
  }

  /**
   * Get current state
   */
  getState(): TimelineState {
    return { ...this.state };
  }

  /**
   * Get segments
   */
  getSegments(): TimelineSegment[] {
    return [...this.segments];
  }

  /**
   * Get current segment
   */
  getCurrentSegment(): TimelineSegment | null {
    return this.getSegmentAtTime(this.state.currentTime);
  }

  /**
   * Get configuration
   */
  getConfig(): TimelineConfig {
    return { 
      ...this.config,
      hooks: { ...this.config.hooks },
    };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<TimelineConfig>): void {
    this.config = { 
      ...this.config, 
      ...config,
      hooks: {
        ...this.config.hooks,
        ...config.hooks,
      },
    };
    this.state.duration = this.config.totalDuration;
  }

  /**
   * Set lifecycle hooks
   */
  setLifecycleHooks(hooks: TransitionLifecycleHooks): void {
    this.config.hooks = { ...this.config.hooks, ...hooks };
  }

  /**
   * Subscribe to state updates
   */
  onProgress(callback: TimelineCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Add event listener
   */
  on(event: TimelineEventType, handler: (event: TimelineEvent) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
    return () => this.eventListeners.get(event)?.delete(handler);
  }

  /**
   * Emit an event
   */
  private emit(type: TimelineEventType, event: TimelineEvent): void {
    event.timestamp = performance.now();
    event.type = type;
    
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(handler => handler(event));
    }
  }

  /**
   * Check if timeline is playing
   */
  isPlaying(): boolean {
    return this.isRunning && !this.isPaused;
  }

  /**
   * Check if timeline is paused
   */
  isPausedState(): boolean {
    return this.isPaused;
  }

  /**
   * Check if timeline is active
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Notify all callbacks of state change
   */
  private notifyCallbacks(): void {
    const state = this.getState();
    this.callbacks.forEach(callback => callback(state));
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.stop();
    this.segments = [];
    this.scheduledHooks = [];
    this.currentTransition = null;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.reset();
    this.callbacks.clear();
    this.eventListeners.clear();
  }
}

/**
 * Create a timeline controller with default configuration
 */
export function createTimelineController(config?: Partial<TimelineConfig>): TransitionTimelineController {
  return new TransitionTimelineController(config);
}
