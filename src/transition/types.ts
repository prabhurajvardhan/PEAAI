/**
 * Transition Engine Types (M06)
 * 
 * Shared type definitions for the transition engine.
 */

import type { IColor, IPosition } from '../graphics/types';
import type { IFaceState } from '../companion/geometry/types';
import type { GeneratedScene } from '../story-viz/scene-generator/types';

// Re-export easing function type from animation module
export type EasingFunction = (t: number) => number;

/**
 * Transition mode types
 */
export type TransitionMode = 'face-to-story' | 'story-to-face';

/**
 * Transition phase
 */
export type TransitionPhase = 'idle' | 'capturing' | 'dissolving' | 'merging' | 'complete' | 'cancelled';

/**
 * Transition state
 */
export type TransitionState = 'idle' | 'preparing' | 'transitioning' | 'complete' | 'cancelled';

/**
 * Dissolve pattern types
 */
export type DissolvePattern = 'grid' | 'particle' | 'noise' | 'radial' | 'spiral' | 'wave' | 'custom';

/**
 * Morph preset types
 */
export type MorphPreset = 'none' | 'warp' | 'ripple' | 'twist' | 'bulge' | 'implode' | 'explode';

/**
 * Transition timing configuration
 */
export interface TransitionTiming {
  captureDuration: number;      // Time to capture current state
  dissolveDuration: number;      // Time for dissolve effect
  mergeDuration: number;        // Time for merge effect
  totalDuration: number;        // Total transition time
}

/**
 * Transition configuration
 */
export interface TransitionConfig {
  timing: TransitionTiming;
  dissolvePattern: DissolvePattern;
  morphPreset: MorphPreset;
  easing: EasingFunction;
  enableMorphing: boolean;
  enableDissolve: boolean;
  gridSize: number;
  particleCount: number;
}

/**
 * Default transition timing (in milliseconds)
 */
export const DEFAULT_TRANSITION_TIMING: Readonly<TransitionTiming> = {
  captureDuration: 100,
  dissolveDuration: 500,
  mergeDuration: 500,
  totalDuration: 1100,
};

/**
 * Default transition configuration
 */
export const DEFAULT_TRANSITION_CONFIG: Readonly<TransitionConfig> = {
  timing: DEFAULT_TRANSITION_TIMING,
  dissolvePattern: 'grid',
  morphPreset: 'none',
  easing: (t) => t,
  enableMorphing: true,
  enableDissolve: true,
  gridSize: 32,
  particleCount: 100,
};

/**
 * Pixel morph target
 */
export interface MorphTarget {
  x: number;
  y: number;
  dx: number;  // Displacement X
  dy: number;  // Displacement Y
  alpha: number;
}

/**
 * Dissolve particle
 */
export interface DissolveParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  active: boolean;
}

/**
 * Grid dissolve cell
 */
export interface DissolveCell {
  x: number;
  y: number;
  size: number;
  progress: number;      // 0-1, dissolution progress
  alpha: number;         // Current alpha value
  velocity: IPosition;  // Velocity for animation
  active: boolean;
}

/**
 * Noise dissolve configuration
 */
export interface NoiseDissolveConfig {
  scale: number;
  octaves: number;
  persistence: number;
  seed: number;
  threshold: number;
  animated: boolean;
}

/**
 * Transition event types
 */
export type TransitionEventType = 
  | 'start'
  | 'capture'
  | 'dissolveStart'
  | 'dissolveProgress'
  | 'dissolveComplete'
  | 'mergeStart'
  | 'mergeProgress'
  | 'mergeComplete'
  | 'complete'
  | 'cancel'
  | 'interrupt'
  | 'progress';

/**
 * Transition event data
 */
export interface TransitionEvent {
  type: TransitionEventType;
  timestamp: number;
  progress: number;
  phase: TransitionPhase;
  data?: unknown;
}

/**
 * Transition hooks
 */
export interface TransitionHooks {
  onStart?: () => void;
  onCapture?: (buffer: ImageData) => void;
  onDissolveProgress?: (progress: number) => void;
  onMergeProgress?: (progress: number) => void;
  onComplete?: () => void;
  onCancel?: () => void;
  onInterrupt?: () => void;
}

/**
 * Transition progress callback
 */
export type TransitionProgressCallback = (progress: number, phase: TransitionPhase) => void;

/**
 * Pre/post transition hooks
 */
export interface TransitionLifecycleHooks {
  preFace?: () => void | Promise<void>;
  postFace?: () => void | Promise<void>;
  preStory?: () => void | Promise<void>;
  postStory?: () => void | Promise<void>;
}

/**
 * Face capture data
 */
export interface FaceCaptureData {
  buffer: ImageData | null;
  state: IFaceState | null;
  timestamp: number;
}

/**
 * Scene capture data
 */
export interface SceneCaptureData {
  buffer: ImageData | null;
  scene: GeneratedScene | null;
  timestamp: number;
}

/**
 * Interpolation frame data
 */
export interface TransitionFrame {
  sourceBuffer: ImageData | null;
  targetBuffer: ImageData | null;
  morphBuffer: ImageData | null;
  dissolveMask: Float32Array | null;
  progress: number;
  phase: TransitionPhase;
}

/**
 * Face-to-story transition specific config
 */
export interface FaceToStoryConfig extends TransitionConfig {
  captureFaceExpression: boolean;
  preserveFaceExpression: boolean;
}

/**
 * Story-to-face transition specific config
 */
export interface StoryToFaceConfig extends TransitionConfig {
  captureStoryMood: boolean;
  targetExpression: string;
}

/**
 * Transition interrupt reason
 */
export type InterruptReason = 'user' | 'system' | 'priority' | 'timeout';
