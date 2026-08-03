/**
 * Emotion Controller - M02 Companion Engine
 * 
 * Features:
 * - Emotion-to-expression mapping
 * - Smooth transitions between emotions
 * - Support for 10 emotion states
 * - Blended emotions
 */

import type { IPosition } from '../../graphics/types';
import {
  FaceGeometryEngine,
  type IFaceGeometry,
  DEFAULT_FACE_STATE,
  type EmotionType,
  type IFaceState,
} from '../geometry';
import {
  DEFAULT_EMOTION_CONFIG,
  type IEmotionConfig,
  type IEmotionExpression,
  type IBlendedEmotion,
  type IEmotionTransition,
  type IEmotionEvent,
  EMOTION_EXPRESSIONS,
} from './types';

/**
 * Emotion Controller interface
 */
export interface IEmotionController {
  setEmotion(emotion: EmotionType): Promise<void>;
  setEmotionImmediate(emotion: EmotionType): void;
  blendEmotions(emotions: IBlendedEmotion[]): Promise<void>;
  getCurrentEmotion(): EmotionType;
  getBlendedEmotions(): IBlendedEmotion[];
  getExpressionState(): IFaceState;
  isTransitioning(): boolean;
  onEmotionChange(callback: (event: IEmotionEvent) => void): () => void;
  update(deltaTime: number): void;
}

/**
 * Emotion Controller implementation
 */
export class EmotionController implements IEmotionController {
  private readonly geometry: IFaceGeometry;
  private readonly config: IEmotionConfig;
  
  private currentEmotion: EmotionType = 'neutral';
  private previousEmotion: EmotionType = 'neutral';
  private blendedEmotions: IBlendedEmotion[] = [];
  private isBlending: boolean = false;
  
  // Transition state
  private isTransitioning: boolean = false;
  private transitionProgress: number = 1.0;
  private transitionFrom: IEmotionExpression;
  private transitionTo: IEmotionExpression;
  
  // Current expression values (interpolated)
  private expressionValues: IEmotionExpression;
  
  // Callbacks
  private emotionChangeCallbacks: Array<(event: IEmotionEvent) => void> = [];

  constructor(
    geometry?: IFaceGeometry,
    config?: Partial<IEmotionConfig>
  ) {
    this.geometry = (geometry ?? new FaceGeometryEngine()) as IFaceGeometry;
    this.config = { ...DEFAULT_EMOTION_CONFIG, ...config };
    this.transitionFrom = EMOTION_EXPRESSIONS.neutral;
    this.transitionTo = EMOTION_EXPRESSIONS.neutral;
    this.expressionValues = { ...EMOTION_EXPRESSIONS.neutral };
  }

  /**
   * Set emotion with smooth transition
   */
  async setEmotion(emotion: EmotionType): Promise<void> {
    if (this.currentEmotion === emotion && !this.isBlending) {
      return;
    }
    
    this.previousEmotion = this.currentEmotion;
    this.currentEmotion = emotion;
    
    // Cancel any ongoing blending
    this.blendedEmotions = [];
    this.isBlending = false;
    
    // Start transition
    this.transitionFrom = { ...this.expressionValues };
    this.transitionTo = EMOTION_EXPRESSIONS[emotion];
    this.transitionProgress = 0;
    this.isTransitioning = true;
    
    // Emit transition start event
    this.emitEmotionEvent({
      type: 'transition_start',
      emotion,
      previousEmotion: this.previousEmotion,
    });
    
    // Wait for transition to complete
    return new Promise(resolve => {
      const checkComplete = () => {
        if (!this.isTransitioning) {
          resolve();
        } else {
          setTimeout(checkComplete, 50);
        }
      };
      checkComplete();
    });
  }

  /**
   * Set emotion immediately without transition
   */
  setEmotionImmediate(emotion: EmotionType): void {
    if (this.currentEmotion === emotion && !this.isBlending) {
      return;
    }
    
    this.previousEmotion = this.currentEmotion;
    this.currentEmotion = emotion;
    this.blendedEmotions = [];
    this.isBlending = false;
    this.expressionValues = { ...EMOTION_EXPRESSIONS[emotion] };
    this.isTransitioning = false;
    this.transitionProgress = 1.0;
    
    this.emitEmotionEvent({
      type: 'change',
      emotion,
      previousEmotion: this.previousEmotion,
    });
  }

  /**
   * Blend multiple emotions
   */
  async blendEmotions(emotions: IBlendedEmotion[]): Promise<void> {
    if (!this.config.blendEnabled) {
      // Fall back to single emotion if blending disabled
      const primaryEmotion = emotions.reduce((prev, curr) => 
        curr.weight > prev.weight ? curr : prev
      );
      return this.setEmotion(primaryEmotion.emotion);
    }
    
    // Validate emotions
    const validEmotions = emotions.filter(
      e => EMOTION_EXPRESSIONS[e.emotion] !== undefined
    );
    
    if (validEmotions.length === 0) {
      return;
    }
    
    // Normalize weights
    const totalWeight = validEmotions.reduce((sum, e) => sum + e.weight, 0);
    const normalizedEmotions = validEmotions.map(e => ({
      ...e,
      weight: e.weight / totalWeight,
    }));
    
    this.previousEmotion = this.currentEmotion;
    this.currentEmotion = normalizedEmotions[0].emotion;
    this.blendedEmotions = normalizedEmotions;
    this.isBlending = true;
    
    // Emit blend start event
    this.emitEmotionEvent({
      type: 'blend_start',
      emotion: normalizedEmotions[0].emotion,
      blendedEmotions: normalizedEmotions,
    });
    
    // Calculate blended expression
    this.expressionValues = this.calculateBlendedExpression(normalizedEmotions);
    
    // Start transition to blended state
    this.transitionFrom = this.expressionValues;
    this.transitionTo = this.expressionValues;
    this.isTransitioning = false;
    this.transitionProgress = 1.0;
  }

  /**
   * Get current emotion
   */
  getCurrentEmotion(): EmotionType {
    return this.currentEmotion;
  }

  /**
   * Get blended emotions
   */
  getBlendedEmotions(): IBlendedEmotion[] {
    return [...this.blendedEmotions];
  }

  /**
   * Get expression state for rendering
   */
  getExpressionState(): IFaceState {
    return {
      ...DEFAULT_FACE_STATE,
      eyeOpenness: this.expressionValues.eyeOpenness,
      pupilDirection: { ...this.expressionValues.pupilDirection },
      mouthOpenness: this.expressionValues.mouthOpenness,
      mouthCurve: this.expressionValues.mouthCurve,
      eyebrowRaise: this.expressionValues.eyebrowRaise,
      cheekRaise: this.expressionValues.cheekRaise,
      faceScale: 1.0,
    };
  }

  /**
   * Check if currently transitioning
   */
  isTransitioning(): boolean {
    return this.isTransitioning;
  }

  /**
   * Register emotion change callback
   */
  onEmotionChange(callback: (event: IEmotionEvent) => void): () => void {
    this.emotionChangeCallbacks.push(callback);
    return () => {
      const index = this.emotionChangeCallbacks.indexOf(callback);
      if (index > -1) this.emotionChangeCallbacks.splice(index, 1);
    };
  }

  /**
   * Update emotion controller
   */
  update(deltaTime: number): void {
    if (!this.isTransitioning) {
      return;
    }
    
    // Update transition progress
    const transitionSpeed = 1 / this.config.transitionDuration;
    this.transitionProgress += deltaTime * transitionSpeed;
    
    if (this.transitionProgress >= 1.0) {
      this.transitionProgress = 1.0;
      this.isTransitioning = false;
      this.expressionValues = { ...this.transitionTo };
      
      // Emit transition end event
      this.emitEmotionEvent({
        type: 'transition_end',
        emotion: this.currentEmotion,
        previousEmotion: this.previousEmotion,
      });
    } else {
      // Interpolate expression values
      this.expressionValues = this.interpolateExpression(
        this.transitionFrom,
        this.transitionTo,
        this.easeOutCubic(this.transitionProgress)
      );
    }
  }

  /**
   * Calculate blended expression from multiple emotions
   */
  private calculateBlendedExpression(emotions: IBlendedEmotion[]): IEmotionExpression {
    const result: IEmotionExpression = {
      emotion: emotions[0].emotion,
      eyeOpenness: 0,
      pupilDirection: { x: 0, y: 0 },
      mouthOpenness: 0,
      mouthCurve: 0,
      eyebrowRaise: 0,
      cheekRaise: 0,
      eyebrowTilt: 0,
      blinkRate: 0,
    };
    
    for (const blended of emotions) {
      const expr = EMOTION_EXPRESSIONS[blended.emotion];
      result.eyeOpenness += expr.eyeOpenness * blended.weight;
      result.pupilDirection.x += expr.pupilDirection.x * blended.weight;
      result.pupilDirection.y += expr.pupilDirection.y * blended.weight;
      result.mouthOpenness += expr.mouthOpenness * blended.weight;
      result.mouthCurve += expr.mouthCurve * blended.weight;
      result.eyebrowRaise += expr.eyebrowRaise * blended.weight;
      result.cheekRaise += expr.cheekRaise * blended.weight;
      result.eyebrowTilt += expr.eyebrowTilt * blended.weight;
      result.blinkRate += expr.blinkRate * blended.weight;
    }
    
    // Clamp values
    result.eyeOpenness = Math.max(0, Math.min(1, result.eyeOpenness));
    result.mouthOpenness = Math.max(0, Math.min(1, result.mouthOpenness));
    result.mouthCurve = Math.max(-1, Math.min(1, result.mouthCurve));
    result.eyebrowRaise = Math.max(-0.5, Math.min(1, result.eyebrowRaise));
    result.cheekRaise = Math.max(0, Math.min(1, result.cheekRaise));
    result.eyebrowTilt = Math.max(-1, Math.min(1, result.eyebrowTilt));
    result.blinkRate = Math.max(0.1, Math.min(3, result.blinkRate));
    
    return result;
  }

  /**
   * Interpolate between two expressions
   */
  private interpolateExpression(
    from: IEmotionExpression,
    to: IEmotionExpression,
    t: number
  ): IEmotionExpression {
    return {
      emotion: to.emotion,
      eyeOpenness: this.lerp(from.eyeOpenness, to.eyeOpenness, t),
      pupilDirection: {
        x: this.lerp(from.pupilDirection.x, to.pupilDirection.x, t),
        y: this.lerp(from.pupilDirection.y, to.pupilDirection.y, t),
      },
      mouthOpenness: this.lerp(from.mouthOpenness, to.mouthOpenness, t),
      mouthCurve: this.lerp(from.mouthCurve, to.mouthCurve, t),
      eyebrowRaise: this.lerp(from.eyebrowRaise, to.eyebrowRaise, t),
      cheekRaise: this.lerp(from.cheekRaise, to.cheekRaise, t),
      eyebrowTilt: this.lerp(from.eyebrowTilt, to.eyebrowTilt, t),
      blinkRate: this.lerp(from.blinkRate, to.blinkRate, t),
    };
  }

  /**
   * Linear interpolation
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Ease out cubic function
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Emit emotion event to callbacks
   */
  private emitEmotionEvent(event: IEmotionEvent): void {
    this.emotionChangeCallbacks.forEach(cb => cb(event));
  }

  /**
   * Get transition state
   */
  getTransitionState(): IEmotionTransition {
    return {
      from: this.previousEmotion,
      to: this.currentEmotion,
      progress: this.transitionProgress,
      isBlending: this.isBlending,
    };
  }
}

export default EmotionController;
