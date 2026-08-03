/**
 * Particle System - Particle effects and physics simulation
 * 
 * Features:
 * - Configurable particle emitters
 * - Physics simulation (gravity, friction, velocity)
 * - Particle lifecycle management
 * - Object pooling for performance
 * - Multiple emitter shapes
 */

import { IPosition, IColor } from '../../graphics/types';
import { EmitterShape, EmitterConfig, Particle, ParticleConfig } from '../types';

/**
 * Particle data structure
 */
export interface ParticleData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  sizeEnd: number;
  colorStart: IColor;
  colorEnd: IColor;
  rotation: number;
  rotationSpeed: number;
  active: boolean;
}

/**
 * Particle emitter interface
 */
export interface IParticleEmitter {
  emit(count: number): void;
  update(deltaTime: number): void;
  getActiveParticles(): ParticleData[];
  getActiveCount(): number;
  pause(): void;
  resume(): void;
  isPaused(): boolean;
  reset(): void;
  destroy(): void;
}

/**
 * Particle emitter configuration
 */
export interface ParticleEmitterConfig {
  position: IPosition;
  emissionRate: number;
  maxParticles: number;
  particleLifetime: number;
  initialVelocity: IPosition;
  velocitySpread?: IPosition;
  angle?: number;
  angleSpread?: number;
  sizeStart: number;
  sizeEnd: number;
  colorStart: IColor;
  colorEnd: IColor;
  gravity?: IPosition;
  friction?: number;
  rotationSpeed?: number;
  rotationSpeedSpread?: number;
  emitterShape: EmitterShape;
  emitterWidth?: number;
  emitterHeight?: number;
  emitterRadius?: number;
  burstMode?: boolean;
  autoStart?: boolean;
}

const DEFAULT_CONFIG = {
  emissionRate: 10,
  maxParticles: 100,
  particleLifetime: 1000,
  initialVelocity: { x: 0, y: 0 },
  velocitySpread: { x: 10, y: 10 },
  angle: Math.PI / 2,
  angleSpread: Math.PI / 4,
  sizeStart: 4,
  sizeEnd: 0,
  colorStart: { r: 255, g: 255, b: 255, a: 255 },
  colorEnd: { r: 255, g: 255, b: 255, a: 0 },
  gravity: { x: 0, y: 100 },
  friction: 0.98,
  rotationSpeed: 0,
  rotationSpeedSpread: 0,
  emitterShape: 'point' as EmitterShape,
  burstMode: false,
  autoStart: true,
};

/**
 * Object pool for particles to reduce garbage collection
 */
class ParticlePool {
  private pool: ParticleData[] = [];
  private active: ParticleData[] = [];
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.initializePool();
  }

  private initializePool(): void {
    for (let i = 0; i < this.maxSize; i++) {
      this.pool.push(this.createParticle());
    }
  }

  private createParticle(): ParticleData {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1000,
      size: 4,
      sizeEnd: 0,
      colorStart: { r: 255, g: 255, b: 255, a: 255 },
      colorEnd: { r: 255, g: 255, b: 255, a: 0 },
      rotation: 0,
      rotationSpeed: 0,
      active: false,
    };
  }

  acquire(): ParticleData | null {
    if (this.pool.length === 0) return null;
    const particle = this.pool.pop()!;
    particle.active = true;
    this.active.push(particle);
    return particle;
  }

  release(particle: ParticleData): void {
    particle.active = false;
    const index = this.active.indexOf(particle);
    if (index !== -1) {
      this.active.splice(index, 1);
      this.pool.push(particle);
    }
  }

  getActive(): ParticleData[] {
    return this.active;
  }

  getActiveCount(): number {
    return this.active.length;
  }

  releaseAll(): void {
    while (this.active.length > 0) {
      this.release(this.active[0]);
    }
  }

  getAvailableCount(): number {
    return this.pool.length;
  }
}

/**
 * Particle Emitter for creating and updating particles
 */
export class ParticleEmitter implements IParticleEmitter {
  private pool: ParticlePool;
  private config: Required<ParticleEmitterConfig>;
  private position: IPosition;
  private isPausedState: boolean = false;
  private emissionAccumulator: number = 0;
  private isEmitting: boolean = false;
  private lifetime: number = 0;
  private maxLifetime: number = 0;
  private updateCallbacks: Set<(particles: ParticleData[]) => void> = new Set();

  constructor(config: ParticleEmitterConfig) {
    this.pool = new ParticlePool(config.maxParticles);
    this.config = { ...DEFAULT_CONFIG, ...config } as Required<ParticleEmitterConfig>;
    this.position = { ...config.position };

    if (config.autoStart) {
      this.start();
    }
  }

  emit(count: number): void {
    for (let i = 0; i < count; i++) {
      const particle = this.pool.acquire();
      if (!particle) break;

      this.initializeParticle(particle);
    }
  }

  update(deltaTime: number): void {
    if (this.isPausedState) return;

    // Handle burst mode lifetime
    if (this.config.burstMode && this.maxLifetime > 0) {
      this.lifetime += deltaTime;
      if (this.lifetime >= this.maxLifetime) {
        this.isEmitting = false;
      }
    }

    // Emit particles based on emission rate
    if (this.isEmitting) {
      this.emissionAccumulator += (this.config.emissionRate * deltaTime) / 1000;
      const particlesToEmit = Math.floor(this.emissionAccumulator);
      if (particlesToEmit > 0) {
        this.emissionAccumulator -= particlesToEmit;
        this.emit(particlesToEmit);
      }
    }

    // Update all active particles
    const particles = this.pool.getActive();
    const toRelease: ParticleData[] = [];

    for (const particle of particles) {
      // Apply physics
      particle.vx *= this.config.friction;
      particle.vy *= this.config.friction;

      // Apply gravity
      if (this.config.gravity) {
        particle.vx += this.config.gravity.x * (deltaTime / 1000);
        particle.vy += this.config.gravity.y * (deltaTime / 1000);
      }

      // Update position
      particle.x += particle.vx * (deltaTime / 1000);
      particle.y += particle.vy * (deltaTime / 1000);

      // Update rotation
      particle.rotation += particle.rotationSpeed * (deltaTime / 1000);

      // Update life
      particle.life -= deltaTime;

      if (particle.life <= 0) {
        toRelease.push(particle);
      }
    }

    // Release dead particles
    for (const particle of toRelease) {
      this.pool.release(particle);
    }

    // Notify listeners
    if (toRelease.length > 0 || particles.length > 0) {
      this.notifyUpdate();
    }
  }

  getActiveParticles(): ParticleData[] {
    return this.pool.getActive();
  }

  getActiveCount(): number {
    return this.pool.getActiveCount();
  }

  pause(): void {
    this.isPausedState = true;
  }

  resume(): void {
    this.isPausedState = false;
  }

  isPaused(): boolean {
    return this.isPausedState;
  }

  reset(): void {
    this.pool.releaseAll();
    this.emissionAccumulator = 0;
    this.lifetime = 0;
  }

  destroy(): void {
    this.pool.releaseAll();
    this.updateCallbacks.clear();
    this.isEmitting = false;
  }

  /**
   * Start continuous emission
   */
  start(): void {
    this.isEmitting = true;
    this.emissionAccumulator = 0;
  }

  /**
   * Stop emission (existing particles will still die)
   */
  stop(): void {
    this.isEmitting = false;
  }

  /**
   * Emit a burst of particles
   */
  burst(count: number, durationMs: number = 0): void {
    this.maxLifetime = durationMs;
    this.lifetime = 0;
    this.isEmitting = true;
    this.emit(count);
  }

  /**
   * Set emitter position
   */
  setPosition(position: IPosition): void {
    this.position = { ...position };
  }

  /**
   * Get emitter position
   */
  getPosition(): IPosition {
    return { ...this.position };
  }

  /**
   * Set emission rate
   */
  setEmissionRate(rate: number): void {
    this.config.emissionRate = rate;
  }

  /**
   * Subscribe to particle updates
   */
  onUpdate(callback: (particles: ParticleData[]) => void): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  private initializeParticle(particle: ParticleData): void {
    // Reset particle
    particle.life = this.config.particleLifetime;
    particle.maxLife = this.config.particleLifetime;
    particle.size = this.config.sizeStart;
    particle.sizeEnd = this.config.sizeEnd;
    particle.colorStart = { ...this.config.colorStart };
    particle.colorEnd = { ...this.config.colorEnd };
    particle.rotation = 0;
    particle.rotationSpeed = this.config.rotationSpeed + 
      (Math.random() - 0.5) * 2 * this.config.rotationSpeedSpread;

    // Set position based on emitter shape
    const spawnPos = this.getSpawnPosition();
    particle.x = spawnPos.x;
    particle.y = spawnPos.y;

    // Set velocity based on angle
    const angle = this.config.angle + (Math.random() - 0.5) * 2 * this.config.angleSpread;
    const speed = Math.sqrt(
      this.config.initialVelocity.x ** 2 + 
      this.config.initialVelocity.y ** 2
    ) + (Math.random() - 0.5) * 2 * Math.sqrt(
      this.config.velocitySpread.x ** 2 + 
      this.config.velocitySpread.y ** 2
    );

    particle.vx = Math.cos(angle) * speed;
    particle.vy = -Math.sin(angle) * speed; // Negative because y is inverted

    // Add spread
    particle.vx += (Math.random() - 0.5) * this.config.velocitySpread.x;
    particle.vy += (Math.random() - 0.5) * this.config.velocitySpread.y;
  }

  private getSpawnPosition(): IPosition {
    switch (this.config.emitterShape) {
      case 'point':
        return { ...this.position };

      case 'circle': {
        const radius = this.config.emitterRadius ?? 10;
        const angle = Math.random() * Math.PI * 2;
        return {
          x: this.position.x + Math.cos(angle) * radius * Math.random(),
          y: this.position.y + Math.sin(angle) * radius * Math.random(),
        };
      }

      case 'rectangle': {
        const width = this.config.emitterWidth ?? 20;
        const height = this.config.emitterHeight ?? 20;
        return {
          x: this.position.x + (Math.random() - 0.5) * width,
          y: this.position.y + (Math.random() - 0.5) * height,
        };
      }

      default:
        return { ...this.position };
    }
  }

  private notifyUpdate(): void {
    const particles = this.pool.getActive();
    for (const callback of this.updateCallbacks) {
      try {
        callback(particles);
      } catch (error) {
        console.error('Error in particle update callback:', error);
      }
    }
  }
}

/**
 * Particle System Manager - manages multiple emitters
 */
export class ParticleSystem {
  private emitters: Map<string, ParticleEmitter> = new Map();
  private updateCallbacks: Set<(emitters: ParticleEmitter[]) => void> = new Set();

  createEmitter(id: string, config: ParticleEmitterConfig): ParticleEmitter {
    if (this.emitters.has(id)) {
      throw new Error(`Emitter with id "${id}" already exists`);
    }

    const emitter = new ParticleEmitter(config);
    this.emitters.set(id, emitter);
    return emitter;
  }

  getEmitter(id: string): ParticleEmitter | undefined {
    return this.emitters.get(id);
  }

  removeEmitter(id: string): boolean {
    const emitter = this.emitters.get(id);
    if (emitter) {
      emitter.destroy();
      this.emitters.delete(id);
      return true;
    }
    return false;
  }

  update(deltaTime: number): void {
    for (const emitter of this.emitters.values()) {
      emitter.update(deltaTime);
    }

    this.notifyUpdate();
  }

  pause(): void {
    for (const emitter of this.emitters.values()) {
      emitter.pause();
    }
  }

  resume(): void {
    for (const emitter of this.emitters.values()) {
      emitter.resume();
    }
  }

  clear(): void {
    for (const emitter of this.emitters.values()) {
      emitter.reset();
    }
  }

  destroy(): void {
    for (const emitter of this.emitters.values()) {
      emitter.destroy();
    }
    this.emitters.clear();
    this.updateCallbacks.clear();
  }

  getActiveParticleCount(): number {
    let count = 0;
    for (const emitter of this.emitters.values()) {
      count += emitter.getActiveCount();
    }
    return count;
  }

  onUpdate(callback: (emitters: ParticleEmitter[]) => void): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  private notifyUpdate(): void {
    const emitters = Array.from(this.emitters.values());
    for (const callback of this.updateCallbacks) {
      try {
        callback(emitters);
      } catch (error) {
        console.error('Error in particle system update callback:', error);
      }
    }
  }
}
