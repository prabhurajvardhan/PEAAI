/**
 * Face State Machine - M02 Companion Engine
 * 
 * Features:
 * - State definitions
 * - Valid transitions
 * - State history
 * - Event emission
 */

import type { IPosition } from '../../graphics/types';
import type { IFaceGeometry } from '../geometry/geometry';
import type { IEmotionController } from '../emotion/emotion-controller';
import {
  FaceGeometryEngine,
  type EmotionType,
  type IFaceState,
} from '../geometry';
import {
  DEFAULT_STATE_MACHINE_CONFIG,
  FaceState,
  type IFaceStateMachineConfig,
  type IStateHistoryEntry,
  type IFaceStateContext,
  type IStateChangeEvent,
  type IStateLifecycleEvent,
  VALID_TRANSITIONS,
  STATE_EMOTION_MAP,
} from './types';

/**
 * Face State Machine interface
 */
export interface IFaceStateMachine {
  start(): void;
  stop(): void;
  update(deltaTime: number): void;
  
  // State management
  getCurrentState(): FaceState;
  canTransitionTo(state: FaceState): boolean;
  transitionTo(state: FaceState): boolean;
  
  // Context
  setContext(context: Partial<IFaceStateContext>): void;
  getContext(): IFaceStateContext;
  
  // History
  getHistory(): IStateHistoryEntry[];
  getLastState(): FaceState | null;
  
  // Events
  onStateChange(callback: (event: IStateChangeEvent) => void): () => void;
  onStateEnter(callback: (event: IStateLifecycleEvent) => void): () => void;
  onStateExit(callback: (event: IStateLifecycleEvent) => void): () => void;
  
  // Activity triggers
  triggerActivity(): void;
  triggerSpeaking(): void;
  triggerListening(): void;
  triggerThinking(): void;
}

/**
 * Face State Machine implementation
 */
export class FaceStateMachine implements IFaceStateMachine {
  private readonly geometry: IFaceGeometry;
  private readonly emotionController?: IEmotionController;
  private readonly config: IFaceStateMachineConfig;
  
  private isRunning: boolean = false;
  
  // State
  private currentState: FaceState = FaceState.Idle;
  private previousState: FaceState = FaceState.Idle;
  
  // Context
  private context: IFaceStateContext;
  
  // History
  private stateHistory: IStateHistoryEntry[] = [];
  private lastStateTimestamp: number = 0;
  
  // Timers
  private stateTimer: number = 0;
  private idleTimer: number = 0;
  private activityTimer: number = 0;
  
  // Callbacks
  private stateChangeCallbacks: Array<(event: IStateChangeEvent) => void> = [];
  private stateEnterCallbacks: Array<(event: IStateLifecycleEvent) => void> = [];
  private stateExitCallbacks: Array<(event: IStateLifecycleEvent) => void> = [];

  constructor(
    geometry?: IFaceGeometry,
    emotionController?: IEmotionController,
    config?: Partial<IFaceStateMachineConfig>
  ) {
    this.geometry = geometry || new FaceGeometryEngine();
    this.emotionController = emotionController;
    this.config = { ...DEFAULT_STATE_MACHINE_CONFIG, ...config };
    
    this.context = {
      currentEmotion: 'neutral',
      isSpeaking: false,
      isListening: false,
      hasNewMessage: false,
      timeSinceLastActivity: 0,
      timeSinceLastBlink: 0,
      idleDuration: 0,
    };
    
    this.lastStateTimestamp = Date.now();
  }

  /**
   * Start the state machine
   */
  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastStateTimestamp = Date.now();
      this.emitStateEnter(this.currentState);
    }
  }

  /**
   * Stop the state machine
   */
  stop(): void {
    if (this.isRunning) {
      this.isRunning = false;
      this.emitStateExit(this.currentState);
    }
  }

  /**
   * Update the state machine
   */
  update(deltaTime: number): void {
    if (!this.isRunning) {
      return;
    }
    
    // Update timers
    this.stateTimer += deltaTime;
    this.idleTimer += deltaTime;
    this.activityTimer += deltaTime;
    this.context.timeSinceLastActivity = this.activityTimer;
    this.context.idleDuration = this.idleTimer;
    
    // Check for automatic transitions based on state
    this.checkAutomaticTransitions();
    
    // Update emotion based on state
    if (this.emotionController) {
      const targetEmotion = STATE_EMOTION_MAP[this.currentState];
      if (this.context.currentEmotion !== targetEmotion) {
        this.context.currentEmotion = targetEmotion;
        this.emotionController.setEmotionImmediate(targetEmotion);
      }
    }
  }

  /**
   * Get current state
   */
  getCurrentState(): FaceState {
    return this.currentState;
  }

  /**
   * Check if transition is valid
   */
  canTransitionTo(state: FaceState): boolean {
    if (this.currentState === state) {
      return false;
    }
    
    if (this.config.allowAnyTransition) {
      return true;
    }
    
    const validTargets = VALID_TRANSITIONS[this.currentState];
    return validTargets !== undefined && validTargets.includes(state);
  }

  /**
   * Transition to a new state
   */
  transitionTo(state: FaceState): boolean {
    if (!this.canTransitionTo(state)) {
      this.emitTransitionBlocked(this.currentState, state);
      return false;
    }
    
    const previousState = this.currentState;
    const timestamp = Date.now();
    
    // Record history entry
    this.recordHistoryEntry(previousState, timestamp);
    
    // Exit current state
    this.emitStateExit(previousState);
    
    // Update state
    this.previousState = previousState;
    this.currentState = state;
    this.stateTimer = 0;
    this.lastStateTimestamp = timestamp;
    
    // Enter new state
    this.emitStateEnter(state);
    
    // Emit state change event
    const event: IStateChangeEvent = {
      previousState,
      currentState: state,
      timestamp,
      context: { ...this.context },
    };
    this.stateChangeCallbacks.forEach(cb => cb(event));
    
    return true;
  }

  /**
   * Update context
   */
  setContext(context: Partial<IFaceStateContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Get current context
   */
  getContext(): IFaceStateContext {
    return { ...this.context };
  }

  /**
   * Get state history
   */
  getHistory(): IStateHistoryEntry[] {
    return [...this.stateHistory];
  }

  /**
   * Get last state
   */
  getLastState(): FaceState | null {
    if (this.stateHistory.length === 0) {
      return null;
    }
    return this.stateHistory[this.stateHistory.length - 1].state;
  }

  /**
   * Register state change callback
   */
  onStateChange(callback: (event: IStateChangeEvent) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    return () => {
      const index = this.stateChangeCallbacks.indexOf(callback);
      if (index > -1) this.stateChangeCallbacks.splice(index, 1);
    };
  }

  /**
   * Register state enter callback
   */
  onStateEnter(callback: (event: IStateLifecycleEvent) => void): () => void {
    this.stateEnterCallbacks.push(callback);
    return () => {
      const index = this.stateEnterCallbacks.indexOf(callback);
      if (index > -1) this.stateEnterCallbacks.splice(index, 1);
    };
  }

  /**
   * Register state exit callback
   */
  onStateExit(callback: (event: IStateLifecycleEvent) => void): () => void {
    this.stateExitCallbacks.push(callback);
    return () => {
      const index = this.stateExitCallbacks.indexOf(callback);
      if (index > -1) this.stateExitCallbacks.splice(index, 1);
    };
  }

  /**
   * Trigger activity (resets idle timer)
   */
  triggerActivity(): void {
    this.activityTimer = 0;
    this.idleTimer = 0;
    this.context.hasNewMessage = false;
    
    // Wake up from sleepy/sleeping states
    if (this.currentState === FaceState.Sleepy || this.currentState === FaceState.Sleeping) {
      this.transitionTo(FaceState.Active);
    }
  }

  /**
   * Trigger speaking state
   */
  triggerSpeaking(): void {
    this.triggerActivity();
    if (this.currentState !== FaceState.Speaking) {
      this.transitionTo(FaceState.Speaking);
    }
  }

  /**
   * Trigger listening state
   */
  triggerListening(): void {
    this.triggerActivity();
    if (this.currentState !== FaceState.Listening) {
      this.transitionTo(FaceState.Listening);
    }
  }

  /**
   * Trigger thinking state
   */
  triggerThinking(): void {
    this.triggerActivity();
    if (this.currentState !== FaceState.Thinking) {
      this.transitionTo(FaceState.Thinking);
    }
  }

  /**
   * Check for automatic state transitions
   */
  private checkAutomaticTransitions(): void {
    switch (this.currentState) {
      case FaceState.Speaking:
        // After speaking, return to active or listening
        if (this.context.isListening) {
          this.transitionTo(FaceState.Listening);
        } else if (!this.context.isSpeaking && this.stateTimer > 1.0) {
          this.transitionTo(FaceState.Active);
        }
        break;
        
      case FaceState.Thinking:
        // Thinking timeout
        if (this.stateTimer > 10.0) {
          this.transitionTo(FaceState.Idle);
        }
        break;
        
      case FaceState.Surprised:
        // Surprise is brief
        if (this.stateTimer > 2.0) {
          this.transitionTo(FaceState.Active);
        }
        break;
        
      case FaceState.Sleepy:
        // Sleepy timeout -> sleeping
        if (this.idleTimer > this.config.sleepingTimeout) {
          this.transitionTo(FaceState.Sleeping);
        }
        break;
        
      case FaceState.Sleeping:
        // Wake on activity
        if (this.activityTimer < 0.1) {
          this.transitionTo(FaceState.Idle);
        }
        break;
        
      case FaceState.Idle:
      case FaceState.Active:
        // Idle timeout
        if (this.idleTimer > this.config.idleTimeout && this.currentState === FaceState.Idle) {
          this.transitionTo(FaceState.Sleepy);
        }
        break;
    }
  }

  /**
   * Record history entry
   */
  private recordHistoryEntry(state: FaceState, timestamp: number): void {
    const entry: IStateHistoryEntry = {
      state,
      timestamp,
      duration: timestamp - this.lastStateTimestamp,
      emotion: STATE_EMOTION_MAP[state],
    };
    
    this.stateHistory.push(entry);
    
    // Trim history if needed
    if (this.stateHistory.length > this.config.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  /**
   * Emit state enter event
   */
  private emitStateEnter(state: FaceState): void {
    const event: IStateLifecycleEvent = {
      state,
      type: 'enter',
      timestamp: Date.now(),
    };
    this.stateEnterCallbacks.forEach(cb => cb(event));
  }

  /**
   * Emit state exit event
   */
  private emitStateExit(state: FaceState): void {
    const event: IStateLifecycleEvent = {
      state,
      type: 'exit',
      timestamp: Date.now(),
    };
    this.stateExitCallbacks.forEach(cb => cb(event));
  }

  /**
   * Emit transition blocked event
   */
  private emitTransitionBlocked(from: FaceState, to: FaceState): void {
    // Could emit to a specific callback if needed
  }
}

export default FaceStateMachine;
