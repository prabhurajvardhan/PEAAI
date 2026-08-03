/**
 * Scene Generator Types
 * 
 * Type definitions for scene content generation.
 */

import { IPosition, IColor } from '../../graphics/types';

/**
 * Character scene data
 */
export interface SceneCharacter {
  id: string;
  name: string;
  position: IPosition;
  scale: number;
  layer: number;
  expression: CharacterExpression;
  emotion: string;
  speaking: boolean;
  animations: CharacterAnimation[];
}

/**
 * Character expression state
 */
export interface CharacterExpression {
  eyeOpenness: number;
  pupilDirection: IPosition;
  mouthOpenness: number;
  mouthCurve: number;
  eyebrowAngle: number;
  cheekRaise: number;
}

/**
 * Character animation reference
 */
export interface CharacterAnimation {
  type: 'idle' | 'walk' | 'talk' | 'react' | 'gesture';
  duration: number;
  loop: boolean;
  delay?: number;
}

/**
 * Environment scene data
 */
export interface SceneEnvironment {
  location: string;
  timeOfDay: string;
  background: BackgroundData;
  backgrounds: BackgroundData[];
  weather: WeatherData;
  lighting: LightingData;
  atmosphere: AtmosphereData;
  parallaxLayers: ParallaxLayer[];
}

/**
 * Parallax layer for scene
 */
export interface ParallaxLayer {
  id: string;
  depth: number;
  sprites: string[];
  scrollFactor: number;
  opacity: number;
}

/**
 * Background configuration
 */
export interface BackgroundData {
  spriteId: string;
  parallax: number;
  color: IColor;
  gradient?: GradientConfig;
}

/**
 * Color gradient configuration
 */
export interface GradientConfig {
  type: 'linear' | 'radial';
  colors: Array<{ color: IColor; position: number }>;
  angle?: number;
}

/**
 * Weather configuration
 */
export interface WeatherData {
  type: 'clear' | 'rain' | 'snow' | 'fog' | 'wind' | 'clouds';
  intensity: number;
  direction: IPosition;
  particles: ParticleConfig;
}

/**
 * Particle configuration for weather
 */
export interface ParticleConfig {
  count: number;
  speed: number;
  size: number;
  opacity: number;
}

/**
 * Lighting configuration
 */
export interface LightingData {
  ambient: number;
  direction: IPosition;
  color: IColor;
  shadows: boolean;
  highlights: boolean;
}

/**
 * Atmosphere configuration
 */
export interface AtmosphereData {
  mood: string;
  color: IColor;
  blur: number;
  vignette: number;
  grain: number;
}

/**
 * Action scene data
 */
export interface SceneAction {
  id: string;
  characterId: string;
  type: ActionType;
  description: string;
  duration: number;
  easing: string;
  keyframes: ActionKeyframe[];
}

/**
 * Action types
 */
export type ActionType = 
  | 'move'
  | 'speak'
  | 'react'
  | 'gesture'
  | 'enter'
  | 'exit'
  | 'focus';

/**
 * Action keyframe
 */
export interface ActionKeyframe {
  time: number;
  position?: IPosition;
  scale?: number;
  expression?: Partial<CharacterExpression>;
  opacity?: number;
}

/**
 * Emotion data for scene
 */
export interface SceneEmotion {
  primary: string;
  intensity: number;
  transition: EmotionTransition;
}

/**
 * Emotion transition configuration
 */
export interface EmotionTransition {
  duration: number;
  easing: string;
  blend: boolean;
}

/**
 * Generated scene data for rendering
 */
export interface GeneratedScene {
  id: string;
  sceneNumber: number;
  characters: SceneCharacter[];
  environment: SceneEnvironment;
  actions: SceneAction[];
  emotion: SceneEmotion;
  camera: GeneratedCamera;
  duration: number;
  transitionIn: TransitionConfig;
  transitionOut: TransitionConfig;
}

/**
 * Generated camera configuration
 */
export interface GeneratedCamera {
  position: IPosition;
  zoom: number;
  rotation: number;
  easing: string;
  duration: number;
}

/**
 * Transition configuration
 */
export interface TransitionConfig {
  type: 'cut' | 'fade' | 'dissolve' | 'wipe' | 'blur';
  duration: number;
  easing: string;
}

/**
 * Scene generator configuration
 */
export interface SceneGeneratorConfig {
  canvasWidth: number;
  canvasHeight: number;
  defaultScale: number;
  defaultLayer: number;
  emotionMapping: Record<string, CharacterExpression>;
}

/**
 * Scene generator result
 */
export interface SceneGeneratorResult {
  scenes: GeneratedScene[];
  characters: Map<string, SceneCharacter>;
  totalDuration: number;
}
