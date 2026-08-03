/**
 * Blink Engine - M02 Companion Engine
 * 
 * Features:
 * - Random blink timing (2-8 seconds)
 * - Smooth eyelid animation
 * - Configurable blink speed
 * - Emotion-aware frequency
 */

import type { EmotionType } from '../geometry/types';
import {
  DEFAULT_BLINK_CONFIG,
  type IBlinkConfig,
  BlinkState,
  type IBlinkAnimation,
  type IBlinkEvent,
} from './types';

/**
 * Blink Engine interface
 */
export interface IBlinkEngine {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  update(deltaTime: number): void;
  getEyeOpenness(): number;
  isBlinking(): boolean;
  triggerBlink(): void;
  setEmotion(emotion: EmotionType): void;
  setConfig(config: Partial<IBlinkConfig>): void;
  getConfig(): IBlinkConfig;
  onBlinkStart(callback: () => void): () => void;
  onBlinkEnd(callback: () => void): () => void;
  onBlinkMid(callback: () => void): () => void;
}

/**
 * Blink Engine implementation
 */
export class BlinkEngine implements IBlinkEngine {
  private readonly config: IBlinkConfig;
  
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private currentEmotion: EmotionType = 'neutral';
  
  // Blink timing
  private timeSinceLastBlink: number = 0;
  private nextBlinkTime: number = 0;
  
  // Blink animation state
  private blinkState: BlinkState = BlinkState.Idle;
  private blinkProgress: number = 0;
  private eyelidTop: number = 0;
  private eyelidBottom: number = 0;
  
  // Double blink
  private isDoubleBlink: boolean = false;
  private secondBlinkDelay: number = 0;
  private hasTriggeredSecondBlink: boolean = false;
  
  // Callbacks
  private blinkStartCallbacks: Array<() => void> = [];
  private blinkEndCallbacks: Array<() => void> = [];
  private blinkMidCallbacks: Array<() => void> = [];
  
  // Easing function for smooth animation
  private readonly easeInOutQuad = (t: number): number => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  };
  
  private readonly easeOutQuad = (t: number): number => {
    return 1 - (1 - t) * (1 - t);
  };

  constructor(config?: Partial<IBlinkConfig>) {
    this.config = { ...DEFAULT_BLINK_CONFIG, ...config };
    this.scheduleNextBlink();
  }

  /**
   * Start the blink engine
   */
  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.isPaused = false;
      this.timeSinceLastBlink = 0;
      this.scheduleNextBlink();
    }
  }

  /**
   * Stop the blink engine
   */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.resetBlinkState();
  }

  /**
   * Pause the blink engine
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume the blink engine
   */
  resume(): void {
    if (this.isRunning) {
      this.isPaused = false;
    }
  }

  /**
   * Update blink engine state
   */
  update(deltaTime: number): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }
    
    // Update time since last blink
    this.timeSinceLastBlink += deltaTime;
    
    // Check if it's time for a blink
    if (this.blinkState === BlinkState.Idle && this.timeSinceLastBlink >= this.nextBlinkTime) {
      this.startBlink();
    }
    
    // Update blink animation
    this.updateBlinkAnimation(deltaTime);
  }

  /**
   * Get current eye openness (0 = closed, 1 = open)
   */
  getEyeOpenness(): number {
    // Eye openness is inverse of eyelid position
    const openness = 1 - Math.max(this.eyelidTop, this.eyelidBottom);
    return Math.max(0, Math.min(1, openness));
  }

  /**
   * Check if currently blinking
   */
  isBlinking(): boolean {
    return this.blinkState !== BlinkState.Idle;
  }

  /**
   * Manually trigger a blink
   */
  triggerBlink(): void {
    if (this.blinkState === BlinkState.Idle) {
      this.startBlink();
    }
  }

  /**
   * Set current emotion (affects blink frequency)
   */
  setEmotion(emotion: EmotionType): void {
    this.currentEmotion = emotion;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<IBlinkConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Get current configuration
   */
  getConfig(): IBlinkConfig {
    return { ...this.config };
  }

  /**
   * Register blink start callback
   */
  onBlinkStart(callback: () => void): () => void {
    this.blinkStartCallbacks.push(callback);
    return () => {
      const index = this.blinkStartCallbacks.indexOf(callback);
      if (index > -1) this.blinkStartCallbacks.splice(index, 1);
    };
  }

  /**
   * Register blink end callback
   */
  onBlinkEnd(callback: () => void): () => void {
    this.blinkEndCallbacks.push(callback);
    return () => {
      const index = this.blinkEndCallbacks.indexOf(callback);
      if (index > -1) this.blinkEndCallbacks.splice(index, 1);
    };
  }

  /**
   * Register blink mid-point callback
   */
  onBlinkMid(callback: () => void): () => void {
    this.blinkMidCallbacks.push(callback);
    return () => {
      const index = this.blinkMidCallbacks.indexOf(callback);
      if (index > -1) this.blinkMidCallbacks.splice(index, 1);
    };
  }

  /**
   * Get blink animation state
   */
  getBlinkAnimation(): IBlinkAnimation {
    return {
      state: this.blinkState,
      progress: this.blinkProgress,
      eyelidTop: this.eyelidTop,
      eyelidBottom: this.eyelidBottom,
      isDoubleBlink: this.isDoubleBlink,
      secondBlinkDelay: this.secondBlinkDelay,
    };
  }

  /**
   * Schedule the next blink
   */
  private scheduleNextBlink(): void {
    const multiplier = this.config.emotionMultiplier[this.currentEmotion];
    const adjustedMin = this.config.minInterval * multiplier;
    const adjustedMax = this.config.maxInterval * multiplier;
    
    const randomFactor = Math.random();
    this.nextBlinkTime = adjustedMin + randomFactor * (adjustedMax - adjustedMin);
  }

  /**
   * Start a blink animation
   */
  private startBlink(): void {
    this.blinkState = BlinkState.Closing;
    this.blinkProgress = 0;
    
    // Check for double blink
    this.isDoubleBlink = Math.random() < this.config.doubleBlinkChance;
    this.secondBlinkDelay = 0;
    this.hasTriggeredSecondBlink = false;
    
    // Notify callbacks
    this.blinkStartCallbacks.forEach(cb => cb());
  }

  /**
   * Update blink animation
   */
  private updateBlinkAnimation(deltaTime: number): void {
    const phaseDuration = this.config.blinkDuration / 2; // Half duration per phase
    
    switch (this.blinkState) {
      case BlinkState.Closing:
        this.blinkProgress += deltaTime / phaseDuration;
        if (this.blinkProgress >= 1) {
          this.blinkProgress = 1;
          this.blinkState = BlinkState.Closed;
          this.eyelidTop = 1;
          this.eyelidBottom = 1;
          this.blinkMidCallbacks.forEach(cb => cb());
        } else {
          const easedProgress = this.easeInOutQuad(this.blinkProgress);
          this.eyelidTop = easedProgress;
          this.eyelidBottom = easedProgress;
        }
        break;
        
      case BlinkState.Closed:
        this.blinkProgress += deltaTime / phaseDuration;
        if (this.blinkProgress >= 1) {
          this.blinkState = BlinkState.Opening;
          this.blinkProgress = 0;
        }
        break;
        
      case BlinkState.Opening:
        this.blinkProgress += deltaTime / phaseDuration;
        if (this.blinkProgress >= 1) {
          this.blinkProgress = 1;
          this.eyelidTop = 0;
          this.eyelidBottom = 0;
          
          // Handle double blink
          if (this.isDoubleBlink && !this.hasTriggeredSecondBlink) {
            this.hasTriggeredSecondBlink = true;
            this.secondBlinkDelay = 0;
            this.blinkState = BlinkState.Closing;
            this.blinkProgress = 0;
          } else {
            this.blinkState = BlinkState.Idle;
            this.timeSinceLastBlink = 0;
            this.scheduleNextBlink();
            this.blinkEndCallbacks.forEach(cb => cb());
          }
        } else {
          const easedProgress = this.easeOutQuad(this.blinkProgress);
          this.eyelidTop = 1 - easedProgress;
          this.eyelidBottom = 1 - easedProgress;
        }
        break;
        
      case BlinkState.Idle:
      default:
        // Do nothing
        break;
    }
  }

  /**
   * Reset blink state
   */
  private resetBlinkState(): void {
    this.blinkState = BlinkState.Idle;
    this.blinkProgress = 0;
    this.eyelidTop = 0;
    this.eyelidBottom = 0;
    this.isDoubleBlink = false;
    this.secondBlinkDelay = 0;
    this.hasTriggeredSecondBlink = false;
  }
}

export default BlinkEngine;
