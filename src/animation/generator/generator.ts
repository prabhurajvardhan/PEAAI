/**
 * Animation Generator - Procedural animation creation
 * 
 * Features:
 * - Expression animations (facial expressions)
 * - Transition animations
 * - Idle animations (breathing, blinking)
 * - Story animations
 * - Combined animation sequences
 */

import { TimelineEngine } from '../timeline';
import { KeyframeEngine } from '../keyframe';
import { InterpolationEngine } from '../interpolation';
import { AnimationQueue } from '../queue';
import { EasingFunction, IPosition } from '../types';
import { ICanvas, IPixelBuffer, PixelBuffer } from '../../graphics/index';

/**
 * Expression types for the companion
 */
export type ExpressionType = 
  | 'neutral' 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'surprised' 
  | 'thinking' 
  | 'curious' 
  | 'sleepy' 
  | 'excited';

/**
 * Expression state with all facial features
 */
export interface ExpressionState {
  eyeOpenness: number;      // 0-1
  pupilDirection: IPosition; // -1 to 1 normalized
  mouthOpenness: number;     // 0-1
  mouthCurve: number;        // -1 (frown) to 1 (smile)
  eyebrowAngle: number;      // -1 to 1
  cheekRaise: number;        // 0-1
}

/**
 * Animation target for rendering
 */
export interface AnimationTarget {
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  alpha?: number;
  expression?: ExpressionState;
  color?: { r: number; g: number; b: number; a: number };
}

/**
 * Animation generator configuration
 */
export interface AnimationGeneratorConfig {
  canvas?: ICanvas;
  fps?: number;
  autoStart?: boolean;
}

/**
 * Animation Generator - Creates and manages animations
 */
export class AnimationGenerator {
  private canvas: ICanvas | null = null;
  private timeline: TimelineEngine;
  private keyframeEngine: KeyframeEngine;
  private animationQueue: AnimationQueue;
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private currentExpression: ExpressionState;
  private idleState: IdleState;
  private onExpressionChangeCallbacks: Set<(expr: ExpressionState) => void> = new Set();
  private onAnimationCompleteCallbacks: Set<(name: string) => void> = new Set();

  constructor(config: AnimationGeneratorConfig = {}) {
    this.canvas = config.canvas ?? null;
    
    this.timeline = new TimelineEngine({
      duration: Infinity,
      autoPlay: false,
    });

    this.keyframeEngine = new KeyframeEngine();
    this.animationQueue = new AnimationQueue({
      maxConcurrent: 10,
    });

    // Default expression state
    this.currentExpression = {
      eyeOpenness: 1,
      pupilDirection: { x: 0, y: 0 },
      mouthOpenness: 0,
      mouthCurve: 0,
      eyebrowAngle: 0,
      cheekRaise: 0,
    };

    this.idleState = {
      breathing: { active: false, phase: 0 },
      blinking: { active: false, nextBlink: 0, blinkDuration: 0.1 },
      looking: { active: false, target: { x: 0, y: 0 }, current: { x: 0, y: 0 } },
    };

    // Set up timeline frame callback
    this.timeline.onFrame((progress, deltaTime) => {
      this.updateIdleAnimation(deltaTime);
    });

    if (config.autoStart) {
      this.start();
    }
  }

  /**
   * Connect to canvas for rendering
   */
  connectCanvas(canvas: ICanvas): void {
    this.canvas = canvas;
  }

  /**
   * Start the animation system
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.timeline.play();
    this.runLoop();
  }

  /**
   * Stop the animation system
   */
  stop(): void {
    this.isRunning = false;
    this.timeline.stop();
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Pause all animations
   */
  pause(): void {
    this.timeline.pause();
    this.animationQueue.pauseAll();
  }

  /**
   * Resume all animations
   */
  resume(): void {
    this.timeline.resume();
    this.animationQueue.resumeAll();
  }

  /**
   * Animate expression change
   */
  animateExpression(
    target: ExpressionState,
    duration: number = 300,
    easing: EasingFunction = InterpolationEngine.easeInOutSine
  ): Promise<void> {
    return new Promise((resolve) => {
      const startExpression = { ...this.currentExpression };
      const startTime = performance.now();

      const animationId = this.animationQueue.enqueue({
        name: `expression_${Date.now()}`,
        priority: 'high',
        duration,
        delay: 0,
        properties: this.createExpressionProperties(startExpression, target),
        easing,
        onUpdate: (progress, values) => {
          this.applyExpressionValues(values);
        },
        onComplete: () => {
          this.currentExpression = { ...target };
          this.notifyExpressionChange();
          resolve();
        },
      });

      this.animationQueue.processQueue();
    });
  }

  /**
   * Set expression immediately without animation
   */
  setExpression(expression: ExpressionState): void {
    this.currentExpression = { ...expression };
    this.notifyExpressionChange();
  }

  /**
   * Get current expression
   */
  getExpression(): ExpressionState {
    return { ...this.currentExpression };
  }

  /**
   * Create idle animation sequence
   */
  createIdleAnimation(type: 'breathing' | 'blinking' | 'looking' | 'all'): void {
    switch (type) {
      case 'breathing':
        this.idleState.breathing.active = true;
        this.startBreathingAnimation();
        break;

      case 'blinking':
        this.idleState.blinking.active = true;
        this.scheduleNextBlink();
        break;

      case 'looking':
        this.idleState.looking.active = true;
        this.startLookingAnimation();
        break;

      case 'all':
        this.createIdleAnimation('breathing');
        this.createIdleAnimation('blinking');
        this.createIdleAnimation('looking');
        break;
    }
  }

  /**
   * Stop idle animation
   */
  stopIdleAnimation(type: 'breathing' | 'blinking' | 'looking' | 'all'): void {
    switch (type) {
      case 'breathing':
        this.idleState.breathing.active = false;
        break;

      case 'blinking':
        this.idleState.blinking.active = false;
        break;

      case 'looking':
        this.idleState.looking.active = false;
        break;

      case 'all':
        this.idleState.breathing.active = false;
        this.idleState.blinking.active = false;
        this.idleState.looking.active = false;
        break;
    }
  }

  /**
   * Animate position change
   */
  animatePosition(
    target: IPosition,
    duration: number = 500,
    easing: EasingFunction = InterpolationEngine.easeOutQuad
  ): Promise<void> {
    return new Promise((resolve) => {
      // This would typically animate the canvas position
      // For now, we just resolve after duration
      setTimeout(resolve, duration);
    });
  }

  /**
   * Animate scale change
   */
  animateScale(
    target: number,
    duration: number = 300,
    easing: EasingFunction = InterpolationEngine.easeOutBack
  ): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, duration);
    });
  }

  /**
   * Create bounce animation
   */
  createBounceAnimation(intensity: number = 1): void {
    const bounceCount = 3;
    const bounceDuration = 150;

    for (let i = 0; i < bounceCount; i++) {
      const delay = i * bounceDuration * 2;
      const height = intensity * (10 - i * 2);

      setTimeout(() => {
        this.animatePosition(
          { x: 0, y: -height },
          bounceDuration,
          InterpolationEngine.easeOutQuad
        ).then(() => {
          this.animatePosition(
            { x: 0, y: 0 },
            bounceDuration,
            InterpolationEngine.easeInQuad
          );
        });
      }, delay);
    }
  }

  /**
   * Create shake animation
   */
  createShakeAnimation(intensity: number = 5, duration: number = 500): void {
    const startTime = performance.now();
    const shake = () => {
      if (!this.isRunning) return;

      const elapsed = performance.now() - startTime;
      if (elapsed >= duration) return;

      const offset = Math.sin(elapsed * 0.05) * intensity * (1 - elapsed / duration);
      // Apply shake offset
      requestAnimationFrame(shake);
    };

    shake();
  }

  /**
   * Create fade animation
   */
  createFadeAnimation(
    fromAlpha: number,
    toAlpha: number,
    duration: number = 300,
    easing: EasingFunction = InterpolationEngine.easeInOutQuad
  ): Promise<void> {
    return new Promise((resolve) => {
      this.animationQueue.enqueue({
        name: `fade_${Date.now()}`,
        priority: 'normal',
        duration,
        delay: 0,
        properties: {
          alpha: { from: fromAlpha, to: toAlpha },
        },
        easing,
        onComplete: resolve,
      });

      this.animationQueue.processQueue();
    });
  }

  /**
   * Create dissolve transition animation
   */
  createDissolveAnimation(
    targetPixels: Uint8ClampedArray,
    duration: number = 500
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.canvas) {
        resolve();
        return;
      }

      const pixelBuffer = this.canvas.getPixelBuffer() as PixelBuffer;
      const bufferData = pixelBuffer.getData();
      const startTime = performance.now();

      const dissolve = () => {
        if (!this.isRunning) return;

        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Apply pixel dissolve effect
        for (let i = 0; i < bufferData.length; i += 4) {
          const noise = Math.random();
          if (noise < progress) {
            bufferData[i] = targetPixels[i];
            bufferData[i + 1] = targetPixels[i + 1];
            bufferData[i + 2] = targetPixels[i + 2];
            bufferData[i + 3] = targetPixels[i + 3];
          }
        }

        this.canvas?.render();

        if (progress < 1) {
          requestAnimationFrame(dissolve);
        } else {
          resolve();
        }
      };

      dissolve();
    });
  }

  /**
   * Create morph transition animation
   */
  createMorphAnimation(
    startPixels: Uint8ClampedArray,
    endPixels: Uint8ClampedArray,
    duration: number = 500,
    easing: EasingFunction = InterpolationEngine.easeInOutQuad
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.canvas) {
        resolve();
        return;
      }

      const pixelBuffer = this.canvas.getPixelBuffer() as PixelBuffer;
      const bufferData = pixelBuffer.getData();
      const startTime = performance.now();

      const morph = () => {
        if (!this.isRunning) return;

        const elapsed = performance.now() - startTime;
        const rawProgress = Math.min(elapsed / duration, 1);
        const progress = easing(rawProgress);

        for (let i = 0; i < bufferData.length; i += 4) {
          bufferData[i] = startPixels[i] + (endPixels[i] - startPixels[i]) * progress;
          bufferData[i + 1] = startPixels[i + 1] + (endPixels[i + 1] - startPixels[i + 1]) * progress;
          bufferData[i + 2] = startPixels[i + 2] + (endPixels[i + 2] - startPixels[i + 2]) * progress;
          bufferData[i + 3] = startPixels[i + 3] + (endPixels[i + 3] - startPixels[i + 3]) * progress;
        }

        this.canvas?.render();

        if (rawProgress < 1) {
          requestAnimationFrame(morph);
        } else {
          resolve();
        }
      };

      morph();
    });
  }

  /**
   * Create story scene transition
   */
  createStoryTransition(
    fromPixels: Uint8ClampedArray,
    toPixels: Uint8ClampedArray,
    duration: number = 1000
  ): Promise<void> {
    return this.createMorphAnimation(fromPixels, toPixels, duration, InterpolationEngine.easeInOutCubic);
  }

  /**
   * Create expression sequence
   */
  createExpressionSequence(
    expressions: Array<{ expression: Partial<ExpressionState>; duration: number; easing?: EasingFunction }>
  ): Promise<void> {
    return new Promise(async (resolve) => {
      for (const { expression, duration, easing } of expressions) {
        await this.animateExpression(
          { ...this.currentExpression, ...expression },
          duration,
          easing ?? InterpolationEngine.easeInOutSine
        );
      }
      resolve();
    });
  }

  /**
   * Subscribe to expression changes
   */
  onExpressionChange(callback: (expr: ExpressionState) => void): () => void {
    this.onExpressionChangeCallbacks.add(callback);
    return () => this.onExpressionChangeCallbacks.delete(callback);
  }

  /**
   * Subscribe to animation completion
   */
  onAnimationComplete(callback: (name: string) => void): () => void {
    this.onAnimationCompleteCallbacks.add(callback);
    return () => this.onAnimationCompleteCallbacks.delete(callback);
  }

  /**
   * Get current expression type based on state
   */
  getExpressionType(): ExpressionType {
    const expr = this.currentExpression;

    if (expr.eyeOpenness < 0.2) return 'sleepy';
    if (expr.mouthOpenness > 0.5 && expr.mouthCurve > 0.5) return 'excited';
    if (expr.mouthCurve > 0.5) return 'happy';
    if (expr.mouthCurve < -0.5) return 'sad';
    if (expr.eyebrowAngle < -0.3) return 'angry';
    if (expr.eyeOpenness > 0.9 && Math.abs(expr.pupilDirection.x) > 0.5) return 'surprised';
    if (Math.abs(expr.pupilDirection.x) > 0.3 && Math.abs(expr.pupilDirection.y) > 0.3) return 'curious';
    if (expr.pupilDirection.y > 0.3) return 'thinking';

    return 'neutral';
  }

  private runLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Update animation queue
    this.animationQueue.update(currentTime);
    this.animationQueue.processQueue();

    // Update timeline
    this.timeline.update(currentTime);

    // Render if canvas is connected
    if (this.canvas) {
      this.canvas.render();
    }

    this.animationFrameId = requestAnimationFrame(this.runLoop);
  };

  private updateIdleAnimation(deltaTime: number): void {
    // Update breathing
    if (this.idleState.breathing.active) {
      this.idleState.breathing.phase += deltaTime * 0.002;
      const breathOffset = Math.sin(this.idleState.breathing.phase) * 0.02;
      // Apply breathing effect to expression
    }

    // Update blinking is handled by scheduleNextBlink
    // Update looking is handled by startLookingAnimation
  }

  private startBreathingAnimation(): void {
    // Breathing is continuous, handled in updateIdleAnimation
  }

  private scheduleNextBlink(): void {
    if (!this.idleState.blinking.active) return;

    const nextBlinkDelay = 2000 + Math.random() * 6000; // 2-8 seconds

    setTimeout(() => {
      if (!this.idleState.blinking.active) return;

      // Blink animation
      const blinkDuration = this.idleState.blinking.blinkDuration * 1000;
      const halfBlink = blinkDuration / 2;

      // Close eyes
      this.animateExpression(
        { ...this.currentExpression, eyeOpenness: 0 },
        halfBlink,
        InterpolationEngine.easeInQuad
      ).then(() => {
        // Open eyes
        return this.animateExpression(
          { ...this.currentExpression, eyeOpenness: 1 },
          halfBlink,
          InterpolationEngine.easeOutQuad
        );
      }).then(() => {
        this.scheduleNextBlink();
      });
    }, nextBlinkDelay);
  }

  private startLookingAnimation(): void {
    if (!this.idleState.looking.active) return;

    const lookDuration = 3000 + Math.random() * 5000; // 3-8 seconds

    // Pick random look target
    this.idleState.looking.target = {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
    };

    // Animate to target
    this.animateExpression(
      { ...this.currentExpression, pupilDirection: this.idleState.looking.target },
      300,
      InterpolationEngine.easeOutQuad
    ).then(() => {
      return new Promise<void>((resolve) => {
        setTimeout(resolve, lookDuration);
      });
    }).then(() => {
      // Look back to center
      return this.animateExpression(
        { ...this.currentExpression, pupilDirection: { x: 0, y: 0 } },
        500,
        InterpolationEngine.easeInOutQuad
      );
    }).then(() => {
      this.startLookingAnimation();
    });
  }

  private createExpressionProperties(
    start: ExpressionState,
    target: ExpressionState
  ): Record<string, { from: number; to: number }> {
    return {
      eyeOpenness: { from: start.eyeOpenness, to: target.eyeOpenness },
      mouthOpenness: { from: start.mouthOpenness, to: target.mouthOpenness },
      mouthCurve: { from: start.mouthCurve, to: target.mouthCurve },
      eyebrowAngle: { from: start.eyebrowAngle, to: target.eyebrowAngle },
      cheekRaise: { from: start.cheekRaise, to: target.cheekRaise },
    };
  }

  private applyExpressionValues(values: Record<string, number>): void {
    if (values.eyeOpenness !== undefined) {
      this.currentExpression.eyeOpenness = values.eyeOpenness;
    }
    if (values.mouthOpenness !== undefined) {
      this.currentExpression.mouthOpenness = values.mouthOpenness;
    }
    if (values.mouthCurve !== undefined) {
      this.currentExpression.mouthCurve = values.mouthCurve;
    }
    if (values.eyebrowAngle !== undefined) {
      this.currentExpression.eyebrowAngle = values.eyebrowAngle;
    }
    if (values.cheekRaise !== undefined) {
      this.currentExpression.cheekRaise = values.cheekRaise;
    }
    // Note: pupilDirection requires special handling
    this.notifyExpressionChange();
  }

  private notifyExpressionChange(): void {
    const expr = this.currentExpression;
    for (const callback of this.onExpressionChangeCallbacks) {
      try {
        callback(expr);
      } catch (error) {
        console.error('Error in expression change callback:', error);
      }
    }
  }

  private notifyAnimationComplete(name: string): void {
    for (const callback of this.onAnimationCompleteCallbacks) {
      try {
        callback(name);
      } catch (error) {
        console.error('Error in animation complete callback:', error);
      }
    }
  }
}

/**
 * Idle state interface
 */
interface IdleState {
  breathing: {
    active: boolean;
    phase: number;
  };
  blinking: {
    active: boolean;
    nextBlink: number;
    blinkDuration: number;
  };
  looking: {
    active: boolean;
    target: IPosition;
    current: IPosition;
  };
}

export { AnimationGenerator as default };
