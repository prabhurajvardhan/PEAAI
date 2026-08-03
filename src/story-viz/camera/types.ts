/**
 * Camera Controller Types
 * 
 * Type definitions for camera control and movement.
 */

import { IPosition } from '../../graphics/types';

/**
 * Camera movement types
 */
export type CameraMovementType = 
  | 'pan'
  | 'zoom'
  | 'track'
  | 'shake'
  | 'orbit';

/**
 * Camera direction
 */
export type CameraDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Camera preset types
 */
export type CameraPreset = 
  | 'wide'
  | 'medium'
  | 'closeup'
  | 'extreme_closeup'
  | 'over_shoulder'
  | 'pov'
  | 'establishing';

/**
 * Easing preset types
 */
export type EasingPreset = 
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInElastic'
  | 'easeOutElastic'
  | 'easeInOutElastic'
  | 'easeInBounce'
  | 'easeOutBounce'
  | 'easeInOutBounce';

/**
 * Camera state
 */
export interface CameraState {
  position: IPosition;
  zoom: number;
  rotation: number;
  focalPoint: IPosition;
}

/**
 * Camera movement configuration
 */
export interface CameraMovement {
  type: CameraMovementType;
  from: CameraState;
  to: CameraState;
  duration: number;
  easing: EasingPreset;
}

/**
 * Pan movement configuration
 */
export interface PanConfig {
  direction: CameraDirection | IPosition;
  distance: number;
  duration: number;
  easing: EasingPreset;
}

/**
 * Zoom configuration
 */
export interface ZoomConfig {
  target: number;
  focalPoint?: IPosition;
  duration: number;
  easing: EasingPreset;
}

/**
 * Track configuration (follow a target)
 */
export interface TrackConfig {
  targetId: string;
  offset: IPosition;
  lookAhead: number;
  duration: number;
  easing: EasingPreset;
}

/**
 * Shake configuration
 */
export interface ShakeConfig {
  intensity: number;
  frequency: number;
  duration: number;
}

/**
 * Orbit configuration
 */
export interface OrbitConfig {
  center: IPosition;
  radius: number;
  startAngle: number;
  endAngle: number;
  duration: number;
  easing: EasingPreset;
}

/**
 * Camera preset configuration
 */
export interface CameraPresetConfig {
  position: IPosition;
  zoom: number;
  rotation: number;
  focalLength?: number;
}

/**
 * Camera bounds
 */
export interface CameraBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZoom: number;
  maxZoom: number;
}

/**
 * Camera controller configuration
 */
export interface CameraControllerConfig {
  canvasWidth: number;
  canvasHeight: number;
  defaultZoom: number;
  bounds: CameraBounds;
  presets: Record<CameraPreset, CameraPresetConfig>;
  defaultEasing: EasingPreset;
}

/**
 * Camera event types
 */
export type CameraEventType = 
  | 'movementStart'
  | 'movementUpdate'
  | 'movementComplete'
  | 'zoomChange'
  | 'presetChange';

/**
 * Camera event data
 */
export interface CameraEvent {
  type: CameraEventType;
  state: CameraState;
  timestamp: number;
  data?: unknown;
}
