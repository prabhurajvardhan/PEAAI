/**
 * Eye Engine - M02 Companion Engine
 * 
 * Features:
 * - Eye sprite rendering
 * - Pupil movement and tracking
 * - Eye state management (open, closed, squinting, etc.)
 * - Emotion-reactive expressions
 */

import type { IPosition } from '../../graphics/types';
import type { IFaceGeometry } from '../geometry/geometry';
import {
  FaceGeometryEngine,
  EyeState,
  PupilDirection,
  type IFaceState,
} from '../geometry';
import {
  DEFAULT_EYE_CONFIG,
  type IEyeConfig,
  type IEyeRenderData,
  type IEyeAnimationState,
  type ILookingDirection,
} from './types';

/**
 * Eye Engine interface
 */
export interface IEyeEngine {
  start(): void;
  stop(): void;
  setLookDirection(direction: IPosition): void;
  lookAt(direction: IPosition, duration?: number): Promise<void>;
  setEyeState(state: EyeState): void;
  getCurrentState(): EyeState;
  getEyeRenderData(state: IFaceState): IEyeRenderData;
  update(deltaTime: number): void;
  isBlinking(): boolean;
  getPupilPosition(state: IFaceState): { left: IPosition; right: IPosition };
}

/**
 * Eye Engine implementation
 */
export class EyeEngine implements IEyeEngine {
  private readonly geometry: IFaceGeometry;
  private readonly config: IEyeConfig;
  
  private isRunning: boolean = false;
  private currentState: EyeState = EyeState.Open;
  private targetState: EyeState = EyeState.Open;
  private transitionProgress: number = 1.0;
  private blinkProgress: number = 0;
  private isBlinkingFlag: boolean = false;
  
  private lookingDirection: ILookingDirection = {
    direction: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
    isAnimating: false,
  };
  
  private lookAnimationSpeed: number = 3.0; // Units per second
  
  // Callbacks
  private onBlinkStartCallbacks: Array<() => void> = [];
  private onBlinkCompleteCallbacks: Array<() => void> = [];
  private onLookAtCallbacks: Array<(direction: IPosition) => void> = [];
  private onStateChangeCallbacks: Array<(state: EyeState) => void> = [];

  constructor(geometry?: IFaceGeometry, config?: Partial<IEyeConfig>) {
    this.geometry = geometry || new FaceGeometryEngine();
    this.config = { ...DEFAULT_EYE_CONFIG, ...config };
  }

  /**
   * Start the eye engine
   */
  start(): void {
    this.isRunning = true;
  }

  /**
   * Stop the eye engine
   */
  stop(): void {
    this.isRunning = false;
    this.lookingDirection.isAnimating = false;
    this.blinkProgress = 0;
    this.isBlinkingFlag = false;
  }

  /**
   * Set the look direction immediately
   */
  setLookDirection(direction: IPosition): void {
    const clampedDirection = {
      x: Math.max(-1, Math.min(1, direction.x)),
      y: Math.max(-1, Math.min(1, direction.y)),
    };
    
    this.lookingDirection.direction = clampedDirection;
    this.lookingDirection.target = clampedDirection;
    this.lookingDirection.isAnimating = false;
  }

  /**
   * Animate looking towards a direction
   */
  async lookAt(direction: IPosition, duration: number = 500): Promise<void> {
    const clampedDirection = {
      x: Math.max(-1, Math.min(1, direction.x)),
      y: Math.max(-1, Math.min(1, direction.y)),
    };
    
    this.lookingDirection.target = clampedDirection;
    this.lookingDirection.isAnimating = true;
    
    // Notify listeners
    this.onLookAtCallbacks.forEach(cb => cb(clampedDirection));
    
    // Animation will be handled in update()
    return new Promise(resolve => {
      setTimeout(() => {
        this.lookingDirection.direction = clampedDirection;
        this.lookingDirection.isAnimating = false;
        resolve();
      }, duration);
    });
  }

  /**
   * Set eye state
   */
  setEyeState(state: EyeState): void {
    if (this.currentState !== state) {
      this.targetState = state;
      this.currentState = state;
      this.transitionProgress = 1.0;
      
      // Notify listeners
      this.onStateChangeCallbacks.forEach(cb => cb(state));
    }
  }

  /**
   * Get current eye state
   */
  getCurrentState(): EyeState {
    return this.currentState;
  }

  /**
   * Get eye render data for the current state
   */
  getEyeRenderData(state: IFaceState): IEyeRenderData {
    const eyeBounds = this.geometry.getEyeBounds(state);
    const pupilPositions = this.getPupilPosition(state);
    
    return {
      eyeLeft: {
        bounds: eyeBounds.left,
        pupil: pupilPositions.left,
        iris: pupilPositions.left,
        openness: state.eyeOpenness,
      },
      eyeRight: {
        bounds: eyeBounds.right,
        pupil: pupilPositions.right,
        iris: pupilPositions.right,
        openness: state.eyeOpenness,
      },
    };
  }

  /**
   * Update eye animation state
   */
  update(deltaTime: number): void {
    // Handle look direction animation
    if (this.lookingDirection.isAnimating) {
      const dx = this.lookingDirection.target.x - this.lookingDirection.direction.x;
      const dy = this.lookingDirection.target.y - this.lookingDirection.direction.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 0.01) {
        this.lookingDirection.direction = this.lookingDirection.target;
        this.lookingDirection.isAnimating = false;
      } else {
        const moveAmount = this.lookAnimationSpeed * deltaTime;
        const factor = Math.min(moveAmount / distance, 1);
        this.lookingDirection.direction = {
          x: this.lookingDirection.direction.x + dx * factor,
          y: this.lookingDirection.direction.y + dy * factor,
        };
      }
    }
    
    // Handle state transitions
    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(1.0, this.transitionProgress + deltaTime * 5);
    }
    
    // Handle blink animation
    if (this.isBlinkingFlag && this.blinkProgress < 1.0) {
      this.blinkProgress = Math.min(1.0, this.blinkProgress + deltaTime * 10);
      if (this.blinkProgress >= 1.0) {
        this.isBlinkingFlag = false;
        this.onBlinkCompleteCallbacks.forEach(cb => cb());
      }
    }
  }

  /**
   * Check if currently blinking
   */
  isBlinking(): boolean {
    return this.blinkProgress > 0 && this.blinkProgress < 1.0;
  }

  /**
   * Get pupil positions based on look direction and face state
   */
  getPupilPosition(state: IFaceState): { left: IPosition; right: IPosition } {
    // Combine look direction with state
    const combinedDirection = {
      x: (this.lookingDirection.direction.x + state.pupilDirection.x) / 2,
      y: (this.lookingDirection.direction.y + state.pupilDirection.y) / 2,
    };
    
    return this.geometry.calculatePupilPosition(combinedDirection, state);
  }

  /**
   * Start a blink animation
   */
  startBlink(): void {
    if (!this.isBlinkingFlag) {
      this.isBlinkingFlag = true;
      this.blinkProgress = 0;
      this.onBlinkStartCallbacks.forEach(cb => cb());
    }
  }

  /**
   * Register blink start callback
   */
  onBlinkStart(callback: () => void): () => void {
    this.onBlinkStartCallbacks.push(callback);
    return () => {
      const index = this.onBlinkStartCallbacks.indexOf(callback);
      if (index > -1) this.onBlinkStartCallbacks.splice(index, 1);
    };
  }

  /**
   * Register blink complete callback
   */
  onBlinkComplete(callback: () => void): () => void {
    this.onBlinkCompleteCallbacks.push(callback);
    return () => {
      const index = this.onBlinkCompleteCallbacks.indexOf(callback);
      if (index > -1) this.onBlinkCompleteCallbacks.splice(index, 1);
    };
  }

  /**
   * Register look at callback
   */
  onLookAt(callback: (direction: IPosition) => void): () => void {
    this.onLookAtCallbacks.push(callback);
    return () => {
      const index = this.onLookAtCallbacks.indexOf(callback);
      if (index > -1) this.onLookAtCallbacks.splice(index, 1);
    };
  }

  /**
   * Register state change callback
   */
  onStateChange(callback: (state: EyeState) => void): () => void {
    this.onStateChangeCallbacks.push(callback);
    return () => {
      const index = this.onStateChangeCallbacks.indexOf(callback);
      if (index > -1) this.onStateChangeCallbacks.splice(index, 1);
    };
  }

  /**
   * Get eye animation state
   */
  getAnimationState(): IEyeAnimationState {
    return {
      currentState: this.currentState,
      targetState: this.targetState,
      transitionProgress: this.transitionProgress,
      pupilDirection: this.lookingDirection.direction,
      blinkProgress: this.blinkProgress,
    };
  }

  /**
   * Get current look direction
   */
  getLookDirection(): IPosition {
    return { ...this.lookingDirection.direction };
  }

  /**
   * Convert PupilDirection enum to IPosition
   */
  static directionToPosition(direction: PupilDirection): IPosition {
    switch (direction) {
      case PupilDirection.Center:
        return { x: 0, y: 0 };
      case PupilDirection.Up:
        return { x: 0, y: -1 };
      case PupilDirection.Down:
        return { x: 0, y: 1 };
      case PupilDirection.Left:
        return { x: -1, y: 0 };
      case PupilDirection.Right:
        return { x: 1, y: 0 };
      case PupilDirection.UpLeft:
        return { x: -0.707, y: -0.707 };
      case PupilDirection.UpRight:
        return { x: 0.707, y: -0.707 };
      case PupilDirection.DownLeft:
        return { x: -0.707, y: 0.707 };
      case PupilDirection.DownRight:
        return { x: 0.707, y: 0.707 };
      default:
        return { x: 0, y: 0 };
    }
  }
}

export default EyeEngine;
