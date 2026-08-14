/**
 * Face-to-Story Transition Types
 */

import type { IFaceState } from '../../companion/geometry/types';
import type { GeneratedScene } from '../../story-viz/scene-generator/types';
import type { 
  TransitionConfig, 
  FaceToStoryConfig, 
  FaceCaptureData, 
  TransitionPhase,
  DissolveCell 
} from '../types';

/**
 * Face-to-story transition events
 */
export type FaceToStoryEventType = 
  | 'faceCapture'
  | 'pixelDissolve'
  | 'storyFadeIn'
  | 'timingControl'
  | 'complete';

/**
 * Face-to-story transition event
 */
export interface FaceToStoryEvent {
  type: FaceToStoryEventType;
  progress: number;
  timestamp: number;
  data?: unknown;
}

/**
 * Face-to-story transition state
 */
export interface FaceToStoryState {
  phase: TransitionPhase;
  progress: number;
  faceCaptured: boolean;
  dissolveProgress: number;
  storyVisible: boolean;
}

/**
 * Face-to-story transition callback
 */
export type FaceToStoryCallback = (state: FaceToStoryState) => void;

/**
 * Face-to-story transition options
 */
export interface FaceToStoryOptions {
  config?: Partial<FaceToStoryConfig>;
  captureFace?: () => Promise<FaceCaptureData>;
  onProgress?: FaceToStoryCallback;
  onComplete?: () => void;
}
