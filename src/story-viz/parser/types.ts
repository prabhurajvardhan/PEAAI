/**
 * Story Parser Types
 * 
 * Type definitions for story text parsing and scene extraction.
 */

import { IPosition } from '../../graphics/types';

/**
 * Scene transition types
 */
export type SceneTransitionType = 
  | 'cut'
  | 'fade'
  | 'dissolve'
  | 'wipe';

/**
 * Extracted character from story text
 */
export interface ExtractedCharacter {
  name: string;
  emotion: string;
  position?: IPosition;
  scale?: number;
  speaking?: boolean;
}

/**
 * Extracted action from story text
 */
export interface ExtractedAction {
  character: string;
  action: string;
  target?: string;
  emotion?: string;
}

/**
 * Environment description
 */
export interface EnvironmentDescription {
  location: string;
  timeOfDay: string;
  weather: string;
  mood: string;
  lighting: string;
}

/**
 * Camera action
 */
export interface CameraAction {
  type: 'pan' | 'zoom' | 'hold' | 'track';
  direction?: 'left' | 'right' | 'up' | 'down';
  target?: string;
  zoomLevel?: number;
  duration?: number;
}

/**
 * Scene metadata
 */
export interface SceneMetadata {
  sceneNumber: number;
  transitionType: SceneTransitionType;
  duration?: number;
  emotion: string;
  atmosphere: string;
}

/**
 * Parsed scene data
 */
export interface ParsedScene {
  id: string;
  text: string;
  characters: ExtractedCharacter[];
  actions: ExtractedAction[];
  environment: EnvironmentDescription;
  camera: CameraAction;
  metadata: SceneMetadata;
  startIndex: number;
  endIndex: number;
}

/**
 * Parsed story result
 */
export interface ParsedStory {
  title?: string;
  scenes: ParsedScene[];
  totalScenes: number;
  characters: string[];
}

/**
 * Scene boundary detection patterns
 */
export interface SceneBoundaryPatterns {
  transitions: RegExp[];
  locationChanges: RegExp[];
  timeChanges: RegExp[];
  chapterMarkers: RegExp[];
}

/**
 * Parser configuration
 */
export interface StoryParserConfig {
  minSceneLength?: number;
  maxSceneLength?: number;
  detectLocationChanges?: boolean;
  detectTimeChanges?: boolean;
  extractEmotions?: boolean;
  generateCameraActions?: boolean;
}

/**
 * Emotion extraction result
 */
export interface EmotionExtraction {
  primary: string;
  secondary?: string;
  intensity: number; // 0-1
  keywords: string[];
}
