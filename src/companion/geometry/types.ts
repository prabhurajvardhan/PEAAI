/**
 * Face Geometry Types - M02 Companion Engine
 * 
 * Type definitions for the face geometry engine.
 */

import type { IPosition } from '../../graphics/types';

/**
 * Default grid size for the companion face
 */
export const DEFAULT_FACE_GRID_SIZE = 32;

/**
 * Face feature regions
 */
export interface IEyeRegion {
  left: IPosition;
  right: IPosition;
  width: number;
  height: number;
  pupilOffset: IPosition;
}

export interface IMouthRegion {
  position: IPosition;
  width: number;
  height: number;
}

export interface IFaceRegion {
  eyes: IEyeRegion;
  mouth: IMouthRegion;
  eyebrowLeft: IPosition;
  eyebrowRight: IPosition;
  nose: IPosition;
  cheekLeft: IPosition;
  cheekRight: IPosition;
}

/**
 * Face state interface representing current expression state
 */
export interface IFaceState {
  eyeOpenness: number;       // 0-1, 0 = closed, 1 = fully open
  pupilDirection: IPosition; // -1 to 1 normalized, direction eyes are looking
  mouthOpenness: number;     // 0-1, 0 = closed, 1 = fully open
  mouthCurve: number;        // -1 to 1, -1 = frown, 0 = neutral, 1 = smile
  eyebrowRaise: number;     // 0-1, 0 = normal, 1 = raised
  cheekRaise: number;       // 0-1, 0 = normal, 1 = raised (blushing)
  faceScale: number;         // 0.9-1.1, subtle scaling for breathing
}

/**
 * Default face state
 */
export const DEFAULT_FACE_STATE: Readonly<IFaceState> = {
  eyeOpenness: 1.0,
  pupilDirection: { x: 0, y: 0 },
  mouthOpenness: 0.0,
  mouthCurve: 0.0,
  eyebrowRaise: 0.0,
  cheekRaise: 0.0,
  faceScale: 1.0,
};

/**
 * Eye state enum
 */
export enum EyeState {
  Open = 'open',
  HalfOpen = 'half_open',
  Closed = 'closed',
  Squinting = 'squinting',
  Wide = 'wide',
}

/**
 * Mouth state enum
 */
export enum MouthState {
  Closed = 'closed',
  SlightlyOpen = 'slightly_open',
  Open = 'open',
  WideOpen = 'wide_open',
}

/**
 * Pupil direction enum for discrete directions
 */
export enum PupilDirection {
  Center = 'center',
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
  UpLeft = 'up_left',
  UpRight = 'up_right',
  DownLeft = 'down_left',
  DownRight = 'down_right',
}

/**
 * Emotion type enum
 */
export type EmotionType = 
  | 'neutral' 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'surprised' 
  | 'thinking' 
  | 'sleepy' 
  | 'excited' 
  | 'scared'
  | 'disgusted';

/**
 * Expression type for preset expressions
 */
export type ExpressionType = 
  | 'neutral' 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'surprised' 
  | 'thinking' 
  | 'curious' 
  | 'sleepy' 
  | 'excited';

/**
 * Face geometry configuration
 */
export interface IFaceGeometryConfig {
  gridSize: number;
  eyeRegion: IEyeRegion;
  mouthRegion: IMouthRegion;
  faceRegion: IFaceRegion;
}

/**
 * Bounding box for a face feature
 */
export interface IFeatureBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
