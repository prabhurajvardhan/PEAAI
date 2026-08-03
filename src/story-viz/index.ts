/**
 * Story Visualization Engine (M05)
 * 
 * Complete story scene rendering system for PEAAI.
 * 
 * Features:
 * - Story Parser: Parse story text into scene data
 * - Scene Generator: Generate scene content from descriptions
 * - Camera Controller: Camera movements, zoom, and transitions
 * - Character Placement: Position characters in scenes
 * - Environment Generator: Backgrounds, weather, lighting, atmosphere
 * - Scene Renderer: Pixel-perfect scene composition and rendering
 * 
 * @packageDocumentation
 */

// Story Parser
export { StoryParser } from './parser';
export type {
  ParsedStory,
  ParsedScene,
  ExtractedCharacter,
  ExtractedAction,
  EnvironmentDescription,
  CameraAction,
  SceneMetadata,
  StoryParserConfig,
  EmotionExtraction,
  SceneTransitionType,
} from './parser';

// Scene Generator
export { SceneGenerator } from './scene-generator';
export type {
  SceneCharacter,
  SceneEnvironment,
  SceneAction,
  SceneEmotion,
  GeneratedScene,
  GeneratedCamera,
  SceneGeneratorConfig,
  SceneGeneratorResult,
  CharacterExpression,
  CharacterAnimation,
  BackgroundData,
  WeatherData,
  LightingData,
  AtmosphereData,
  TransitionConfig,
} from './scene-generator';

// Camera Controller
export { CameraController } from './camera';
export type {
  CameraState,
  CameraMovement,
  CameraMovementType,
  CameraDirection,
  CameraPreset,
  EasingPreset,
  PanConfig,
  ZoomConfig,
  TrackConfig,
  ShakeConfig,
  CameraControllerConfig,
  CameraBounds,
} from './camera';

// Character Placement
export { CharacterPlacementManager } from './character-placement';
export type {
  CharacterPlacement,
  PlacementPosition,
  ScaleConfig,
  ZLayerConfig,
  LayoutConfig,
  PlacementRule,
  AnchorPoint,
  CharacterBounds,
  PlacementAnimation,
  AnimationKeyframe,
  CharacterPlacementConfig,
} from './character-placement';

// Environment Generator
export { EnvironmentGenerator } from './environment';
export type {
  LocationType,
  TimeOfDay,
  WeatherType,
  LightingType,
  AtmosphereMood,
  BackgroundLayer,
  WeatherEffect,
  WeatherParticle,
  LightingEffect,
  AtmosphereEffect,
  EnvironmentData,
  ParallaxLayer,
  EnvironmentGeneratorConfig,
  EnvironmentPreset,
  ShadowConfig,
  HighlightConfig,
  ColorGradeConfig,
  VignetteConfig,
  GrainConfig,
  DepthOfFieldConfig,
} from './environment';

// Scene Renderer
export { SceneRenderer } from './renderer';
export type {
  RenderLayer,
  RenderLayerData,
  RenderConfig,
  RenderStats,
  TransitionEffect,
  DirtyRegion,
  PixelPerfectOptions,
} from './renderer';
