/**
 * Transition Timeline Types
 */

import type { IFaceState } from '../../companion/geometry/types';
import type { GeneratedScene } from '../../story-viz/scene-generator/types';
import type { TransitionMode, TransitionPhase, TransitionLifecycleHooks } from '../types';

/**
 * Timeline keyframe for transitions
 */
export interface TimelineKeyframe {
  time: number;           // Time in milliseconds
  phase: TransitionPhase;
  progress: number;       // 0-1 progress within this keyframe
  action: 'capture' | 'dissolve' | 'merge' | 'fade';
}

/**
 * Timeline segment
 */
export interface TimelineSegment {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  phase: TransitionPhase;
  duration: number;
}

/**
 * Transition timeline configuration
 */
export interface TimelineConfig {
  captureDuration: number;
  dissolveDuration: number;
  mergeDuration: number;
  fadeDuration: number;
  totalDuration: number;
  syncWithAnimations: boolean;
  enableInterruption: boolean;
  hooks: TransitionLifecycleHooks;
}

/**
 * Default timeline configuration
 */
export const DEFAULT_TIMELINE_CONFIG: Readonly<TimelineConfig> = {
  captureDuration: 100,
  dissolveDuration: 500,
  mergeDuration: 500,
  fadeDuration: 200,
  totalDuration: 1300,
  syncWithAnimations: true,
  enableInterruption: true,
  hooks: {},
};

/**
 * Timeline state
 */
export interface TimelineState {
  isPlaying: boolean;
  isPaused: boolean;
  isComplete: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  phase: TransitionPhase;
}

/**
 * Timeline callback
 */
export type TimelineCallback = (state: TimelineState) => void;

/**
 * Timeline event types
 */
export type TimelineEventType = 
  | 'play'
  | 'pause'
  | 'stop'
  | 'seek'
  | 'progress'
  | 'phaseChange'
  | 'complete'
  | 'interrupt';

/**
 * Timeline event data
 */
export interface TimelineEvent {
  type: TimelineEventType;
  timestamp: number;
  currentTime: number;
  phase: TransitionPhase;
  data?: unknown;
}

/**
 * Transition request
 */
export interface TransitionRequest {
  mode: TransitionMode;
  targetFace?: IFaceState;
  targetScene?: GeneratedScene;
  config?: Partial<TimelineConfig>;
  priority?: number;
}

/**
 * Timeline animation sync data
 */
export interface AnimationSyncData {
  startTime: number;
  duration: number;
  keyframes: TimelineKeyframe[];
  easing: (t: number) => number;
}

/**
 * Scheduled hook
 */
export interface ScheduledHook {
  name: string;
  time: number;
  handler: () => void | Promise<void>;
  executed: boolean;
}
