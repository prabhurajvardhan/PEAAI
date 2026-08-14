/**
 * Pixel Morphing Types
 */

import type { IPosition } from '../../graphics/types';
import type { MorphPreset, EasingFunction } from '../types';

/**
 * Vertex morph target
 */
export interface VertexMorph {
  x: number;
  y: number;
  dx: number;  // Displacement X
  dy: number;  // Displacement Y
}

/**
 * Morph configuration
 */
export interface MorphConfig {
  preset: MorphPreset;
  easing: EasingFunction;
  intensity: number;        // 0-1, morph intensity
  iterations: number;       // Number of morph iterations
  vertexDensity: number;   // Grid density for vertex morphing
}

/**
 * Default morph configuration
 */
export const DEFAULT_MORPH_CONFIG: Readonly<MorphConfig> = {
  preset: 'none',
  easing: (t) => t,
  intensity: 1.0,
  iterations: 1,
  vertexDensity: 4,
};

/**
 * Morph point data
 */
export interface MorphPoint {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  displacement: IPosition;
  weight: number;
}

/**
 * Morph frame data
 */
export interface MorphFrame {
  progress: number;
  points: MorphPoint[];
  pixelDisplacements: Map<number, IPosition>; // index -> displacement
}

/**
 * Morph callback
 */
export type MorphCallback = (frame: MorphFrame) => void;

/**
 * Morph event types
 */
export type MorphEventType = 
  | 'start'
  | 'update'
  | 'complete'
  | 'presetChange';

/**
 * Morph preset configuration
 */
export interface MorphPresetConfig {
  warp: {
    strength: number;
    centerX: number;
    centerY: number;
  };
  ripple: {
    amplitude: number;
    wavelength: number;
    speed: number;
  };
  twist: {
    angle: number;
    centerX: number;
    centerY: number;
  };
  bulge: {
    strength: number;
    radius: number;
    centerX: number;
    centerY: number;
  };
  implode: {
    strength: number;
    centerX: number;
    centerY: number;
  };
  explode: {
    strength: number;
    centerX: number;
    centerY: number;
  };
}
