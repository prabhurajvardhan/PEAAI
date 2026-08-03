/**
 * Face State Machine Types - M02 Companion Engine
 * 
 * Type definitions for the face state machine.
 */

import type { IPosition } from '../../graphics/types';
import type { EmotionType, IFaceState } from '../geometry/types';

/**
 * Face states
 */
export enum FaceState {
  Idle = 'idle',
  Active = 'active',
  Listening = 'listening',
  Thinking = 'thinking',
  Speaking = 'speaking',
  Surprised = 'surprised',
  Happy = 'happy',
  Sad = 'sad',
  Angry = 'angry',
  Sleepy = 'sleepy',
  Sleeping = 'sleeping',
}

/**
 * State transition definition
 */
export interface IStateTransition {
  from: FaceState;
  to: FaceState;
  condition?: (context: IFaceStateContext) => boolean;
  duration?: number;
}

/**
 * Context passed to transition conditions
 */
export interface IFaceStateContext {
  currentEmotion: EmotionType;
  isSpeaking: boolean;
  isListening: boolean;
  hasNewMessage: boolean;
  timeSinceLastActivity: number;
  timeSinceLastBlink: number;
  idleDuration: number;
  userInput?: string;
}

/**
 * State history entry
 */
export interface IStateHistoryEntry {
  state: FaceState;
  timestamp: number;
  duration: number;
  emotion: EmotionType;
}

/**
 * Face state machine configuration
 */
export interface IFaceStateMachineConfig {
  idleTimeout: number;             // Seconds before going to idle
  sleepingTimeout: number;         // Seconds of idle before sleeping
  maxHistorySize: number;          // Maximum number of history entries
  allowAnyTransition: boolean;    // Allow any transition or only defined ones
}

/**
 * Default face state machine configuration
 */
export const DEFAULT_STATE_MACHINE_CONFIG: Readonly<IFaceStateMachineConfig> = {
  idleTimeout: 5.0,               // 5 seconds of inactivity
  sleepingTimeout: 60.0,           // 60 seconds of idle before sleeping
  maxHistorySize: 50,              // Keep last 50 state changes
  allowAnyTransition: true,        // Allow any transition for flexibility
};

/**
 * State change event
 */
export interface IStateChangeEvent {
  previousState: FaceState;
  currentState: FaceState;
  timestamp: number;
  context: IFaceStateContext;
}

/**
 * State enter/exit event
 */
export interface IStateLifecycleEvent {
  state: FaceState;
  type: 'enter' | 'exit';
  timestamp: number;
}

/**
 * State machine events
 */
export interface IFaceStateMachineEvents {
  onStateChange: (event: IStateChangeEvent) => void;
  onStateEnter: (event: IStateLifecycleEvent) => void;
  onStateExit: (event: IStateLifecycleEvent) => void;
  onTransitionBlocked: (from: FaceState, to: FaceState) => void;
}

/**
 * Valid state transitions map
 */
export const VALID_TRANSITIONS: Record<FaceState, FaceState[]> = {
  [FaceState.Idle]: [
    FaceState.Active,
    FaceState.Listening,
    FaceState.Thinking,
    FaceState.Happy,
    FaceState.Surprised,
  ],
  [FaceState.Active]: [
    FaceState.Idle,
    FaceState.Listening,
    FaceState.Thinking,
    FaceState.Speaking,
    FaceState.Happy,
    FaceState.Surprised,
  ],
  [FaceState.Listening]: [
    FaceState.Active,
    FaceState.Thinking,
    FaceState.Speaking,
    FaceState.Surprised,
    FaceState.Happy,
    FaceState.Sad,
    FaceState.Angry,
  ],
  [FaceState.Thinking]: [
    FaceState.Active,
    FaceState.Speaking,
    FaceState.Surprised,
    FaceState.Happy,
  ],
  [FaceState.Speaking]: [
    FaceState.Active,
    FaceState.Thinking,
    FaceState.Listening,
    FaceState.Happy,
  ],
  [FaceState.Surprised]: [
    FaceState.Active,
    FaceState.Idle,
    FaceState.Happy,
    FaceState.Sad,
    FaceState.Thinking,
  ],
  [FaceState.Happy]: [
    FaceState.Active,
    FaceState.Idle,
    FaceState.Speaking,
    FaceState.Listening,
  ],
  [FaceState.Sad]: [
    FaceState.Active,
    FaceState.Idle,
    FaceState.Listening,
  ],
  [FaceState.Angry]: [
    FaceState.Active,
    FaceState.Idle,
    FaceState.Listening,
  ],
  [FaceState.Sleepy]: [
    FaceState.Idle,
    FaceState.Sleeping,
    FaceState.Active,
  ],
  [FaceState.Sleeping]: [
    FaceState.Idle,
    FaceState.Sleepy,
    FaceState.Active,
  ],
};

/**
 * State to emotion mapping
 */
export const STATE_EMOTION_MAP: Record<FaceState, EmotionType> = {
  [FaceState.Idle]: 'neutral',
  [FaceState.Active]: 'neutral',
  [FaceState.Listening]: 'neutral',
  [FaceState.Thinking]: 'thinking',
  [FaceState.Speaking]: 'excited',
  [FaceState.Surprised]: 'surprised',
  [FaceState.Happy]: 'happy',
  [FaceState.Sad]: 'sad',
  [FaceState.Angry]: 'angry',
  [FaceState.Sleepy]: 'sleepy',
  [FaceState.Sleeping]: 'sleepy',
};
