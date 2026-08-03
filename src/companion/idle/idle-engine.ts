/**
 * Idle Behaviour Engine - M02 Companion Engine
 * 
 * Features:
 * - Subtle breathing animation
 * - Occasional look-around
 * - Idle expression variations
 * - Transition to active state
 */

import type { IPosition } from '../../graphics/types';
import type { IFaceGeometry } from '../geometry/geometry';
import { FaceGeometryEngine, DEFAULT_FACE_STATE, type IFaceState } from '../geometry';
import {
  DEFAULT_IDLE_CONFIG,
  IdleState,
  type IIdleConfig,
  type IIdleAnimation,
  type IIdleExpression,
  LOOK_TARGETS,
  IDLE_EXPRESSIONS,
} from './types';

/**
 * Idle Behaviour Engine interface
 */
export interface IIdleEngine {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  update(deltaTime: number): void;
  getIdleState(): IFaceState;
  setActive(active: boolean): void;
  isActive(): boolean;
  forceLookAt(direction: IPosition): void;
  onStateChange(callback: (state: IdleState) => void): () => void;
}

/**
 * Idle Behaviour Engine implementation
 */
export class IdleEngine implements IIdleEngine {
  private readonly geometry: IFaceGeometry;
  private readonly config: IIdleConfig;
  
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private isActive: boolean = false;
  
  // Animation state
  private currentState: IdleState = IdleState.Idle;
  private breathPhase: number = 0;
  private faceScale: number = 1.0;
  private lookDirection: IPosition = { x: 0, y: 0 };
  private targetLookDirection: IPosition = { x: 0, y: 0 };
  private expressionVariation: number = 0;
  private timeInState: number = 0;
  
  // Timing
  private timeSinceLastLookAround: number = 0;
  private nextLookAroundTime: number = 0;
  private timeSinceLastExpressionChange: number = 0;
  private lookHoldTime: number = 0;
  private currentLookTarget: ILookTarget | null = null;
  private currentIdleExpression: IIdleExpression = IDLE_EXPRESSIONS[0];
  
  // Base state (modified by idle animations)
  private baseState: IFaceState;
  
  // Callbacks
  private stateChangeCallbacks: Array<(state: IdleState) => void> = [];

  constructor(
    geometry?: IFaceGeometry,
    baseState?: IFaceState,
    config?: Partial<IIdleConfig>
  ) {
    this.geometry = geometry || new FaceGeometryEngine();
    this.baseState = baseState || { ...DEFAULT_FACE_STATE };
    this.config = { ...DEFAULT_IDLE_CONFIG, ...config };
    this.scheduleNextLookAround();
  }

  /**
   * Start the idle engine
   */
  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.isPaused = false;
      this.breathPhase = 0;
      this.timeSinceLastLookAround = 0;
      this.timeSinceLastExpressionChange = 0;
    }
  }

  /**
   * Stop the idle engine
   */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.resetToDefault();
  }

  /**
   * Pause the idle engine
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume the idle engine
   */
  resume(): void {
    if (this.isRunning) {
      this.isPaused = false;
    }
  }

  /**
   * Update idle animation state
   */
  update(deltaTime: number): void {
    if (!this.isRunning || this.isPaused || this.isActive) {
      return;
    }
    
    this.timeInState += deltaTime;
    
    // Update breathing
    this.updateBreathing(deltaTime);
    
    // Update look around
    this.updateLookAround(deltaTime);
    
    // Update expression changes
    this.updateExpression(deltaTime);
  }

  /**
   * Get the current idle-modified face state
   */
  getIdleState(): IFaceState {
    return {
      ...this.baseState,
      eyeOpenness: this.baseState.eyeOpenness,
      pupilDirection: this.isActive ? this.baseState.pupilDirection : this.lookDirection,
      mouthCurve: this.baseState.mouthCurve + this.currentIdleExpression.mouthCurve,
      eyebrowRaise: this.baseState.eyebrowRaise + this.currentIdleExpression.eyebrowRaise,
      cheekRaise: this.baseState.cheekRaise + this.currentIdleExpression.cheekRaise,
      faceScale: this.faceScale,
    };
  }

  /**
   * Set active state (disables some idle animations)
   */
  setActive(active: boolean): void {
    if (this.isActive !== active) {
      this.isActive = active;
      
      if (active) {
        // Transition to active - return to default
        this.transitionToDefault();
      } else {
        // Resume idle animations
        this.scheduleNextLookAround();
      }
    }
  }

  /**
   * Check if currently in active state
   */
  isActive(): boolean {
    return this.isActive;
  }

  /**
   * Force look at a specific direction
   */
  forceLookAt(direction: IPosition): void {
    const clampedDirection = {
      x: Math.max(-1, Math.min(1, direction.x)),
      y: Math.max(-1, Math.min(1, direction.y)),
    };
    
    this.targetLookDirection = clampedDirection;
    this.lookDirection = clampedDirection;
    this.currentLookTarget = null;
    this.lookHoldTime = 0;
  }

  /**
   * Register state change callback
   */
  onStateChange(callback: (state: IdleState) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    return () => {
      const index = this.stateChangeCallbacks.indexOf(callback);
      if (index > -1) this.stateChangeCallbacks.splice(index, 1);
    };
  }

  /**
   * Set base face state
   */
  setBaseState(state: IFaceState): void {
    this.baseState = { ...state };
  }

  /**
   * Get current idle animation state
   */
  getAnimationState(): IIdleAnimation {
    return {
      state: this.currentState,
      breathPhase: this.breathPhase,
      faceScale: this.faceScale,
      lookDirection: { ...this.lookDirection },
      expressionVariation: this.expressionVariation,
      timeInState: this.timeInState,
    };
  }

  /**
   * Update breathing animation
   */
  private updateBreathing(deltaTime: number): void {
    if (!this.config.breathingEnabled) {
      this.faceScale = 1.0;
      return;
    }
    
    // Update breath phase (cycles between 0 and 2π)
    this.breathPhase += deltaTime * this.config.breathingSpeed * Math.PI * 2;
    if (this.breathPhase > Math.PI * 2) {
      this.breathPhase -= Math.PI * 2;
    }
    
    // Calculate scale using sine wave for smooth breathing
    const breathAmount = Math.sin(this.breathPhase);
    this.faceScale = 1.0 + breathAmount * this.config.breathingIntensity;
    
    // Update state if needed
    if (this.currentState !== IdleState.Breathing) {
      this.setState(IdleState.Breathing);
    }
  }

  /**
   * Update look around animation
   */
  private updateLookAround(deltaTime: number): void {
    if (!this.config.lookAroundEnabled) {
      return;
    }
    
    // Check if it's time for a look around
    if (this.currentLookTarget === null && this.timeSinceLastLookAround >= this.nextLookAroundTime) {
      // Pick a random look target (prefer not to pick center consecutively)
      let targetIndex: number;
      if (this.currentLookTarget?.direction.x === 0 && this.currentLookTarget?.direction.y === 0) {
        targetIndex = Math.floor(Math.random() * (LOOK_TARGETS.length - 1)) + 1;
      } else {
        targetIndex = Math.floor(Math.random() * LOOK_TARGETS.length);
      }
      this.currentLookTarget = LOOK_TARGETS[targetIndex];
      this.targetLookDirection = this.currentLookTarget.direction;
      this.lookHoldTime = 0;
      this.setState(IdleState.LookingAround);
    }
    
    // Animate towards target
    if (this.currentLookTarget !== null) {
      const dx = this.targetLookDirection.x - this.lookDirection.x;
      const dy = this.targetLookDirection.y - this.lookDirection.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0.01) {
        const moveAmount = this.config.lookAroundSpeed * deltaTime;
        const factor = Math.min(moveAmount / distance, 1);
        this.lookDirection = {
          x: this.lookDirection.x + dx * factor,
          y: this.lookDirection.y + dy * factor,
        };
      } else {
        // At target, count hold time
        this.lookHoldTime += deltaTime;
        
        if (this.lookHoldTime >= this.currentLookTarget.holdDuration) {
          // Start returning to center
          this.currentLookTarget = null;
          this.targetLookDirection = { x: 0, y: 0 };
          this.setState(IdleState.ReturningToCenter);
        }
      }
    } else {
      // Return to center
      const dx = this.targetLookDirection.x - this.lookDirection.x;
      const dy = this.targetLookDirection.y - this.lookDirection.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0.01) {
        const moveAmount = this.config.returnToCenterSpeed * deltaTime;
        const factor = Math.min(moveAmount / distance, 1);
        this.lookDirection = {
          x: this.lookDirection.x + dx * factor,
          y: this.lookDirection.y + dy * factor,
        };
      } else {
        this.lookDirection = { x: 0, y: 0 };
        this.timeSinceLastLookAround = 0;
        this.scheduleNextLookAround();
        this.setState(IdleState.Breathing);
      }
    }
    
    this.timeSinceLastLookAround += deltaTime;
  }

  /**
   * Update expression changes
   */
  private updateExpression(deltaTime: number): void {
    if (!this.config.idleExpressionEnabled) {
      return;
    }
    
    this.timeSinceLastExpressionChange += deltaTime;
    
    if (this.timeSinceLastExpressionChange >= this.config.idleExpressionInterval) {
      // Pick a new expression
      const newIndex = Math.floor(Math.random() * IDLE_EXPRESSIONS.length);
      this.currentIdleExpression = IDLE_EXPRESSIONS[newIndex];
      this.expressionVariation = Math.random();
      this.timeSinceLastExpressionChange = 0;
      this.setState(IdleState.ExpressionChange);
      
      // Return to breathing state after brief expression change
      setTimeout(() => {
        if (this.currentState === IdleState.ExpressionChange) {
          this.setState(IdleState.Breathing);
        }
      }, 500);
    }
  }

  /**
   * Schedule the next look around
   */
  private scheduleNextLookAround(): void {
    const interval = this.config.lookAroundIntervalMin +
      Math.random() * (this.config.lookAroundIntervalMax - this.config.lookAroundIntervalMin);
    this.nextLookAroundTime = interval;
    this.timeSinceLastLookAround = 0;
  }

  /**
   * Transition to default state
   */
  private transitionToDefault(): void {
    this.lookDirection = { x: 0, y: 0 };
    this.targetLookDirection = { x: 0, y: 0 };
    this.currentLookTarget = null;
    this.faceScale = 1.0;
    this.currentIdleExpression = IDLE_EXPRESSIONS[0];
  }

  /**
   * Reset to default values
   */
  private resetToDefault(): void {
    this.breathPhase = 0;
    this.faceScale = 1.0;
    this.lookDirection = { x: 0, y: 0 };
    this.targetLookDirection = { x: 0, y: 0 };
    this.expressionVariation = 0;
    this.timeInState = 0;
    this.currentLookTarget = null;
    this.lookHoldTime = 0;
    this.currentIdleExpression = IDLE_EXPRESSIONS[0];
    this.setState(IdleState.Idle);
  }

  /**
   * Set current state and notify callbacks
   */
  private setState(newState: IdleState): void {
    if (this.currentState !== newState) {
      this.currentState = newState;
      this.timeInState = 0;
      this.stateChangeCallbacks.forEach(cb => cb(newState));
    }
  }
}

export default IdleEngine;
