/**
 * Story-to-Face Transition Types
 */

import type { IFaceState } from '../../companion/geometry/types';
import type { GeneratedScene } from '../../story-viz/scene-generator/types';
import type { 
  TransitionConfig, 
  StoryToFaceConfig, 
  SceneCaptureData, 
  TransitionPhase,
  DissolveCell 
} from '../types';

/**
 * Story-to-face transition events
 */
export type StoryToFaceEventType = 
  | 'sceneCapture'
  | 'pixelMerging'
  | 'faceFadeIn'
  | 'timingControl'
  | 'complete';

/**
 * Story-to-face transition event
 */
export interface StoryToFaceEvent {
  type: StoryToFaceEventType;
  progress: number;
  timestamp: number;
  data?: unknown;
}

/**
 * Story-to-face transition state
 */
export interface StoryToFaceState {
  phase: TransitionPhase;
  progress: number;
  sceneCaptured: boolean;
  mergeProgress: number;
  faceVisible: boolean;
}

/**
 * Story-to-face transition callback
 */
export type StoryToFaceCallback = (state: StoryToFaceState) => void;

/**
 * Story-to-face transition options
 */
export interface StoryToFaceOptions {
  config?: Partial<StoryToFaceConfig>;
  captureScene?: () => Promise<SceneCaptureData>;
  onProgress?: StoryToFaceCallback;
  onComplete?: () => void;
}
