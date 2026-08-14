/**
 * Transition Engine (M06)
 * 
 * Complete transition system for PEAAI companion.
 * 
 * Features:
 * - Face-to-Story Transition: Dissolve face into story
 * - Story-to-Face Transition: Merge story into face
 * - Pixel Morphing: Smooth pixel transformations
 * - Dissolve Effects: Multiple dissolve patterns
 * - Transition Timeline: Coordinate transition timing
 * 
 * @packageDocumentation
 */

// Face-to-Story Transition
export { 
  FaceToStoryTransition, 
  createFaceToStoryTransition 
} from './face-to-story';
export type {
  FaceToStoryState,
  FaceToStoryCallback,
  FaceToStoryOptions,
  FaceToStoryEvent,
  FaceToStoryEventType,
} from './face-to-story';

// Story-to-Face Transition
export { 
  StoryToFaceTransition, 
  createStoryToFaceTransition 
} from './story-to-face';
export type {
  StoryToFaceState,
  StoryToFaceCallback,
  StoryToFaceOptions,
  StoryToFaceEvent,
  StoryToFaceEventType,
} from './story-to-face';

// Pixel Morphing
export { 
  MorphingEngine, 
  createMorphingEngine 
} from './morphing';
export type {
  MorphConfig,
  MorphPoint,
  MorphFrame,
  MorphCallback,
  MorphEventType,
  MorphPresetConfig,
  VertexMorph,
} from './morphing';
export { DEFAULT_MORPH_CONFIG } from './morphing';

// Dissolve Effects
export { 
  DissolveEffectsEngine, 
  createDissolveEngine 
} from './dissolve';
export type {
  DissolveEffectConfig,
  DissolveMask,
  DissolveMaskCell,
  DissolveCallback,
  DissolveEventType,
  GridDissolveCell,
  ParticleDissolveConfig,
  NoiseDissolveConfig,
  DissolvePatternFunction,
} from './dissolve/types';
export { DEFAULT_DISSOLVE_CONFIG } from './dissolve/types';

// Transition Timeline
export { 
  TransitionTimelineController, 
  createTimelineController 
} from './timeline';
export type {
  TimelineConfig,
  TimelineState,
  TimelineCallback,
  TimelineEvent,
  TimelineEventType,
  TimelineSegment,
  TimelineKeyframe,
  TransitionRequest,
  AnimationSyncData,
  ScheduledHook,
} from './timeline';
export { DEFAULT_TIMELINE_CONFIG } from './timeline';

// Types
export {
  DEFAULT_TRANSITION_CONFIG,
  DEFAULT_TRANSITION_TIMING,
} from './types';
export type {
  TransitionMode,
  TransitionPhase,
  TransitionState,
  DissolvePattern,
  MorphPreset,
  TransitionTiming,
  TransitionConfig,
  MorphTarget,
  DissolveParticle,
  DissolveCell,
  TransitionEventType,
  TransitionEvent,
  TransitionHooks,
  TransitionProgressCallback,
  TransitionLifecycleHooks,
  FaceCaptureData,
  SceneCaptureData,
  TransitionFrame,
  FaceToStoryConfig,
  StoryToFaceConfig,
  InterruptReason,
  EasingFunction,
} from './types';

// Main transition orchestrator
export { TransitionEngine } from './transition-engine';
export type {
  TransitionEngineConfig,
  TransitionEngineState,
} from './transition-engine';
