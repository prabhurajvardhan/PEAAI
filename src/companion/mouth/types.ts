/**
 * Mouth Engine Types - M02 Companion Engine
 * 
 * Type definitions for the mouth engine.
 */

import type { IPosition } from '../../graphics/types';
import type { MouthState, IFaceState } from '../geometry/types';

/**
 * Mouth configuration
 */
export interface IMouthConfig {
  width: number;
  height: number;
  lipColor: { r: number; g: number; b: number; a: number };
  innerColor: { r: number; g: number; b: number; a: number };
  teethColor: { r: number; g: number; b: number; a: number };
  tongueColor: { r: number; g: number; b: number; a: number };
}

/**
 * Default mouth configuration
 */
export const DEFAULT_MOUTH_CONFIG: Readonly<IMouthConfig> = {
  width: 8,
  height: 3,
  lipColor: { r: 180, g: 100, b: 100, a: 255 },  // Rosy lips
  innerColor: { r: 120, g: 40, b: 40, a: 255 },  // Dark inner mouth
  teethColor: { r: 255, g: 255, b: 255, a: 255 },
  tongueColor: { r: 200, g: 100, b: 100, a: 255 },
};

/**
 * Mouth shape types
 */
export type MouthShape = 
  | 'neutral'      // Straight line
  | 'smile'        // Curved upward
  | 'frown'        // Curved downward
  | 'open'         // Oval/rounded
  | 'small_smile'  // Subtle smile
  | 'big_smile';   // Wide smile showing teeth

/**
 * Lip sync data
 */
export interface ILipSyncData {
  phoneme: string;
  mouthOpenness: number;
  mouthWidth: number;
  tonguePosition: number;
}

/**
 * Standard phoneme mappings for lip sync
 */
export const PHONEME_MAP: Record<string, ILipSyncData> = {
  'A': { phoneme: 'A', mouthOpenness: 0.7, mouthWidth: 1.0, tonguePosition: 0 },
  'E': { phoneme: 'E', mouthOpenness: 0.3, mouthWidth: 0.6, tonguePosition: 0 },
  'I': { phoneme: 'I', mouthOpenness: 0.2, mouthWidth: 0.5, tonguePosition: 0 },
  'O': { phoneme: 'O', mouthOpenness: 0.8, mouthWidth: 0.7, tonguePosition: 0 },
  'U': { phoneme: 'U', mouthOpenness: 0.4, mouthWidth: 0.4, tonguePosition: 0 },
  'M': { phoneme: 'M', mouthOpenness: 0.0, mouthWidth: 0.3, tonguePosition: 0 },
  'F': { phoneme: 'F', mouthOpenness: 0.1, mouthWidth: 0.5, tonguePosition: 0 },
  'L': { phoneme: 'L', mouthOpenness: 0.2, mouthWidth: 0.4, tonguePosition: 0 },
  'TH': { phoneme: 'TH', mouthOpenness: 0.1, mouthWidth: 0.5, tonguePosition: 0.5 },
  'REST': { phoneme: 'REST', mouthOpenness: 0.0, mouthWidth: 0.2, tonguePosition: 0 },
};

/**
 * Mouth rendering data
 */
export interface IMouthRenderData {
  bounds: { x: number; y: number; width: number; height: number };
  shape: MouthShape;
  openness: number;
  curve: number;
  lipPositions: IPosition[];
  showTeeth: boolean;
  showTongue: boolean;
}

/**
 * Mouth expression presets
 */
export interface IMouthExpression {
  shape: MouthShape;
  openness: number;
  curve: number;
  showTeeth: boolean;
  showTongue: boolean;
}

/**
 * Predefined mouth expressions
 */
export const MOUTH_EXPRESSIONS: Record<string, IMouthExpression> = {
  neutral: {
    shape: 'neutral',
    openness: 0.0,
    curve: 0.0,
    showTeeth: false,
    showTongue: false,
  },
  smile: {
    shape: 'smile',
    openness: 0.0,
    curve: 0.5,
    showTeeth: false,
    showTongue: false,
  },
  big_smile: {
    shape: 'big_smile',
    openness: 0.3,
    curve: 0.8,
    showTeeth: true,
    showTongue: false,
  },
  frown: {
    shape: 'frown',
    openness: 0.0,
    curve: -0.5,
    showTeeth: false,
    showTongue: false,
  },
  open: {
    shape: 'open',
    openness: 0.6,
    curve: 0.0,
    showTeeth: false,
    showTongue: false,
  },
  talking: {
    shape: 'open',
    openness: 0.4,
    curve: 0.0,
    showTeeth: false,
    showTongue: false,
  },
};
