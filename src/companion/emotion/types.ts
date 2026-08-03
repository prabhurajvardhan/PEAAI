/**
 * Emotion Controller Types - M02 Companion Engine
 * 
 * Type definitions for the emotion controller.
 */

import type { IPosition } from '../../graphics/types';
import type { EmotionType, ExpressionType, IFaceState } from '../geometry/types';

/**
 * Emotion configuration
 */
export interface IEmotionConfig {
  transitionDuration: number;     // Duration of emotion transitions (seconds)
  blendEnabled: boolean;            // Enable emotion blending
  maxBlendedEmotions: number;      // Maximum number of emotions to blend
}

/**
 * Default emotion configuration
 */
export const DEFAULT_EMOTION_CONFIG: Readonly<IEmotionConfig> = {
  transitionDuration: 0.5,         // 500ms transition
  blendEnabled: true,
  maxBlendedEmotions: 3,
};

/**
 * Emotion expression mapping
 */
export interface IEmotionExpression {
  emotion: EmotionType;
  eyeOpenness: number;
  pupilDirection: IPosition;
  mouthOpenness: number;
  mouthCurve: number;
  eyebrowRaise: number;
  cheekRaise: number;
  eyebrowTilt: number;             // -1 = angry, 0 = neutral, 1 = worried
  blinkRate: number;              // Multiplier for blink frequency
}

/**
 * Predefined emotion expressions (10 emotions)
 */
export const EMOTION_EXPRESSIONS: Record<EmotionType, IEmotionExpression> = {
  neutral: {
    emotion: 'neutral',
    eyeOpenness: 1.0,
    pupilDirection: { x: 0, y: 0 },
    mouthOpenness: 0.0,
    mouthCurve: 0.0,
    eyebrowRaise: 0.0,
    cheekRaise: 0.0,
    eyebrowTilt: 0.0,
    blinkRate: 1.0,
  },
  happy: {
    emotion: 'happy',
    eyeOpenness: 0.9,
    pupilDirection: { x: 0, y: 0 },
    mouthOpenness: 0.0,
    mouthCurve: 0.8,
    eyebrowRaise: 0.1,
    cheekRaise: 0.6,
    eyebrowTilt: 0.0,
    blinkRate: 0.7,
  },
  sad: {
    emotion: 'sad',
    eyeOpenness: 0.7,
    pupilDirection: { x: 0, y: 0.2 },
    mouthOpenness: 0.1,
    mouthCurve: -0.5,
    eyebrowRaise: -0.2,
    cheekRaise: 0.0,
    eyebrowTilt: 0.3,
    blinkRate: 1.3,
  },
  angry: {
    emotion: 'angry',
    eyeOpenness: 0.9,
    pupilDirection: { x: 0, y: 0 },
    mouthOpenness: 0.0,
    mouthCurve: -0.3,
    eyebrowRaise: -0.3,
    cheekRaise: 0.0,
    eyebrowTilt: -0.6,
    blinkRate: 1.5,
  },
  surprised: {
    emotion: 'surprised',
    eyeOpenness: 1.0,
    pupilDirection: { x: 0, y: -0.2 },
    mouthOpenness: 0.6,
    mouthCurve: 0.0,
    eyebrowRaise: 0.6,
    cheekRaise: 0.0,
    eyebrowTilt: 0.0,
    blinkRate: 2.0,
  },
  thinking: {
    emotion: 'thinking',
    eyeOpenness: 0.6,
    pupilDirection: { x: 0.3, y: -0.1 },
    mouthOpenness: 0.0,
    mouthCurve: 0.0,
    eyebrowRaise: 0.2,
    cheekRaise: 0.0,
    eyebrowTilt: 0.2,
    blinkRate: 1.0,
  },
  sleepy: {
    emotion: 'sleepy',
    eyeOpenness: 0.3,
    pupilDirection: { x: 0, y: 0.3 },
    mouthOpenness: 0.0,
    mouthCurve: 0.1,
    eyebrowRaise: 0.0,
    cheekRaise: 0.2,
    eyebrowTilt: 0.0,
    blinkRate: 0.5,
  },
  excited: {
    emotion: 'excited',
    eyeOpenness: 1.0,
    pupilDirection: { x: 0, y: -0.1 },
    mouthOpenness: 0.3,
    mouthCurve: 0.9,
    eyebrowRaise: 0.5,
    cheekRaise: 0.8,
    eyebrowTilt: 0.0,
    blinkRate: 0.6,
  },
  scared: {
    emotion: 'scared',
    eyeOpenness: 1.0,
    pupilDirection: { x: 0, y: -0.3 },
    mouthOpenness: 0.4,
    mouthCurve: -0.2,
    eyebrowRaise: 0.7,
    cheekRaise: 0.0,
    eyebrowTilt: 0.5,
    blinkRate: 1.8,
  },
  disgusted: {
    emotion: 'disgusted',
    eyeOpenness: 0.6,
    pupilDirection: { x: 0, y: 0 },
    mouthOpenness: 0.3,
    mouthCurve: -0.3,
    eyebrowRaise: 0.0,
    cheekRaise: 0.3,
    eyebrowTilt: -0.3,
    blinkRate: 1.2,
  },
};

/**
 * Blended emotion
 */
export interface IBlendedEmotion {
  emotion: EmotionType;
  weight: number;  // 0-1, weight in the blend
}

/**
 * Emotion transition state
 */
export interface IEmotionTransition {
  from: EmotionType;
  to: EmotionType;
  progress: number;  // 0-1
  isBlending: boolean;
}

/**
 * Emotion event data
 */
export interface IEmotionEvent {
  type: 'change' | 'transition_start' | 'transition_end' | 'blend_start' | 'blend_end';
  emotion: EmotionType;
  previousEmotion?: EmotionType;
  blendedEmotions?: IBlendedEmotion[];
}
