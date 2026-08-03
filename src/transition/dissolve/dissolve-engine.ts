/**
 * Dissolve Effects Engine
 * 
 * Handles various dissolve effects for pixel transitions.
 * 
 * Features:
 * - Grid dissolve
 * - Particle dissolve
 * - Noise dissolve
 * - Custom patterns
 */

import type { IPosition } from '../../graphics/types';
import type { DissolvePattern, DissolveParticle, DissolveCell, EasingFunction } from '../types';
import type { 
  DissolveEffectConfig, 
  DissolveMask, 
  DissolveMaskCell,
  DissolveCallback,
  ParticleDissolveConfig,
  NoiseDissolveConfig,
  DissolvePatternFunction,
  DEFAULT_DISSOLVE_CONFIG,
} from './types';

/**
 * Dissolve Effects Engine
 */
export class DissolveEffectsEngine {
  private config: DissolveEffectConfig;
  private width: number = 32;
  private height: number = 32;
  private mask: DissolveMask | null = null;
  private particles: DissolveParticle[] = [];
  private callbacks: Set<DissolveCallback> = new Set();
  private noiseBuffer: Float32Array | null = null;

  constructor(config?: Partial<DissolveEffectConfig>) {
    this.config = {
      pattern: config?.pattern ?? 'grid',
      easing: config?.easing ?? ((t) => t),
      particleConfig: config?.particleConfig,
      noiseConfig: config?.noiseConfig,
      customPattern: config?.customPattern,
      reverse: config?.reverse ?? false,
      staggered: config?.staggered ?? false,
      seed: config?.seed ?? Date.now(),
    };
  }

  /**
   * Initialize the dissolve grid
   */
  initialize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.mask = this.createMask(width, height);
    this.generateNoiseBuffer();
    this.initializeParticles();
  }

  /**
   * Create dissolve mask
   */
  private createMask(width: number, height: number): DissolveMask {
    const cells: DissolveMaskCell[] = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const noiseValue = this.getNoiseValue(x, y, width, height);
        const delay = this.config.staggered ? this.pseudoRandom(x, y) * 0.3 : 0;
        
        cells.push({
          x,
          y,
          dissolve: 0,
          alpha: this.config.reverse ? 1 : 0,
        });
      }
    }
    
    return { width, height, cells, progress: 0 };
  }

  /**
   * Generate noise buffer for noise-based dissolve
   */
  private generateNoiseBuffer(): void {
    this.noiseBuffer = new Float32Array(this.width * this.height);
    
    for (let i = 0; i < this.noiseBuffer.length; i++) {
      this.noiseBuffer[i] = Math.random();
    }
  }

  /**
   * Get noise value for a cell
   */
  private getNoiseValue(x: number, y: number, width: number, height: number): number {
    const index = y * width + x;
    if (this.noiseBuffer && index < this.noiseBuffer.length) {
      return this.noiseBuffer[index];
    }
    return this.pseudoRandom(x, y);
  }

  /**
   * Simple pseudo-random function
   */
  private pseudoRandom(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + this.config.seed) * 43758.5453;
    return n - Math.floor(n);
  }

  /**
   * Initialize particles for particle dissolve
   */
  private initializeParticles(): void {
    const particleConfig = this.config.particleConfig;
    if (!particleConfig) return;
    
    this.particles = [];
    const maxParticles = particleConfig.maxParticles;
    
    for (let i = 0; i < maxParticles; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 0,
        maxLife: particleConfig.particleLifetime,
        size: 1,
        active: false,
      });
    }
  }

  /**
   * Update dissolve based on pattern
   */
  update(progress: number): DissolveMask {
    if (!this.mask) {
      this.initialize(this.width, this.height);
    }
    
    const easedProgress = this.config.easing(progress);
    this.mask!.progress = easedProgress;
    
    const { pattern, reverse } = this.config;
    const width = this.mask.width;
    const height = this.mask.height;
    
    for (let i = 0; i < this.mask.cells.length; i++) {
      const cell = this.mask.cells[i];
      const x = cell.x;
      const y = cell.y;
      
      // Get pattern value (0-1)
      let patternValue = this.getPatternValue(x, y, width, height, pattern, easedProgress);
      
      // Apply reverse
      if (reverse) {
        patternValue = 1 - patternValue;
      }
      
      // Update dissolve
      cell.dissolve = Math.max(0, Math.min(1, easedProgress - patternValue));
      cell.alpha = 1 - cell.dissolve;
    }
    
    this.notifyCallbacks();
    return this.mask;
  }

  /**
   * Get pattern value for a cell
   */
  private getPatternValue(
    x: number,
    y: number,
    width: number,
    height: number,
    pattern: DissolvePattern,
    progress: number
  ): number {
    switch (pattern) {
      case 'grid':
        return this.getGridPattern(x, y, width, height, progress);
      case 'particle':
        return this.getParticlePattern(x, y, progress);
      case 'noise':
        return this.getNoisePattern(x, y, width, height, progress);
      case 'radial':
        return this.getRadialPattern(x, y, width, height, progress);
      case 'spiral':
        return this.getSpiralPattern(x, y, width, height, progress);
      case 'wave':
        return this.getWavePattern(x, y, width, height, progress);
      case 'custom':
        if (this.config.customPattern) {
          return this.config.customPattern(x, y, width, height, progress, this.config.seed);
        }
        return progress;
      default:
        return progress;
    }
  }

  /**
   * Grid dissolve pattern
   */
  private getGridPattern(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    progress: number
  ): number {
    const centerX = width / 2;
    const centerY = height / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
    return (dist / maxDist) * 0.8 + 0.2;
  }

  /**
   * Particle dissolve pattern
   */
  private getParticlePattern(x: number, y: number, progress: number): number {
    const noise = this.getNoiseValue(x * 3, y * 7, this.width, this.height);
    return noise * 0.8 + 0.1;
  }

  /**
   * Noise-based dissolve pattern
   */
  private getNoisePattern(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    progress: number
  ): number {
    const noiseConfig = this.config.noiseConfig;
    if (noiseConfig) {
      // Multi-octave noise
      let value = 0;
      let amplitude = 1;
      let frequency = noiseConfig.scale;
      const maxValue = 0;
      
      for (let i = 0; i < noiseConfig.octaves; i++) {
        const nx = x / (width / frequency);
        const ny = y / (height / frequency);
        value += this.simplexNoise(nx, ny, noiseConfig.seed + i) * amplitude;
        amplitude *= noiseConfig.persistence;
        frequency *= noiseConfig.lacunarity;
      }
      
      return (value + 1) / 2;
    }
    
    // Fallback to simple noise
    const noise = this.getNoiseValue(x, y, width, height);
    return noise;
  }

  /**
   * Simple simplex-like noise (for demonstration)
   */
  private simplexNoise(x: number, y: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
  }

  /**
   * Radial dissolve pattern
   */
  private getRadialPattern(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    progress: number
  ): number {
    const centerX = width / 2;
    const centerY = height / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
    
    return dist / maxDist;
  }

  /**
   * Spiral dissolve pattern
   */
  private getSpiralPattern(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    progress: number
  ): number {
    const centerX = width / 2;
    const centerY = height / 2;
    const angle = Math.atan2(y - centerY, x - centerX);
    const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    
    // Spiral value combines angle and distance
    const spiralPhase = ((angle + Math.PI) / (2 * Math.PI) + dist / (width * 2)) % 1;
    return spiralPhase * 0.7 + 0.2;
  }

  /**
   * Wave dissolve pattern
   */
  private getWavePattern(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    progress: number
  ): number {
    // Multiple wave patterns combined
    const wave1 = Math.sin(x * 0.3 + progress * Math.PI * 2);
    const wave2 = Math.cos(y * 0.4 + progress * Math.PI * 1.5);
    const wave3 = Math.sin((x + y) * 0.2 + progress * Math.PI);
    
    return ((wave1 + wave2 + wave3) / 3 + 1) / 2;
  }

  /**
   * Apply particle effect to dissolve
   */
  updateParticles(deltaTime: number): void {
    const particleConfig = this.config.particleConfig;
    if (!particleConfig) return;
    
    for (const particle of this.particles) {
      if (particle.active) {
        // Update position
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        
        // Apply gravity
        particle.vy += particleConfig.gravity * deltaTime;
        
        // Apply friction
        particle.vx *= (1 - particleConfig.friction);
        particle.vy *= (1 - particleConfig.friction);
        
        // Update life
        particle.life += deltaTime;
        
        // Deactivate if expired or out of bounds
        if (particle.life >= particle.maxLife ||
            particle.x < 0 || particle.x >= this.width ||
            particle.y < 0 || particle.y >= this.height) {
          particle.active = false;
        }
      } else if (Math.random() < particleConfig.emissionRate * deltaTime) {
        // Activate particle
        particle.x = Math.random() * this.width;
        particle.y = Math.random() * this.height;
        particle.vx = (Math.random() - 0.5) * particleConfig.initialVelocity.x;
        particle.vy = (Math.random() - 0.5) * particleConfig.initialVelocity.y;
        particle.life = 0;
        particle.active = true;
      }
    }
  }

  /**
   * Get active particles
   */
  getParticles(): DissolveParticle[] {
    return this.particles.filter(p => p.active);
  }

  /**
   * Set dissolve pattern
   */
  setPattern(pattern: DissolvePattern): void {
    this.config.pattern = pattern;
    if (this.mask) {
      // Recreate mask with new pattern
      this.mask = this.createMask(this.mask.width, this.mask.height);
    }
  }

  /**
   * Get current pattern
   */
  getPattern(): DissolvePattern {
    return this.config.pattern;
  }

  /**
   * Set custom pattern function
   */
  setCustomPattern(pattern: DissolvePatternFunction): void {
    this.config.customPattern = pattern;
    this.config.pattern = 'custom';
  }

  /**
   * Set easing function
   */
  setEasing(easing: EasingFunction): void {
    this.config.easing = easing;
  }

  /**
   * Set reverse mode
   */
  setReverse(reverse: boolean): void {
    this.config.reverse = reverse;
  }

  /**
   * Set staggered mode
   */
  setStaggered(staggered: boolean): void {
    this.config.staggered = staggered;
    if (this.mask) {
      this.mask = this.createMask(this.mask.width, this.mask.height);
    }
  }

  /**
   * Set random seed
   */
  setSeed(seed: number): void {
    this.config.seed = seed;
    this.generateNoiseBuffer();
    if (this.mask) {
      this.mask = this.createMask(this.mask.width, this.mask.height);
    }
  }

  /**
   * Get current mask
   */
  getMask(): DissolveMask | null {
    return this.mask;
  }

  /**
   * Get mask as alpha array for rendering
   */
  getAlphaArray(): Float32Array {
    if (!this.mask) {
      return new Float32Array(0);
    }
    
    const alpha = new Float32Array(this.mask.cells.length);
    for (let i = 0; i < this.mask.cells.length; i++) {
      alpha[i] = this.mask.cells[i].alpha;
    }
    return alpha;
  }

  /**
   * Apply dissolve mask to image data
   */
  applyMaskToImageData(imageData: ImageData): ImageData {
    if (!this.mask) {
      return imageData;
    }
    
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
    
    for (let i = 0; i < this.mask.cells.length; i++) {
      const cell = this.mask.cells[i];
      const idx = i * 4 + 3; // Alpha channel
      
      result.data[idx] = Math.round(imageData.data[idx] * cell.alpha);
    }
    
    return result;
  }

  /**
   * Subscribe to mask updates
   */
  onUpdate(callback: DissolveCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(): void {
    if (!this.mask) return;
    
    this.callbacks.forEach(callback => {
      callback(this.mask!.cells, this.mask!.progress);
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): DissolveEffectConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<DissolveEffectConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    if (this.mask) {
      for (const cell of this.mask.cells) {
        cell.dissolve = this.config.reverse ? 1 : 0;
        cell.alpha = this.config.reverse ? 0 : 1;
      }
      this.mask.progress = 0;
    }
    
    for (const particle of this.particles) {
      particle.active = false;
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.callbacks.clear();
    this.mask = null;
    this.particles = [];
    this.noiseBuffer = null;
  }
}

/**
 * Create a dissolve effects engine with default configuration
 */
export function createDissolveEngine(config?: Partial<DissolveEffectConfig>): DissolveEffectsEngine {
  return new DissolveEffectsEngine(config);
}
