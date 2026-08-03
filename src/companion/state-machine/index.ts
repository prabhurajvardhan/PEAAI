/**
 * Face State Machine Module - M02 Companion Engine
 * 
 * @packageDocumentation
 */

export { FaceStateMachine, type IFaceStateMachine } from './face-state-machine';
export {
  DEFAULT_STATE_MACHINE_CONFIG,
  FaceState,
  VALID_TRANSITIONS,
  STATE_EMOTION_MAP,
  type IFaceStateMachineConfig,
  type IStateHistoryEntry,
  type IFaceStateContext,
  type IStateChangeEvent,
  type IStateLifecycleEvent,
} from './types';
