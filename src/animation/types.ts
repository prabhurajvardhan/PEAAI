/**
 * Animation Engine (M04)
 * 
 * Animation types and shared interfaces for PEAAI.
 */

import { IPosition } from '../graphics/types';

// Re-export for convenience
export { IPosition };

/**
 * Animation target types
 */
export type AnimationTarget = Record<string, number | IPosition>;

/**
 * Animation property paths for interpolation
 */
export interface AnimationProperty<T = number> {
  key: string;
  value: T;
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  duration: number;
  easing?: EasingFunction;
  delay?: number;
  loop?: boolean;
  loopCount?: number;
  yoyo?: boolean;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
  onStart?: () => void;
}

/**
 * Easing function type
 */
export type EasingFunction = (t: number) => number;

/**
 * Bezier curve control points
 */
export interface BezierControlPoints {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Keyframe data structure
 */
export interface Keyframe<T = number> {
  time: number;
  value: T;
  easing?: EasingFunction;
  bezier?: BezierControlPoints;
}

/**
 * Animation state
 */
export type AnimationState = 'idle' | 'playing' | 'paused' | 'completed' | 'cancelled';

/**
 * Animation priority levels
 */
export type AnimationPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Particle configuration
 */
export interface ParticleConfig {
  emissionRate: number;
  maxParticles: number;
  lifetime: number;
  initialVelocity: IPosition;
  acceleration?: IPosition;
  colorStart: { r: number; g: number; b: number; a: number };
  colorEnd: { r: number; g: number; b: number; a: number };
  sizeStart: number;
  sizeEnd: number;
  gravity?: number;
  friction?: number;
}

/**
 * Particle data
 */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: { r: number; g: number; b: number; a: number };
  active: boolean;
}

/**
 * Emitter position type
 */
export type EmitterShape = 'point' | 'circle' | 'rectangle';

/**
 * Emitter configuration
 */
export interface EmitterConfig {
  shape: EmitterShape;
  position: IPosition;
  width?: number;
  height?: number;
  radius?: number;
  angle?: number;
  spread?: number;
}

/**
 * Animation event types
 */
export type AnimationEventType = 'start' | 'update' | 'complete' | 'cancel' | 'loop';

/**
 * Animation event
 */
export interface AnimationEvent {
  type: AnimationEventType;
  timestamp: number;
  data?: unknown;
}
