/**
 * Eye Engine Types - M02 Companion Engine
 * 
 * Type definitions for the eye engine.
 */

import type { IPosition } from '../../graphics/types';
import type { EyeState, IFaceState } from '../geometry/types';

/**
 * Eye configuration
 */
export interface IEyeConfig {
  width: number;
  height: number;
  pupilRadius: number;
  irisRadius: number;
  scleraColor: { r: number; g: number; b: number; a: number };
  irisColor: { r: number; g: number; b: number; a: number };
  pupilColor: { r: number; g: number; b: number; a: number };
  highlightColor: { r: number; g: number; b: number; a: number };
}

/**
 * Default eye configuration
 */
export const DEFAULT_EYE_CONFIG: Readonly<IEyeConfig> = {
  width: 6,
  height: 4,
  pupilRadius: 1,
  irisRadius: 2,
  scleraColor: { r: 255, g: 255, b: 255, a: 255 },
  irisColor: { r: 100, g: 149, b: 237, a: 255 },  // Cornflower blue
  pupilColor: { r: 0, g: 0, b: 0, a: 255 },
  highlightColor: { r: 255, g: 255, b: 255, a: 255 },
};

/**
 * Eye rendering data
 */
export interface IEyeRenderData {
  eyeLeft: {
    bounds: { x: number; y: number; width: number; height: number };
    pupil: IPosition;
    iris: IPosition;
    openness: number;
  };
  eyeRight: {
    bounds: { x: number; y: number; width: number; height: number };
    pupil: IPosition;
    iris: IPosition;
    openness: number;
  };
}

/**
 * Eye animation state
 */
export interface IEyeAnimationState {
  currentState: EyeState;
  targetState: EyeState;
  transitionProgress: number;
  pupilDirection: IPosition;
  blinkProgress: number;
}

/**
 * Looking direction
 */
export interface ILookingDirection {
  direction: IPosition;  // Normalized -1 to 1
  target: IPosition;     // Target direction
  isAnimating: boolean;
}

/**
 * Eye engine events
 */
export interface IEyeEvents {
  onBlinkStart: () => void;
  onBlinkComplete: () => void;
  onLookAt: (direction: IPosition) => void;
  onStateChange: (state: EyeState) => void;
}
