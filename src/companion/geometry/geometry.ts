/**
 * Face Geometry Engine - M02 Companion Engine
 * 
 * Features:
 * - 32x32 pixel face grid definition
 * - Feature positions for eyes, mouth, eyebrows, etc.
 * - Scalable design for larger grids
 * - Face state interface
 */

import type { IPosition } from '../../graphics/types';
import {
  DEFAULT_FACE_GRID_SIZE,
  DEFAULT_FACE_STATE,
  type IFaceState,
  type IEyeRegion,
  type IMouthRegion,
  type IFaceRegion,
  type IFaceGeometryConfig,
  type IFeatureBounds,
  EyeState,
  MouthState,
} from './types';

/**
 * Face Geometry Engine interface
 */
export interface IFaceGeometry {
  readonly GRID_SIZE: number;
  readonly EYE_LEFT: IPosition;
  readonly EYE_RIGHT: IPosition;
  readonly MOUTH: IPosition;
  readonly EYEBROW_LEFT: IPosition;
  readonly EYEBROW_RIGHT: IPosition;
  readonly NOSE: IPosition;
  readonly CHEEK_LEFT: IPosition;
  readonly CHEEK_RIGHT: IPosition;
  readonly EYE_REGION: IEyeRegion;
  readonly MOUTH_REGION: IMouthRegion;
  readonly FACE_REGION: IFaceRegion;
  
  getEyeBounds(state: IFaceState): { left: IFeatureBounds; right: IFeatureBounds };
  getMouthBounds(state: IFaceState): IFeatureBounds;
  getEyebrowBounds(): { left: IFeatureBounds; right: IFeatureBounds };
  getFaceBounds(): IFeatureBounds;
  getEyePixelPositions(state: IFaceState): { left: IPosition[]; right: IPosition[] };
  getMouthPixelPositions(state: IFaceState): IPosition[];
  calculatePupilPosition(direction: IPosition, state: IFaceState): { left: IPosition; right: IPosition };
  getDefaultState(): IFaceState;
}

/**
 * Default face geometry configuration for 32x32 grid
 * 
 * Face layout (32x32 grid):
 * - Eyes positioned at roughly y=12, x=10 and x=21
 * - Mouth positioned at y=22
 * - Face is centered with some padding
 */
function createDefaultConfig(gridSize: number): IFaceGeometryConfig {
  const scale = gridSize / DEFAULT_FACE_GRID_SIZE;
  
  return {
    gridSize,
    eyeRegion: {
      left: { x: Math.floor(10 * scale), y: Math.floor(12 * scale) },
      right: { x: Math.floor(21 * scale), y: Math.floor(12 * scale) },
      width: Math.floor(6 * scale),
      height: Math.floor(4 * scale),
      pupilOffset: { x: 0, y: 0 },
    },
    mouthRegion: {
      position: { x: Math.floor(16 * scale), y: Math.floor(22 * scale) },
      width: Math.floor(8 * scale),
      height: Math.floor(3 * scale),
    },
    faceRegion: {
      eyes: {
        left: { x: Math.floor(10 * scale), y: Math.floor(12 * scale) },
        right: { x: Math.floor(21 * scale), y: Math.floor(12 * scale) },
        width: Math.floor(6 * scale),
        height: Math.floor(4 * scale),
        pupilOffset: { x: 0, y: 0 },
      },
      mouth: {
        position: { x: Math.floor(16 * scale), y: Math.floor(22 * scale) },
        width: Math.floor(8 * scale),
        height: Math.floor(3 * scale),
      },
      eyebrowLeft: { x: Math.floor(10 * scale), y: Math.floor(9 * scale) },
      eyebrowRight: { x: Math.floor(21 * scale), y: Math.floor(9 * scale) },
      nose: { x: Math.floor(16 * scale), y: Math.floor(17 * scale) },
      cheekLeft: { x: Math.floor(7 * scale), y: Math.floor(18 * scale) },
      cheekRight: { x: Math.floor(24 * scale), y: Math.floor(18 * scale) },
    },
  };
}

/**
 * Face Geometry Engine implementation
 */
export class FaceGeometryEngine implements IFaceGeometry {
  public readonly GRID_SIZE: number;
  public readonly EYE_LEFT: IPosition;
  public readonly EYE_RIGHT: IPosition;
  public readonly MOUTH: IPosition;
  public readonly EYEBROW_LEFT: IPosition;
  public readonly EYEBROW_RIGHT: IPosition;
  public readonly NOSE: IPosition;
  public readonly CHEEK_LEFT: IPosition;
  public readonly CHEEK_RIGHT: IPosition;
  public readonly EYE_REGION: IEyeRegion;
  public readonly MOUTH_REGION: IMouthRegion;
  public readonly FACE_REGION: IFaceRegion;
  
  private readonly config: IFaceGeometryConfig;

  constructor(gridSize: number = DEFAULT_FACE_GRID_SIZE) {
    if (gridSize < 16 || gridSize > 128) {
      throw new Error('Grid size must be between 16 and 128');
    }
    
    this.GRID_SIZE = gridSize;
    this.config = createDefaultConfig(gridSize);
    
    // Set feature positions
    this.EYE_LEFT = this.config.eyeRegion.left;
    this.EYE_RIGHT = this.config.eyeRegion.right;
    this.MOUTH = this.config.mouthRegion.position;
    this.EYEBROW_LEFT = this.config.faceRegion.eyebrowLeft;
    this.EYEBROW_RIGHT = this.config.faceRegion.eyebrowRight;
    this.NOSE = this.config.faceRegion.nose;
    this.CHEEK_LEFT = this.config.faceRegion.cheekLeft;
    this.CHEEK_RIGHT = this.config.faceRegion.cheekRight;
    this.EYE_REGION = this.config.eyeRegion;
    this.MOUTH_REGION = this.config.mouthRegion;
    this.FACE_REGION = this.config.faceRegion;
  }

  /**
   * Get bounding boxes for eyes based on current state
   */
  getEyeBounds(state: IFaceState): { left: IFeatureBounds; right: IFeatureBounds } {
    const scale = this.GRID_SIZE / DEFAULT_FACE_GRID_SIZE;
    const eyeHeight = Math.floor(this.EYE_REGION.height * state.eyeOpenness);
    const eyeWidth = Math.floor(this.EYE_REGION.width * scale);
    
    return {
      left: {
        x: this.EYE_LEFT.x,
        y: this.EYE_LEFT.y,
        width: eyeWidth,
        height: Math.max(1, eyeHeight),
      },
      right: {
        x: this.EYE_RIGHT.x,
        y: this.EYE_RIGHT.y,
        width: eyeWidth,
        height: Math.max(1, eyeHeight),
      },
    };
  }

  /**
   * Get bounding box for mouth based on current state
   */
  getMouthBounds(state: IFaceState): IFeatureBounds {
    const scale = this.GRID_SIZE / DEFAULT_FACE_GRID_SIZE;
    const mouthHeight = Math.floor(
      this.MOUTH_REGION.height * (0.3 + state.mouthOpenness * 0.7) * scale
    );
    
    return {
      x: this.MOUTH.x - Math.floor(this.MOUTH_REGION.width * scale / 2),
      y: this.MOUTH.y,
      width: Math.floor(this.MOUTH_REGION.width * scale),
      height: Math.max(1, mouthHeight),
    };
  }

  /**
   * Get bounding boxes for eyebrows
   */
  getEyebrowBounds(): { left: IFeatureBounds; right: IFeatureBounds } {
    const scale = this.GRID_SIZE / DEFAULT_FACE_GRID_SIZE;
    const eyebrowWidth = Math.floor(5 * scale);
    const eyebrowHeight = Math.floor(1 * scale);
    
    return {
      left: {
        x: this.EYEBROW_LEFT.x,
        y: this.EYEBROW_LEFT.y - Math.floor(eyebrowHeight * 0.5),
        width: eyebrowWidth,
        height: eyebrowHeight,
      },
      right: {
        x: this.EYEBROW_RIGHT.x,
        y: this.EYEBROW_RIGHT.y - Math.floor(eyebrowHeight * 0.5),
        width: eyebrowWidth,
        height: eyebrowHeight,
      },
    };
  }

  /**
   * Get overall face bounding box
   */
  getFaceBounds(): IFeatureBounds {
    const scale = this.GRID_SIZE / DEFAULT_FACE_GRID_SIZE;
    const padding = Math.floor(2 * scale);
    
    return {
      x: padding,
      y: padding,
      width: this.GRID_SIZE - padding * 2,
      height: this.GRID_SIZE - padding * 2,
    };
  }

  /**
   * Get all pixel positions for eyes based on state
   */
  getEyePixelPositions(state: IFaceState): { left: IPosition[]; right: IPosition[] } {
    const eyeBounds = this.getEyeBounds(state);
    const leftPixels: IPosition[] = [];
    const rightPixels: IPosition[] = [];
    
    // Generate left eye pixels
    for (let y = 0; y < eyeBounds.left.height; y++) {
      for (let x = 0; x < eyeBounds.left.width; x++) {
        leftPixels.push({
          x: eyeBounds.left.x + x,
          y: eyeBounds.left.y + y,
        });
      }
    }
    
    // Generate right eye pixels
    for (let y = 0; y < eyeBounds.right.height; y++) {
      for (let x = 0; x < eyeBounds.right.width; x++) {
        rightPixels.push({
          x: eyeBounds.right.x + x,
          y: eyeBounds.right.y + y,
        });
      }
    }
    
    return { left: leftPixels, right: rightPixels };
  }

  /**
   * Get all pixel positions for mouth based on state
   */
  getMouthPixelPositions(state: IFaceState): IPosition[] {
    const mouthBounds = this.getMouthBounds(state);
    const pixels: IPosition[] = [];
    
    for (let y = 0; y < mouthBounds.height; y++) {
      for (let x = 0; x < mouthBounds.width; x++) {
        pixels.push({
          x: mouthBounds.x + x,
          y: mouthBounds.y + y,
        });
      }
    }
    
    return pixels;
  }

  /**
   * Calculate pupil positions based on look direction
   */
  calculatePupilPosition(
    direction: IPosition,
    state: IFaceState
  ): { left: IPosition; right: IPosition } {
    const scale = this.GRID_SIZE / DEFAULT_FACE_GRID_SIZE;
    const maxOffset = Math.floor(2 * scale);
    
    // Clamp direction to -1 to 1 range
    const clampedDirection = {
      x: Math.max(-1, Math.min(1, direction.x)),
      y: Math.max(-1, Math.min(1, direction.y)),
    };
    
    // Apply pupil offset based on direction
    const pupilOffset = {
      x: Math.round(clampedDirection.x * maxOffset),
      y: Math.round(clampedDirection.y * maxOffset),
    };
    
    return {
      left: {
        x: this.EYE_LEFT.x + Math.floor(this.EYE_REGION.width * scale / 2) + pupilOffset.x,
        y: this.EYE_LEFT.y + Math.floor(this.EYE_REGION.height / 2) + pupilOffset.y,
      },
      right: {
        x: this.EYE_RIGHT.x + Math.floor(this.EYE_REGION.width * scale / 2) + pupilOffset.x,
        y: this.EYE_RIGHT.y + Math.floor(this.EYE_REGION.height / 2) + pupilOffset.y,
      },
    };
  }

  /**
   * Get default face state
   */
  getDefaultState(): IFaceState {
    return { ...DEFAULT_FACE_STATE };
  }

  /**
   * Convert EyeState enum to openness value
   */
  static eyeStateToOpenness(state: EyeState): number {
    switch (state) {
      case EyeState.Open:
        return 1.0;
      case EyeState.HalfOpen:
        return 0.5;
      case EyeState.Closed:
        return 0.0;
      case EyeState.Squinting:
        return 0.3;
      case EyeState.Wide:
        return 1.0;
      default:
        return 1.0;
    }
  }

  /**
   * Convert MouthState enum to openness and curve values
   */
  static mouthStateToValues(state: MouthState): { openness: number; curve: number } {
    switch (state) {
      case MouthState.Closed:
        return { openness: 0.0, curve: 0.0 };
      case MouthState.SlightlyOpen:
        return { openness: 0.3, curve: 0.0 };
      case MouthState.Open:
        return { openness: 0.6, curve: 0.0 };
      case MouthState.WideOpen:
        return { openness: 1.0, curve: 0.0 };
      default:
        return { openness: 0.0, curve: 0.0 };
    }
  }
}

export default FaceGeometryEngine;
