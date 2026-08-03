/**
 * Dissolve Effects Types
 */

import type { IPosition } from '../../graphics/types';
import type { DissolvePattern, EasingFunction, DissolveParticle, DissolveCell } from '../types';

/**
 * Grid dissolve cell state
 */
export interface GridDissolveCell extends DissolveCell {
  noiseValue: number;      // Perlin/simplex noise value
  delay: number;          // Individual cell delay
}

/**
 * Particle dissolve configuration
 */
export interface ParticleDissolveConfig {
  emissionRate: number;
  maxParticles: number;
  particleLifetime: number;
  initialVelocity: IPosition;
  gravity: number;
  friction: number;
  colorStart: { r: number; g: number; b: number; a: number };
  colorEnd: { r: number; g: number; b: number; a: number };
}

/**
 * Noise dissolve configuration
 */
export interface NoiseDissolveConfig {
  scale: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  seed: number;
  threshold: number;
  animated: boolean;
  animationSpeed: number;
}

/**
 * Custom dissolve pattern function
 */
export type DissolvePatternFunction = (
  x: number,
  y: number,
  width: number,
  height: number,
  progress: number,
  seed: number
) => number;

/**
 * Dissolve effect configuration
 */
export interface DissolveEffectConfig {
  pattern: DissolvePattern;
  easing: EasingFunction;
  particleConfig?: ParticleDissolveConfig;
  noiseConfig?: NoiseDissolveConfig;
  customPattern?: DissolvePatternFunction;
  reverse: boolean;         // If true, dissolve from edges inward
  staggered: boolean;       // If true, cells don't dissolve simultaneously
  seed: number;             // Random seed for reproducible patterns
}

/**
 * Default dissolve configuration
 */
export const DEFAULT_DISSOLVE_CONFIG: Readonly<DissolveEffectConfig> = {
  pattern: 'grid',
  easing: (t) => t,
  reverse: false,
  staggered: false,
  seed: Date.now(),
};

/**
 * Dissolve mask cell
 */
export interface DissolveMaskCell {
  x: number;
  y: number;
  dissolve: number;  // 0-1, 1 = fully dissolved
  alpha: number;     // Current alpha (1 - dissolve)
}

/**
 * Dissolve callback
 */
export type DissolveCallback = (mask: DissolveMaskCell[], progress: number) => void;

/**
 * Dissolve event types
 */
export type DissolveEventType = 
  | 'init'
  | 'update'
  | 'patternChange'
  | 'complete';

/**
 * Pre-computed dissolve mask
 */
export interface DissolveMask {
  width: number;
  height: number;
  cells: DissolveMaskCell[];
  progress: number;
}
