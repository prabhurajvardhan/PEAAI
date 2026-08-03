/**
 * Mouth Engine - M02 Companion Engine
 * 
 * Features:
 * - Mouth sprite rendering
 * - Open/closed states
 * - Expression shapes (smile, neutral, frown)
 * - Lip sync capability
 * - Emotion-reactive expressions
 */

import type { IPosition } from '../../graphics/types';
import type { IFaceGeometry } from '../geometry/geometry';
import {
  FaceGeometryEngine,
  MouthState,
  type IFaceState,
} from '../geometry';
import {
  DEFAULT_MOUTH_CONFIG,
  type IMouthConfig,
  type MouthShape,
  type IMouthRenderData,
  type IMouthExpression,
  type ILipSyncData,
  type IEyeRenderData,
  MOUTH_EXPRESSIONS,
  PHONEME_MAP,
} from './types';

/**
 * Mouth Engine interface
 */
export interface IMouthEngine {
  setExpression(expression: keyof typeof MOUTH_EXPRESSIONS): void;
  setMouthState(state: MouthState): void;
  setLipSync(data: ILipSyncData): void;
  getCurrentExpression(): string;
  getMouthRenderData(state: IFaceState): IMouthRenderData;
  getMouthPixelPositions(state: IFaceState): IPosition[];
  update(deltaTime: number): void;
}

/**
 * Mouth Engine implementation
 */
export class MouthEngine implements IMouthEngine {
  private readonly geometry: IFaceGeometry;
  private readonly config: IMouthConfig;
  
  private currentExpression: keyof typeof MOUTH_EXPRESSIONS = 'neutral';
  private targetExpression: keyof typeof MOUTH_EXPRESSIONS = 'neutral';
  private transitionProgress: number = 1.0;
  
  private lipSyncData: ILipSyncData | null = null;
  private lipSyncIntensity: number = 0;
  
  private expressionValues: {
    openness: number;
    curve: number;
    showTeeth: boolean;
    showTongue: boolean;
  };

  constructor(geometry?: IFaceGeometry, config?: Partial<IMouthConfig>) {
    this.geometry = geometry || new FaceGeometryEngine();
    this.config = { ...DEFAULT_MOUTH_CONFIG, ...config };
    this.expressionValues = { ...MOUTH_EXPRESSIONS.neutral };
  }

  /**
   * Set mouth expression
   */
  setExpression(expression: keyof typeof MOUTH_EXPRESSIONS): void {
    if (this.currentExpression !== expression) {
      this.currentExpression = expression;
      this.targetExpression = expression;
      this.expressionValues = { ...MOUTH_EXPRESSIONS[expression] };
      this.transitionProgress = 1.0;
    }
  }

  /**
   * Set mouth state (legacy support)
   */
  setMouthState(state: MouthState): void {
    const { openness, curve } = FaceGeometryEngine.mouthStateToValues(state);
    this.expressionValues.openness = openness;
    this.expressionValues.curve = curve;
  }

  /**
   * Set lip sync data
   */
  setLipSync(data: ILipSyncData): void {
    this.lipSyncData = data;
    this.lipSyncIntensity = 1.0;
  }

  /**
   * Clear lip sync
   */
  clearLipSync(): void {
    this.lipSyncData = null;
    this.lipSyncIntensity = 0;
  }

  /**
   * Get current expression name
   */
  getCurrentExpression(): string {
    return this.currentExpression;
  }

  /**
   * Get mouth render data for the current state
   */
  getMouthRenderData(state: IFaceState): IMouthRenderData {
    const mouthBounds = this.geometry.getMouthBounds(state);
    
    // Combine expression with face state
    const openness = this.blendValues(
      this.expressionValues.openness,
      state.mouthOpenness,
      this.lipSyncIntensity
    );
    
    const curve = this.blendValues(
      this.expressionValues.curve,
      state.mouthCurve,
      this.lipSyncIntensity
    );
    
    // Determine shape based on openness and curve
    const shape = this.determineShape(openness, curve);
    
    // Apply lip sync adjustments
    let adjustedOpenness = openness;
    let adjustedWidth = mouthBounds.width;
    if (this.lipSyncData && this.lipSyncIntensity > 0) {
      adjustedOpenness = this.lerp(
        openness,
        this.lipSyncData.mouthOpenness,
        this.lipSyncIntensity * 0.7
      );
      adjustedWidth = Math.floor(
        mouthBounds.width * this.lerp(1, this.lipSyncData.mouthWidth, this.lipSyncIntensity * 0.5)
      );
    }
    
    return {
      bounds: {
        ...mouthBounds,
        width: adjustedWidth,
      },
      shape,
      openness: adjustedOpenness,
      curve,
      lipPositions: this.generateLipPositions(shape, adjustedOpenness, curve, adjustedWidth),
      showTeeth: this.expressionValues.showTeeth || (this.lipSyncIntensity > 0.5 && adjustedOpenness > 0.3),
      showTongue: this.expressionValues.showTongue || (this.lipSyncData?.tonguePosition || 0) > 0.3,
    };
  }

  /**
   * Get all pixel positions for the mouth
   */
  getMouthPixelPositions(state: IFaceState): IPosition[] {
    const mouthBounds = this.geometry.getMouthBounds(state);
    const renderData = this.getMouthRenderData(state);
    const pixels: IPosition[] = [];
    
    // Generate mouth pixels based on shape
    const centerX = mouthBounds.x + Math.floor(mouthBounds.width / 2);
    const startY = mouthBounds.y;
    const endY = startY + mouthBounds.height;
    
    for (let y = startY; y < endY; y++) {
      for (let x = mouthBounds.x; x < mouthBounds.x + mouthBounds.width; x++) {
        const relativeX = x - centerX;
        const relativeY = y - startY;
        const halfHeight = Math.floor(mouthBounds.height / 2);
        
        // Apply curve-based shaping
        const curveOffset = Math.floor(
          this.expressionValues.curve * halfHeight * 
          (1 - Math.abs(relativeX) / (mouthBounds.width / 2))
        );
        
        // Check if pixel is within mouth opening
        const adjustedY = relativeY + curveOffset;
        if (adjustedY >= 0 && adjustedY < mouthBounds.height) {
          pixels.push({ x, y });
        }
      }
    }
    
    return pixels;
  }

  /**
   * Update mouth animation state
   */
  update(deltaTime: number): void {
    // Handle expression transitions
    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(1.0, this.transitionProgress + deltaTime * 5);
    }
    
    // Handle lip sync fade
    if (this.lipSyncIntensity > 0) {
      this.lipSyncIntensity = Math.max(0, this.lipSyncIntensity - deltaTime * 2);
    }
  }

  /**
   * Generate lip outline positions
   */
  private generateLipPositions(
    shape: MouthShape,
    openness: number,
    curve: number,
    width: number
  ): IPosition[] {
    const positions: IPosition[] = [];
    const lipWidth = Math.floor(width * 0.9);
    const lipHeight = Math.max(1, Math.floor(1 + openness));
    
    // This is a simplified representation - actual implementation
    // would generate proper lip shapes based on the curve
    for (let x = -lipWidth / 2; x < lipWidth / 2; x++) {
      // Top lip
      const topY = Math.floor(curve * lipHeight);
      positions.push({ x: Math.floor(width / 2) + x, y: topY });
      
      // Bottom lip
      const bottomY = Math.floor(lipHeight * (1 + curve));
      positions.push({ x: Math.floor(width / 2) + x, y: bottomY });
    }
    
    return positions;
  }

  /**
   * Determine mouth shape from openness and curve values
   */
  private determineShape(openness: number, curve: number): MouthShape {
    if (openness > 0.5) {
      return 'open';
    } else if (curve > 0.3) {
      return curve > 0.6 ? 'big_smile' : 'smile';
    } else if (curve < -0.3) {
      return 'frown';
    } else if (openness > 0.2) {
      return 'small_smile';
    }
    return 'neutral';
  }

  /**
   * Blend two values based on intensity
   */
  private blendValues(base: number, target: number, intensity: number): number {
    return this.lerp(base, target, intensity);
  }

  /**
   * Linear interpolation
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Get current expression values
   */
  getExpressionValues(): typeof this.expressionValues {
    return { ...this.expressionValues };
  }

  /**
   * Set custom expression with values
   */
  setCustomExpression(values: Partial<IMouthExpression>): void {
    this.expressionValues = {
      openness: values.openness ?? this.expressionValues.openness,
      curve: values.curve ?? this.expressionValues.curve,
      showTeeth: values.showTeeth ?? this.expressionValues.showTeeth,
      showTongue: values.showTongue ?? this.expressionValues.showTongue,
    };
    this.currentExpression = 'neutral';
    this.targetExpression = 'neutral';
  }
}

export default MouthEngine;
