/**
 * Environment Generator Types
 * 
 * Type definitions for environment generation.
 */

import { IColor, IPosition } from '../../graphics/types';

/**
 * Weather types
 */
export type WeatherType = 
  | 'clear'
  | 'sunny'
  | 'cloudy'
  | 'rainy'
  | 'stormy'
  | 'snowy'
  | 'foggy'
  | 'windy';

/**
 * Time of day
 */
export type TimeOfDay = 
  | 'dawn'
  | 'morning'
  | 'midday'
  | 'afternoon'
  | 'evening'
  | 'dusk'
  | 'night'
  | 'midnight';

/**
 * Location types
 */
export type LocationType =
  | 'forest'
  | 'beach'
  | 'city'
  | 'room'
  | 'garden'
  | 'mountain'
  | 'road'
  | 'cave'
  | 'castle'
  | 'space'
  | 'underwater'
  | 'unknown';

/**
 * Lighting type
 */
export type LightingType =
  | 'bright'
  | 'dim'
  | 'dark'
  | 'warm'
  | 'cold'
  | 'natural'
  | 'dramatic'
  | 'moonlit';

/**
 * Atmospheric mood
 */
export type AtmosphereMood =
  | 'tense'
  | 'calm'
  | 'joyful'
  | 'melancholy'
  | 'mysterious'
  | 'adventurous'
  | 'romantic'
  | 'dark'
  | 'neutral';

/**
 * Background layer data
 */
export interface BackgroundLayer {
  id: string;
  spriteId: string;
  parallax: number;
  offset: IPosition;
  opacity: number;
  scale: number;
  color: IColor;
}

/**
 * Weather particle data
 */
export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  active: boolean;
}

/**
 * Weather effect data
 */
export interface WeatherEffect {
  type: WeatherType;
  intensity: number;
  direction: IPosition;
  particles: WeatherParticle[];
  colors: IColor[];
}

/**
 * Lighting effect data
 */
export interface LightingEffect {
  type: LightingType;
  ambient: number;
  color: IColor;
  direction: IPosition;
  shadows: ShadowConfig;
  highlights: HighlightConfig;
  colorGrade: ColorGradeConfig;
}

/**
 * Shadow configuration
 */
export interface ShadowConfig {
  enabled: boolean;
  intensity: number;
  blur: number;
  offset: IPosition;
  color: IColor;
}

/**
 * Highlight configuration
 */
export interface HighlightConfig {
  enabled: boolean;
  intensity: number;
  size: number;
  color: IColor;
  threshold: number;
}

/**
 * Color grading configuration
 */
export interface ColorGradeConfig {
  enabled: boolean;
  shadows: IColor;
  midtones: IColor;
  highlights: IColor;
  saturation: number;
  contrast: number;
  temperature: number;
  tint: number;
}

/**
 * Atmosphere effect data
 */
export interface AtmosphereEffect {
  mood: AtmosphereMood;
  colorOverlay: IColor;
  blur: number;
  vignette: VignetteConfig;
  grain: GrainConfig;
  depthOfField: DepthOfFieldConfig;
}

/**
 * Vignette configuration
 */
export interface VignetteConfig {
  enabled: boolean;
  intensity: number;
  radius: number;
  softness: number;
  color: IColor;
}

/**
 * Grain configuration
 */
export interface GrainConfig {
  enabled: boolean;
  intensity: number;
  size: number;
  animated: boolean;
}

/**
 * Depth of field configuration
 */
export interface DepthOfFieldConfig {
  enabled: boolean;
  focalDistance: number;
  focalRange: number;
  blurAmount: number;
  bokehSize: number;
}

/**
 * Complete environment data
 */
export interface EnvironmentData {
  location: LocationType;
  timeOfDay: TimeOfDay;
  backgrounds: BackgroundLayer[];
  weather: WeatherEffect;
  lighting: LightingEffect;
  atmosphere: AtmosphereEffect;
  parallaxLayers: ParallaxLayer[];
}

/**
 * Parallax layer configuration
 */
export interface ParallaxLayer {
  id: string;
  depth: number; // 0-1, where 0 is infinite background and 1 is foreground
  sprites: string[];
  scrollFactor: number;
  opacity: number;
}

/**
 * Environment generator configuration
 */
export interface EnvironmentGeneratorConfig {
  canvasWidth: number;
  canvasHeight: number;
  pixelScale: number;
  backgroundColor: IColor;
  defaultTimeOfDay: TimeOfDay;
  defaultWeather: WeatherType;
  enableParallax: boolean;
  enableAtmosphere: boolean;
  enableWeather: boolean;
  enableLighting: boolean;
}

/**
 * Environment preset
 */
export interface EnvironmentPreset {
  name: string;
  location: LocationType;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  lighting: LightingType;
  mood: AtmosphereMood;
}
