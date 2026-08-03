/**
 * Character Placement Types
 * 
 * Type definitions for character positioning and placement in scenes.
 */

import { IPosition } from '../../graphics/types';

/**
 * Character placement position
 */
export interface PlacementPosition {
  x: number;
  y: number;
  anchor?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Character scale configuration
 */
export interface ScaleConfig {
  base: number;
  min: number;
  max: number;
  distanceScaling: boolean;
}

/**
 * Z-layer configuration
 */
export interface ZLayerConfig {
  foreground: number;
  midground: number;
  background: number;
  characters: number;
  props: number;
  effects: number;
}

/**
 * Character placement data
 */
export interface CharacterPlacement {
  id: string;
  characterId: string;
  position: PlacementPosition;
  scale: number;
  layer: number;
  rotation: number;
  opacity: number;
  anchor: PlacementPosition['anchor'];
}

/**
 * Placement rule types
 */
export type PlacementRule = 
  | 'equal_spacing'
  | 'golden_ratio'
  | 'rule_of_thirds'
  | 'center'
  | 'cluster'
  | 'opposing';

/**
 * Scene layout configuration
 */
export interface LayoutConfig {
  rule: PlacementRule;
  maxCharacters: number;
  spacing: number;
  offset: IPosition;
}

/**
 * Character anchor point
 */
export interface AnchorPoint {
  horizontal: 'left' | 'center' | 'right';
  vertical: 'top' | 'center' | 'bottom';
}

/**
 * Character bounds for placement
 */
export interface CharacterBounds {
  width: number;
  height: number;
  pivotX: number;
  pivotY: number;
}

/**
 * Placement animation data
 */
export interface PlacementAnimation {
  enter: AnimationKeyframe[];
  exit: AnimationKeyframe[];
  move: AnimationKeyframe[];
  scale: AnimationKeyframe[];
}

/**
 * Animation keyframe for placement
 */
export interface AnimationKeyframe {
  time: number;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;
  easing: string;
}

/**
 * Character placement configuration
 */
export interface CharacterPlacementConfig {
  canvasWidth: number;
  canvasHeight: number;
  scaleConfig: ScaleConfig;
  zLayers: ZLayerConfig;
  defaultLayout: LayoutConfig;
  anchorPoint: AnchorPoint;
  bounds: CharacterBounds;
}

/**
 * Placement event types
 */
export type PlacementEventType = 
  | 'characterAdded'
  | 'characterRemoved'
  | 'positionChanged'
  | 'layerChanged'
  | 'scaleChanged';

/**
 * Placement event data
 */
export interface PlacementEvent {
  type: PlacementEventType;
  placement: CharacterPlacement;
  previousValue?: unknown;
}
