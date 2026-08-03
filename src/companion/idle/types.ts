/**
 * Idle Behaviour Types - M02 Companion Engine
 * 
 * Type definitions for the idle behaviour engine.
 */

import type { IPosition } from '../../graphics/types';
import type { IFaceState } from '../geometry/types';

/**
 * Idle behaviour configuration
 */
export interface IIdleConfig {
  breathingEnabled: boolean;
  breathingSpeed: number;         // Cycles per second
  breathingIntensity: number;      // 0-1, how much the face scales
  lookAroundEnabled: boolean;
  lookAroundIntervalMin: number;   // Minimum seconds between look-arounds
  lookAroundIntervalMax: number;  // Maximum seconds between look-arounds
  lookAroundSpeed: number;        // How fast eyes move
  idleExpressionEnabled: boolean;
  idleExpressionInterval: number; // Seconds between expression changes
  returnToCenterSpeed: number;    // How fast eyes return to center
}

/**
 * Default idle configuration
 */
export const DEFAULT_IDLE_CONFIG: Readonly<IIdleConfig> = {
  breathingEnabled: true,
  breathingSpeed: 0.3,            // ~3 seconds per breath
  breathingIntensity: 0.02,        // Subtle 2% scale change
  lookAroundEnabled: true,
  lookAroundIntervalMin: 3.0,     // 3 seconds minimum
  lookAroundIntervalMax: 8.0,     // 8 seconds maximum
  lookAroundSpeed: 1.5,           // Moderate speed
  idleExpressionEnabled: true,
  idleExpressionInterval: 5.0,    // Change expression every 5 seconds
  returnToCenterSpeed: 0.8,       // Slow return to center
};

/**
 * Idle state
 */
export enum IdleState {
  Idle = 'idle',
  Breathing = 'breathing',
  LookingAround = 'looking_around',
  ReturningToCenter = 'returning_to_center',
  ExpressionChange = 'expression_change',
}

/**
 * Idle animation data
 */
export interface IIdleAnimation {
  state: IdleState;
  breathPhase: number;           // 0-2π for breathing cycle
  faceScale: number;             // Current scale factor
  lookDirection: IPosition;      // Current look direction
  expressionVariation: number;    // Subtle expression variation
  timeInState: number;           // Time spent in current state
}

/**
 * Look around target
 */
export interface ILookTarget {
  direction: IPosition;
  holdDuration: number;
}

/**
 * Predefined look targets for variety
 */
export const LOOK_TARGETS: ILookTarget[] = [
  { direction: { x: 0, y: 0 }, holdDuration: 2.0 },       // Center (default)
  { direction: { x: 0.5, y: -0.3 }, holdDuration: 1.5 },  // Slightly right-up
  { direction: { x: -0.5, y: -0.3 }, holdDuration: 1.5 },  // Slightly left-up
  { direction: { x: 0.7, y: 0 }, holdDuration: 1.0 },      // Right
  { direction: { x: -0.7, y: 0 }, holdDuration: 1.0 },     // Left
  { direction: { x: 0, y: -0.5 }, holdDuration: 1.0 },    // Up
  { direction: { x: 0.3, y: 0.3 }, holdDuration: 1.5 },    // Right-down
  { direction: { x: -0.3, y: 0.3 }, holdDuration: 1.5 }, // Left-down
];

/**
 * Idle expression variations
 */
export interface IIdleExpression {
  eyebrowRaise: number;
  cheekRaise: number;
  mouthCurve: number;
}

/**
 * Predefined idle expressions for variety
 */
export const IDLE_EXPRESSIONS: IIdleExpression[] = [
  { eyebrowRaise: 0, cheekRaise: 0, mouthCurve: 0 },       // Neutral
  { eyebrowRaise: 0.1, cheekRaise: 0.1, mouthCurve: 0.1 }, // Slight smile
  { eyebrowRaise: 0.05, cheekRaise: 0, mouthCurve: 0.05 }, // Content
  { eyebrowRaise: 0, cheekRaise: 0.05, mouthCurve: 0.15 }, // Gentle smile
];
