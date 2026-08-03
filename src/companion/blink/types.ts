/**
 * Blink Engine Types - M02 Companion Engine
 * 
 * Type definitions for the blink engine.
 */

import type { EmotionType } from '../geometry/types';

/**
 * Blink configuration
 */
export interface IBlinkConfig {
  minInterval: number;      // Minimum time between blinks (seconds)
  maxInterval: number;      // Maximum time between blinks (seconds)
  blinkDuration: number;    // Duration of a single blink (seconds)
  doubleBlinkChance: number; // Chance of double blink (0-1)
  emotionMultiplier: Record<EmotionType, number>; // Blink frequency multiplier per emotion
}

/**
 * Default blink configuration
 */
export const DEFAULT_BLINK_CONFIG: Readonly<IBlinkConfig> = {
  minInterval: 2.0,         // 2 seconds minimum
  maxInterval: 8.0,         // 8 seconds maximum
  blinkDuration: 0.15,     // 150ms for a blink
  doubleBlinkChance: 0.1,   // 10% chance of double blink
  emotionMultiplier: {
    neutral: 1.0,
    happy: 0.8,            // Blink less when happy
    sad: 1.2,              // Blink more when sad
    angry: 1.5,            // Blink more when angry
    surprised: 2.0,        // Blink more when surprised
    thinking: 1.0,
    sleepy: 0.5,           // Blink more slowly when sleepy
    excited: 0.7,          // Blink less when excited
    scared: 1.8,           // Blink more when scared
    disgusted: 1.3,         // Blink more when disgusted
  },
};

/**
 * Blink state
 */
export enum BlinkState {
  Idle = 'idle',
  Closing = 'closing',
  Closed = 'closed',
  Opening = 'opening',
}

/**
 * Blink animation data
 */
export interface IBlinkAnimation {
  state: BlinkState;
  progress: number;       // 0-1 progress through current phase
  eyelidTop: number;      // Top eyelid position (0 = open, 1 = closed)
  eyelidBottom: number;   // Bottom eyelid position (0 = open, 1 = closed)
  isDoubleBlink: boolean;
  secondBlinkDelay: number;
}

/**
 * Blink event data
 */
export interface IBlinkEvent {
  type: 'start' | 'mid' | 'end' | 'double';
  timestamp: number;
  emotion?: EmotionType;
}
