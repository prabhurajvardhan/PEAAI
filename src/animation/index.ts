/**
 * Animation Engine (M04)
 * 
 * Complete animation system for PEAAI companion.
 * 
 * Features:
 * - Timeline Engine: Frame-based animation management
 * - Keyframe Engine: Keyframe definition and interpolation
 * - Interpolation Engine: 34+ easing functions
 * - Animation Queue: Priority-based concurrent animation management
 * - Particle System: Physics-based particle effects
 * - Animation Generator: High-level animation creation
 * 
 * @packageDocumentation
 */

// Timeline Engine
export { TimelineEngine, IAnimationTimeline } from './timeline';
export type { TimelineConfig } from './timeline';

// Keyframe Engine
export { KeyframeEngine, KeyframeSequenceManager, IKeyframeEngine, IKeyframe } from './keyframe';
export type { KeyframeSequence, KeyframeEngineConfig } from './keyframe';

// Interpolation Engine
export { InterpolationEngine } from './interpolation';

// Animation Queue
export { AnimationQueue, IAnimationQueue, IAnimation } from './queue';
export type { QueueConfig } from './queue';

// Particle System
export { ParticleEmitter, ParticleSystem, IParticleEmitter } from './particle';
export type { ParticleData, ParticleEmitterConfig } from './particle';

// Animation Generator
export { AnimationGenerator } from './generator';
export type {
  ExpressionType,
  ExpressionState,
  AnimationTarget,
  AnimationGeneratorConfig,
} from './generator';

// Types
export * from './types';
