/**
 * Pixel Morphing Module
 * 
 * Handles smooth pixel transformations during transitions.
 */

export { MorphingEngine, createMorphingEngine } from './morphing-engine';
export type {
  MorphConfig,
  MorphPoint,
  MorphFrame,
  MorphCallback,
  MorphEventType,
  MorphPresetConfig,
  VertexMorph,
} from './types';
export { DEFAULT_MORPH_CONFIG } from './types';
