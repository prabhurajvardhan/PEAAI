/**
 * Dissolve Effects Module
 * 
 * Handles various dissolve effects for pixel transitions.
 */

export { DissolveEffectsEngine, createDissolveEngine } from './dissolve-engine';
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
} from './types';
export { DEFAULT_DISSOLVE_CONFIG } from './types';
