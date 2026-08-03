/**
 * Animation Queue - Queue and prioritize animations
 * 
 * Features:
 * - Priority-based queue management
 * - Concurrent animation support
 * - Animation cancellation
 * - Queue filtering and querying
 */

import { AnimationPriority, EasingFunction } from '../types';

export interface IAnimation {
  id: string;
  name: string;
  priority?: AnimationPriority;
  duration: number;
  delay?: number;
  state: 'pending' | 'running' | 'paused' | 'completed' | 'cancelled';
  startTime?: number;
  properties: Record<string, { from: number; to: number }>;
  easing?: EasingFunction;
  onStart?: () => void;
  onUpdate?: (progress: number, values: Record<string, number>) => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export interface IAnimationQueue {
  enqueue(animation: Omit<IAnimation, 'id' | 'state' | 'priority' | 'delay' | 'easing'> & Partial<Pick<IAnimation, 'priority' | 'delay' | 'easing'>>): string;
  dequeue(): IAnimation | null;
  cancel(id: string): boolean;
  cancelAll(filter?: (anim: IAnimation) => boolean): number;
  pause(id: string): boolean;
  pauseAll(): void;
  resume(id: string): boolean;
  resumeAll(): void;
  get(id: string): IAnimation | null;
  getAll(): IAnimation[];
  getByPriority(priority: AnimationPriority): IAnimation[];
  getByState(state: IAnimation['state']): IAnimation[];
  clear(): void;
  size: number;
  onChange(callback: (animations: IAnimation[]) => void): () => void;
}

export interface QueueConfig {
  maxConcurrent?: number;
  maxQueueSize?: number;
  defaultPriority?: AnimationPriority;
  allowDuplicates?: boolean;
}

const DEFAULT_CONFIG = {
  maxConcurrent: Infinity,
  maxQueueSize: Infinity,
  defaultPriority: 'normal' as AnimationPriority,
  allowDuplicates: false,
};

const PRIORITY_ORDER: Record<AnimationPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

let animationIdCounter = 0;

function generateAnimationId(): string {
  return `anim_${++animationIdCounter}_${Date.now()}`;
}

/**
 * Animation Queue for managing multiple concurrent animations
 */
export class AnimationQueue implements IAnimationQueue {
  private queue: IAnimation[] = [];
  private running: Map<string, IAnimation> = new Map();
  private maxConcurrent: number;
  private maxQueueSize: number;
  private defaultPriority: AnimationPriority;
  private allowDuplicates: boolean;
  private changeCallbacks: Set<(animations: IAnimation[]) => void> = new Set();

  constructor(config: QueueConfig = {}) {
    this.maxConcurrent = config.maxConcurrent ?? DEFAULT_CONFIG.maxConcurrent;
    this.maxQueueSize = config.maxQueueSize ?? DEFAULT_CONFIG.maxQueueSize;
    this.defaultPriority = config.defaultPriority ?? DEFAULT_CONFIG.defaultPriority;
    this.allowDuplicates = config.allowDuplicates ?? DEFAULT_CONFIG.allowDuplicates;
  }

  get size(): number {
    return this.queue.length + this.running.size;
  }

  enqueue(animation: Omit<IAnimation, 'id' | 'state' | 'priority' | 'delay' | 'easing'> & Partial<Pick<IAnimation, 'priority' | 'delay' | 'easing'>>): string {
    const id = generateAnimationId();
    
    const newAnimation: IAnimation = {
      ...animation,
      id,
      state: 'pending',
      priority: animation.priority ?? this.defaultPriority,
      delay: animation.delay ?? 0,
      easing: animation.easing ?? ((t: number) => t),
    };

    // Check queue size limit
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error(`Queue is full (max: ${this.maxQueueSize})`);
    }

    // Check for duplicates
    if (!this.allowDuplicates) {
      const duplicate = this.queue.find(a => a.name === animation.name);
      if (duplicate) {
        throw new Error(`Animation with name "${animation.name}" already in queue`);
      }
    }

    // Insert based on priority
    this.insertByPriority(newAnimation);
    this.notifyChange();

    return id;
  }

  dequeue(): IAnimation | null {
    if (this.running.size >= this.maxConcurrent) {
      return null;
    }

    const animation = this.queue.shift() ?? null;
    
    if (animation) {
      animation.state = 'running';
      animation.startTime = performance.now();
      this.running.set(animation.id, animation);
      this.notifyChange();
    }

    return animation;
  }

  cancel(id: string): boolean {
    // Check running animations
    const runningAnim = this.running.get(id);
    if (runningAnim) {
      runningAnim.state = 'cancelled';
      this.running.delete(id);
      if (runningAnim.onCancel) {
        runningAnim.onCancel();
      }
      this.notifyChange();
      return true;
    }

    // Check queued animations
    const queueIndex = this.queue.findIndex(a => a.id === id);
    if (queueIndex !== -1) {
      const queuedAnim = this.queue[queueIndex];
      queuedAnim.state = 'cancelled';
      this.queue.splice(queueIndex, 1);
      this.notifyChange();
      return true;
    }

    return false;
  }

  cancelAll(filter?: (anim: IAnimation) => boolean): number {
    let cancelledCount = 0;

    // Cancel running animations
    for (const [id, animation] of this.running) {
      if (!filter || filter(animation)) {
        animation.state = 'cancelled';
        this.running.delete(id);
        if (animation.onCancel) {
          animation.onCancel();
        }
        cancelledCount++;
      }
    }

    // Cancel queued animations
    if (!filter) {
      cancelledCount += this.queue.length;
      this.queue = [];
    } else {
      const remaining: IAnimation[] = [];
      for (const animation of this.queue) {
        if (filter(animation)) {
          animation.state = 'cancelled';
          cancelledCount++;
        } else {
          remaining.push(animation);
        }
      }
      this.queue = remaining;
    }

    if (cancelledCount > 0) {
      this.notifyChange();
    }

    return cancelledCount;
  }

  pause(id: string): boolean {
    const animation = this.running.get(id);
    if (animation && animation.state === 'running') {
      animation.state = 'paused';
      this.notifyChange();
      return true;
    }
    return false;
  }

  pauseAll(): void {
    for (const animation of this.running.values()) {
      if (animation.state === 'running') {
        animation.state = 'paused';
      }
    }
    this.notifyChange();
  }

  resume(id: string): boolean {
    const animation = this.running.get(id);
    if (animation && animation.state === 'paused') {
      animation.state = 'running';
      this.notifyChange();
      return true;
    }
    return false;
  }

  resumeAll(): void {
    for (const animation of this.running.values()) {
      if (animation.state === 'paused') {
        animation.state = 'running';
      }
    }
    this.notifyChange();
  }

  get(id: string): IAnimation | null {
    const runningAnim = this.running.get(id);
    if (runningAnim) return runningAnim;

    return this.queue.find(a => a.id === id) ?? null;
  }

  getAll(): IAnimation[] {
    return [...Array.from(this.running.values()), ...this.queue];
  }

  getByPriority(priority: AnimationPriority): IAnimation[] {
    return this.queue.filter(a => a.priority === priority);
  }

  getByState(state: IAnimation['state']): IAnimation[] {
    const runningByState = Array.from(this.running.values()).filter(a => a.state === state);
    const queuedByState = this.queue.filter(a => a.state === state);
    return [...runningByState, ...queuedByState];
  }

  clear(): void {
    this.cancelAll();
    this.notifyChange();
  }

  onChange(callback: (animations: IAnimation[]) => void): () => void {
    this.changeCallbacks.add(callback);
    return () => this.changeCallbacks.delete(callback);
  }

  /**
   * Update running animations - call this in your animation loop
   */
  update(currentTime: number): void {
    const completed: string[] = [];

    for (const [id, animation] of this.running) {
      if (animation.state !== 'running') continue;

      const delay = animation.delay ?? 0;
      const elapsed = currentTime - (animation.startTime ?? currentTime) - delay;
      
      if (elapsed < 0) continue;

      const progress = Math.min(elapsed / animation.duration, 1);
      
      if (progress >= 1) {
        animation.state = 'completed';
        completed.push(id);
        
        const values: Record<string, number> = {};
        for (const [key, prop] of Object.entries(animation.properties)) {
          values[key] = prop.to;
        }
        
        if (animation.onUpdate) {
          animation.onUpdate(1, values);
        }
        if (animation.onComplete) {
          animation.onComplete();
        }
      } else {
        const easing = animation.easing ?? ((t: number) => t);
        const easedProgress = easing(progress);
        
        const values: Record<string, number> = {};
        for (const [key, prop] of Object.entries(animation.properties)) {
          values[key] = prop.from + (prop.to - prop.from) * easedProgress;
        }
        
        if (animation.onUpdate) {
          animation.onUpdate(progress, values);
        }
      }
    }

    // Remove completed animations
    for (const id of completed) {
      this.running.delete(id);
    }

    if (completed.length > 0) {
      this.notifyChange();
    }
  }

  /**
   * Start next animations if slots available
   */
  processQueue(): number {
    let started = 0;
    while (
      this.running.size < this.maxConcurrent &&
      this.queue.length > 0
    ) {
      const animation = this.dequeue();
      if (!animation) break;
      
      if (animation.onStart) {
        animation.onStart();
      }
      started++;
    }
    return started;
  }

  /**
   * Get current running animations
   */
  getRunning(): IAnimation[] {
    return Array.from(this.running.values());
  }

  /**
   * Get queued animations (not running)
   */
  getQueued(): IAnimation[] {
    return [...this.queue];
  }

  /**
   * Check if any animations are running
   */
  isActive(): boolean {
    return this.running.size > 0;
  }

  private insertByPriority(animation: IAnimation): void {
    const animationPriority = animation.priority ?? this.defaultPriority;
    const priority = PRIORITY_ORDER[animationPriority];
    
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      const queueAnimPriority = this.queue[i].priority ?? this.defaultPriority;
      if (priority < PRIORITY_ORDER[queueAnimPriority]) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, animation);
  }

  private notifyChange(): void {
    const animations = this.getAll();
    for (const callback of this.changeCallbacks) {
      try {
        callback(animations);
      } catch (error) {
        console.error('Error in queue change callback:', error);
      }
    }
  }
}

export { AnimationQueue as default };
