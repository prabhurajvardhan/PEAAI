/**
 * Scene Renderer Types
 * 
 * Type definitions for the scene renderer.
 */

import { IColor, IPosition } from '../../graphics/types';
import type { GeneratedScene } from '../scene-generator/types';
import type { CameraState } from '../camera/types';
import type { CharacterPlacement } from '../character-placement/types';
import type { EnvironmentData } from '../environment/types';

/**
 * Render layer types
 */
export type RenderLayer = 
  | 'background'
  | 'parallax'
  | 'environment'
  | 'characters'
  | 'effects'
  | 'weather'
  | 'atmosphere'
  | 'ui';

/**
 * Scene layer data
 */
export interface RenderLayerData {
  type: RenderLayer;
  zIndex: number;
  visible: boolean;
  opacity: number;
  dirty: boolean;
}

/**
 * Renderable sprite data
 */
export interface RenderableSprite {
  id: string;
  type: 'background' | 'character' | 'effect' | 'weather';
  position: IPosition;
  scale: number;
  rotation: number;
  opacity: number;
  layer: number;
  data: unknown;
}

/**
 * Transition effect data
 */
export interface TransitionEffect {
  type: 'cut' | 'fade' | 'dissolve' | 'wipe' | 'blur';
  progress: number;
  duration: number;
  startTime: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

/**
 * Render statistics
 */
export interface RenderStats {
  fps: number;
  frameTime: number;
  drawCalls: number;
  pixelsRendered: number;
  layersRendered: number;
}

/**
 * Render configuration
 */
export interface RenderConfig {
  width: number;
  height: number;
  pixelScale: number;
  enableVSync: boolean;
  enablePerfStats: boolean;
  backgroundColor: IColor;
  clearEachFrame: boolean;
}

/**
 * Dirty region for optimization
 */
export interface DirtyRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Scene render context
 */
export interface SceneRenderContext {
  scene: GeneratedScene;
  camera: CameraState;
  placements: CharacterPlacement[];
  environment: EnvironmentData;
  layers: Map<RenderLayer, RenderLayerData>;
  dirtyRegions: DirtyRegion[];
  stats: RenderStats;
}

/**
 * Pixel-perfect rendering options
 */
export interface PixelPerfectOptions {
  enabled: boolean;
  scale: number;
  snapToPixel: boolean;
  preserveAspectRatio: boolean;
}

/**
 * Scene renderer events
 */
export type SceneRendererEventType = 
  | 'renderStart'
  | 'renderComplete'
  | 'frameComplete'
  | 'transitionStart'
  | 'transitionComplete'
  | 'sceneChange';

/**
 * Scene renderer event data
 */
export interface SceneRendererEvent {
  type: SceneRendererEventType;
  timestamp: number;
  data?: unknown;
}
