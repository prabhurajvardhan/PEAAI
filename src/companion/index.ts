/**
 * Companion Engine (M02) - Main Export
 * 
 * The Companion Engine generates and animates the AI companion face.
 * 
 * Features:
 * - Face Geometry Engine: 32x32 pixel face grid definition
 * - Eye Engine: Eye rendering, pupil movement, eye states
 * - Mouth Engine: Mouth rendering, shape variations
 * - Blink Engine: Random blink timing, eyelid animation
 * - Idle Behaviour: Breathing, subtle movements when idle
 * - Emotion Controller: Emotion-to-expression mapping
 * - Face State Machine: Face state transitions
 * 
 * @packageDocumentation
 */

// Geometry module
export {
  FaceGeometryEngine,
  DEFAULT_FACE_GRID_SIZE,
  DEFAULT_FACE_STATE,
  EyeState,
  MouthState,
  PupilDirection,
} from './geometry';
export type {
  IFaceGeometry,
  IFaceState,
  IEyeRegion,
  IMouthRegion,
  IFaceRegion,
  IFaceGeometryConfig,
  IFeatureBounds,
  EmotionType,
  ExpressionType,
} from './geometry';

// Eye module
export { EyeEngine } from './eye';
export type {
  IEyeEngine,
  IEyeConfig,
  IEyeRenderData,
  IEyeAnimationState,
  ILookingDirection,
  IEyeEvents,
} from './eye';

// Mouth module
export { MouthEngine, MOUTH_EXPRESSIONS, PHONEME_MAP } from './mouth';
export type {
  IMouthEngine,
  IMouthConfig,
  MouthShape,
  IMouthRenderData,
  IMouthExpression,
  ILipSyncData,
} from './mouth';

// Blink module
export { BlinkEngine, BlinkState } from './blink';
export type {
  IBlinkEngine,
  IBlinkConfig,
  IBlinkAnimation,
  IBlinkEvent,
} from './blink';

// Idle module
export { IdleEngine, IdleState, LOOK_TARGETS, IDLE_EXPRESSIONS } from './idle';
export type {
  IIdleEngine,
  IIdleConfig,
  IIdleAnimation,
  ILookTarget,
  IIdleExpression,
} from './idle';

// Emotion module
export { EmotionController, EMOTION_EXPRESSIONS } from './emotion';
export type {
  IEmotionController,
  IEmotionConfig,
  IEmotionExpression,
  IBlendedEmotion,
  IEmotionTransition,
  IEmotionEvent,
} from './emotion';

// State Machine module
export { FaceStateMachine, FaceState, VALID_TRANSITIONS, STATE_EMOTION_MAP } from './state-machine';
export type {
  IFaceStateMachine,
  IFaceStateMachineConfig,
  IStateHistoryEntry,
  IFaceStateContext,
  IStateChangeEvent,
  IStateLifecycleEvent,
} from './state-machine';
