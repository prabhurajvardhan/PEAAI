/**
 * Pixel Morphing Engine
 * 
 * Handles smooth pixel transformations during transitions.
 * 
 * Features:
 * - Vertex morphing
 * - Pixel displacement
 * - Morph presets
 * - Easing control
 */

import type { IPosition } from '../../graphics/types';
import type { MorphPreset, EasingFunction, MorphTarget } from '../types';
import type { 
  MorphConfig, 
  MorphPoint, 
  MorphFrame,
  MorphCallback,
  MorphPresetConfig,
  DEFAULT_MORPH_CONFIG,
} from './types';

/**
 * Pixel Morphing Engine
 */
export class MorphingEngine {
  private config: MorphConfig;
  private gridWidth: number = 32;
  private gridHeight: number = 32;
  private morphPoints: MorphPoint[] = [];
  private isActive: boolean = false;
  private callbacks: Set<MorphCallback> = new Set();

  constructor(config?: Partial<MorphConfig>) {
    this.config = {
      preset: config?.preset ?? 'none',
      easing: config?.easing ?? ((t) => t),
      intensity: config?.intensity ?? 1.0,
      iterations: config?.iterations ?? 1,
      vertexDensity: config?.vertexDensity ?? 4,
    };
  }

  /**
   * Initialize morph points for the given grid size
   */
  initialize(width: number, height: number): void {
    this.gridWidth = width;
    this.gridHeight = height;
    this.morphPoints = [];
    
    const { vertexDensity } = this.config;
    const stepX = width / vertexDensity;
    const stepY = height / vertexDensity;
    
    for (let y = 0; y <= vertexDensity; y++) {
      for (let x = 0; x <= vertexDensity; x++) {
        const px = x * stepX;
        const py = y * stepY;
        
        this.morphPoints.push({
          x: px,
          y: py,
          originalX: px,
          originalY: py,
          displacement: { x: 0, y: 0 },
          weight: 1,
        });
      }
    }
  }

  /**
   * Apply morphing to create displacement map
   */
  applyMorph(progress: number): MorphTarget[] {
    if (!this.isActive) {
      return [];
    }

    const { preset, easing, intensity } = this.config;
    const easedProgress = easing(progress) * intensity;
    const targets: MorphTarget[] = [];
    
    // Apply preset-based morphing
    switch (preset) {
      case 'warp':
        this.applyWarp(easedProgress, targets);
        break;
      case 'ripple':
        this.applyRipple(easedProgress, targets);
        break;
      case 'twist':
        this.applyTwist(easedProgress, targets);
        break;
      case 'bulge':
        this.applyBulge(easedProgress, targets);
        break;
      case 'implode':
        this.applyImplode(easedProgress, targets);
        break;
      case 'explode':
        this.applyExplode(easedProgress, targets);
        break;
      default:
        // No morphing
        break;
    }
    
    return targets;
  }

  /**
   * Apply warp effect
   */
  private applyWarp(progress: number, targets: MorphTarget[]): void {
    const centerX = this.gridWidth / 2;
    const centerY = this.gridHeight / 2;
    const strength = 0.3 * progress;
    
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
        const factor = (1 - dist / maxDist) * strength;
        
        targets.push({
          x,
          y,
          dx: dx * factor,
          dy: dy * factor,
          alpha: 1,
        });
      }
    }
  }

  /**
   * Apply ripple effect
   */
  private applyRipple(progress: number, targets: MorphTarget[]): void {
    const centerX = this.gridWidth / 2;
    const centerY = this.gridHeight / 2;
    const amplitude = 3 * progress;
    const wavelength = 5;
    const speed = 2;
    
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const wave = Math.sin((dist / wavelength) + progress * Math.PI * speed);
        
        targets.push({
          x,
          y,
          dx: 0,
          dy: wave * amplitude,
          alpha: 1,
        });
      }
    }
  }

  /**
   * Apply twist effect
   */
  private applyTwist(progress: number, targets: MorphTarget[]): void {
    const centerX = this.gridWidth / 2;
    const centerY = this.gridHeight / 2;
    const maxAngle = Math.PI * progress;
    
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
        
        // Angle increases with distance from center
        const angle = maxAngle * (dist / maxDist);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        targets.push({
          x,
          y,
          dx: dx * (cos - 1) - dy * sin,
          dy: dx * sin + dy * (cos - 1),
          alpha: 1,
        });
      }
    }
  }

  /**
   * Apply bulge effect
   */
  private applyBulge(progress: number, targets: MorphTarget[]): void {
    const centerX = this.gridWidth / 2;
    const centerY = this.gridHeight / 2;
    const radius = this.gridWidth * 0.4;
    const strength = 2.0 * progress;
    
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < radius) {
          const factor = 1 + (strength - 1) * Math.pow(1 - dist / radius, 2);
          
          targets.push({
            x,
            y,
            dx: dx * (factor - 1),
            dy: dy * (factor - 1),
            alpha: 1,
          });
        } else {
          targets.push({
            x,
            y,
            dx: 0,
            dy: 0,
            alpha: 1,
          });
        }
      }
    }
  }

  /**
   * Apply implode effect
   */
  private applyImplode(progress: number, targets: MorphTarget[]): void {
    const centerX = this.gridWidth / 2;
    const centerY = this.gridHeight / 2;
    const strength = this.gridWidth * 0.5 * progress;
    
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const dx = centerX - x;
        const dy = centerY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          const factor = strength / dist;
          
          targets.push({
            x,
            y,
            dx: dx * factor,
            dy: dy * factor,
            alpha: 1,
          });
        } else {
          targets.push({
            x,
            y,
            dx: 0,
            dy: 0,
            alpha: 1,
          });
        }
      }
    }
  }

  /**
   * Apply explode effect (reverse of implode)
   */
  private applyExplode(progress: number, targets: MorphTarget[]): void {
    const centerX = this.gridWidth / 2;
    const centerY = this.gridHeight / 2;
    const strength = this.gridWidth * 0.8 * progress;
    
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          const factor = (strength / dist) * progress;
          
          targets.push({
            x,
            y,
            dx: dx * factor,
            dy: dy * factor,
            alpha: 1 - progress * 0.5,
          });
        } else {
          targets.push({
            x,
            y,
            dx: 0,
            dy: 0,
            alpha: 1,
          });
        }
      }
    }
  }

  /**
   * Set morph preset
   */
  setPreset(preset: MorphPreset): void {
    this.config.preset = preset;
  }

  /**
   * Get current preset
   */
  getPreset(): MorphPreset {
    return this.config.preset;
  }

  /**
   * Set easing function
   */
  setEasing(easing: EasingFunction): void {
    this.config.easing = easing;
  }

  /**
   * Set morph intensity
   */
  setIntensity(intensity: number): void {
    this.config.intensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Start morphing
   */
  start(): void {
    this.isActive = true;
  }

  /**
   * Stop morphing
   */
  stop(): void {
    this.isActive = false;
  }

  /**
   * Check if morphing is active
   */
  isMorphing(): boolean {
    return this.isActive;
  }

  /**
   * Subscribe to morph updates
   */
  onMorph(callback: MorphCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Get current configuration
   */
  getConfig(): MorphConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<MorphConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Apply pixel displacement to an image buffer
   */
  applyDisplacement(
    sourceData: Uint8ClampedArray,
    width: number,
    height: number,
    displacement: MorphTarget[]
  ): Uint8ClampedArray {
    const result = new Uint8ClampedArray(sourceData.length);
    
    // Create a map of displacements
    const displacementMap = new Map<string, MorphTarget>();
    for (const d of displacement) {
      const key = `${Math.round(d.x)},${Math.round(d.y)}`;
      displacementMap.set(key, d);
    }
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = `${x},${y}`;
        const d = displacementMap.get(key);
        
        if (d) {
          const srcX = Math.round(x + d.dx);
          const srcY = Math.round(y + d.dy);
          
          if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
            const srcIdx = (srcY * width + srcX) * 4;
            const dstIdx = (y * width + x) * 4;
            
            result[dstIdx] = sourceData[srcIdx];
            result[dstIdx + 1] = sourceData[srcIdx + 1];
            result[dstIdx + 2] = sourceData[srcIdx + 2];
            result[dstIdx + 3] = sourceData[srcIdx + 3] * d.alpha;
          }
        } else {
          const idx = (y * width + x) * 4;
          result[idx] = sourceData[idx];
          result[idx + 1] = sourceData[idx + 1];
          result[idx + 2] = sourceData[idx + 2];
          result[idx + 3] = sourceData[idx + 3];
        }
      }
    }
    
    return result;
  }

  /**
   * Interpolate between two morph targets
   */
  interpolateTargets(
    from: MorphTarget[],
    to: MorphTarget[],
    progress: number
  ): MorphTarget[] {
    const result: MorphTarget[] = [];
    const maxLen = Math.max(from.length, to.length);
    
    for (let i = 0; i < maxLen; i++) {
      const f = from[i] || { x: 0, y: 0, dx: 0, dy: 0, alpha: 1 };
      const t = to[i] || { x: 0, y: 0, dx: 0, dy: 0, alpha: 1 };
      
      result.push({
        x: f.x,
        y: f.y,
        dx: f.dx + (t.dx - f.dx) * progress,
        dy: f.dy + (t.dy - f.dy) * progress,
        alpha: f.alpha + (t.alpha - f.alpha) * progress,
      });
    }
    
    return result;
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.isActive = false;
    for (const point of this.morphPoints) {
      point.displacement = { x: 0, y: 0 };
      point.weight = 1;
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.reset();
    this.callbacks.clear();
  }
}

/**
 * Create a morphing engine with default configuration
 */
export function createMorphingEngine(config?: Partial<MorphConfig>): MorphingEngine {
  return new MorphingEngine(config);
}
