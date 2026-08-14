/**
 * Face-to-Story Transition Engine
 * 
 * Handles transitions from the companion face to story scenes.
 * 
 * Features:
 * - Face capture for pixel dissolution
 * - Pixel-level dissolve effect
 * - Story fade-in animation
 * - Configurable timing control
 */

import type { 
  IFaceState 
} from '../../companion/geometry/types';
import type { GeneratedScene } from '../../story-viz/scene-generator/types';
import type { 
  TransitionConfig,
  FaceToStoryConfig,
  TransitionPhase,
  DissolveCell,
  TransitionHooks,
  TransitionProgressCallback,
  EasingFunction,
  FaceCaptureData,
} from '../types';
import { 
  DEFAULT_TRANSITION_CONFIG,
  DEFAULT_TRANSITION_TIMING,
} from '../types';
import type { 
  FaceToStoryState, 
  FaceToStoryCallback,
  FaceToStoryOptions,
} from './types';

/**
 * Face-to-Story Transition Engine
 */
export class FaceToStoryTransition {
  private config: FaceToStoryConfig;
  private phase: TransitionPhase = 'idle';
  private progress: number = 0;
  private dissolveProgress: number = 0;
  private dissolveCells: DissolveCell[] = [];
  private faceCaptured: boolean = false;
  private storyVisible: boolean = false;
  private startTime: number = 0;
  private currentPhaseStartTime: number = 0;
  private isRunning: boolean = false;
  private isCancelled: boolean = false;
  private animationFrameId: number | null = null;
  
  private faceCapture: (() => Promise<FaceCaptureData>) | null = null;
  private callbacks: Set<FaceToStoryCallback> = new Set();
  private hooks: TransitionHooks = {};

  constructor(options?: FaceToStoryOptions) {
    this.config = {
      ...DEFAULT_TRANSITION_CONFIG,
      ...options?.config,
    } as FaceToStoryConfig;
    
    if (options?.captureFace) {
      this.faceCapture = options.captureFace;
    }
    
    if (options?.onProgress) {
      this.callbacks.add(options.onProgress);
    }
    
    if (options?.onComplete) {
      this.hooks.onComplete = options.onComplete;
    }
    
    this.initializeDissolveCells();
  }

  /**
   * Initialize dissolve cells for grid-based dissolution
   */
  private initializeDissolveCells(): void {
    const { gridSize } = this.config;
    const cellSize = 1; // Each cell is 1 pixel
    this.dissolveCells = [];
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        this.dissolveCells.push({
          x,
          y,
          size: cellSize,
          progress: 0,
          alpha: 1,
          velocity: { x: 0, y: 0 },
          active: true,
        });
      }
    }
  }

  /**
   * Transition from face to story scene
   */
  async transition(targetScene: GeneratedScene): Promise<void> {
    if (this.isRunning) {
      throw new Error('Transition already in progress');
    }
    
    this.isRunning = true;
    this.isCancelled = false;
    this.phase = 'capturing';
    this.progress = 0;
    this.dissolveProgress = 0;
    this.faceCaptured = false;
    this.storyVisible = false;
    this.startTime = performance.now();
    this.currentPhaseStartTime = this.startTime;
    
    this.hooks.onStart?.();
    this.notifyCallbacks();
    
    try {
      // Phase 1: Capture face state
      await this.executeCapturePhase();
      
      if (this.isCancelled) return;
      
      // Phase 2: Pixel dissolution
      await this.executeDissolvePhase();
      
      if (this.isCancelled) return;
      
      // Phase 3: Story fade-in
      await this.executeStoryFadeIn(targetScene);
      
      if (this.isCancelled) return;
      
      // Complete
      this.phase = 'complete';
      this.progress = 1;
      this.storyVisible = true;
      this.notifyCallbacks();
      this.hooks.onComplete?.();
      
    } catch (error) {
      this.phase = 'cancelled';
      this.isRunning = false;
      throw error;
    }
    
    this.isRunning = false;
  }

  /**
   * Execute face capture phase
   */
  private async executeCapturePhase(): Promise<void> {
    this.phase = 'capturing';
    this.currentPhaseStartTime = performance.now();
    
    const { captureDuration } = this.config.timing;
    
    if (this.faceCapture) {
      await this.faceCapture();
    }
    
    this.faceCaptured = true;
    
    // Wait for capture duration
    await this.waitForDuration(captureDuration);
  }

  /**
   * Execute pixel dissolution phase
   */
  private async executeDissolvePhase(): Promise<void> {
    this.phase = 'dissolving';
    this.currentPhaseStartTime = performance.now();
    
    const { dissolveDuration } = this.config.timing;
    const startTime = performance.now();
    
    while (this.dissolveProgress < 1 && !this.isCancelled) {
      const elapsed = performance.now() - startTime;
      this.dissolveProgress = Math.min(1, elapsed / dissolveDuration);
      this.progress = 0.3 + (this.dissolveProgress * 0.4); // 30-70%
      
      this.updateDissolveCells();
      this.notifyCallbacks();
      
      await this.yieldToAnimation();
    }
    
    this.dissolveProgress = 1;
    this.progress = 0.7;
  }

  /**
   * Update dissolve cells based on progress
   */
  private updateDissolveCells(): void {
    const { gridSize, dissolvePattern, easing } = this.config;
    const patternProgress = easing(this.dissolveProgress);
    
    for (let i = 0; i < this.dissolveCells.length; i++) {
      const cell = this.dissolveCells[i];
      if (!cell.active) continue;
      
      const cellProgress = this.getPatternValue(cell.x, cell.y, gridSize, dissolvePattern, patternProgress);
      
      if (this.dissolveProgress > cellProgress) {
        cell.alpha = Math.max(0, 1 - (this.dissolveProgress - cellProgress) * 3);
        cell.active = cell.alpha > 0.01;
      }
    }
  }

  /**
   * Get dissolve pattern value for a cell
   */
  private getPatternValue(
    x: number, 
    y: number, 
    gridSize: number,
    pattern: string,
    progress: number
  ): number {
    switch (pattern) {
      case 'grid':
        // Dissolve from center outward
        const centerX = gridSize / 2;
        const centerY = gridSize / 2;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
        return (distance / maxDistance) * 0.8 + 0.2;
        
      case 'radial':
        // Radial dissolve from center
        const dist = Math.sqrt(x * x + y * y);
        return (dist / (gridSize * Math.SQRT2)) * progress;
        
      case 'spiral':
        // Spiral dissolve pattern
        const angle = Math.atan2(y - gridSize/2, x - gridSize/2);
        const dist2 = Math.sqrt((x - gridSize/2) ** 2 + (y - gridSize/2) ** 2);
        const spiralPhase = (angle + Math.PI) / (2 * Math.PI);
        return (spiralPhase + dist2 / gridSize) % 1 * 0.8;
        
      case 'wave':
        // Wave-based dissolve
        const waveValue = Math.sin((x + y) * 0.3 + progress * Math.PI * 2);
        return (waveValue + 1) / 2;
        
      case 'noise':
        // Pseudo-random noise-based dissolve
        const noise = this.pseudoNoise(x, y);
        return noise * 0.8 + 0.1;
        
      case 'particle':
        // Particle-based dissolve
        const particleVal = this.pseudoNoise(x * 3, y * 7);
        return particleVal;
        
      default:
        return progress;
    }
  }

  /**
   * Simple pseudo-random noise function for consistent dissolve patterns
   */
  private pseudoNoise(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  /**
   * Execute story fade-in phase
   */
  private async executeStoryFadeIn(targetScene: GeneratedScene): Promise<void> {
    this.phase = 'merging';
    this.currentPhaseStartTime = performance.now();
    
    const { mergeDuration } = this.config.timing;
    const startTime = performance.now();
    
    while (this.progress < 1 && !this.isCancelled) {
      const elapsed = performance.now() - startTime;
      const phaseProgress = Math.min(1, elapsed / mergeDuration);
      
      this.progress = 0.7 + (phaseProgress * 0.3); // 70-100%
      
      if (phaseProgress > 0.3) {
        this.storyVisible = true;
      }
      
      this.notifyCallbacks();
      
      await this.yieldToAnimation();
    }
    
    this.progress = 1;
    this.storyVisible = true;
  }

  /**
   * Cancel the current transition
   */
  cancel(): void {
    if (!this.isRunning) return;
    
    this.isCancelled = true;
    this.phase = 'cancelled';
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.hooks.onCancel?.();
  }

  /**
   * Get current transition state
   */
  getState(): FaceToStoryState {
    return {
      phase: this.phase,
      progress: this.progress,
      faceCaptured: this.faceCaptured,
      dissolveProgress: this.dissolveProgress,
      storyVisible: this.storyVisible,
    };
  }

  /**
   * Get current phase
   */
  getPhase(): TransitionPhase {
    return this.phase;
  }

  /**
   * Get transition progress (0-1)
   */
  getProgress(): number {
    return this.progress;
  }

  /**
   * Get dissolve cells for rendering
   */
  getDissolveCells(): DissolveCell[] {
    return this.dissolveCells;
  }

  /**
   * Subscribe to state updates
   */
  onProgress(callback: FaceToStoryCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Set transition hooks
   */
  setHooks(hooks: TransitionHooks): void {
    this.hooks = { ...this.hooks, ...hooks };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<FaceToStoryConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.gridSize && config.gridSize !== this.config.gridSize) {
      this.initializeDissolveCells();
    }
  }

  /**
   * Get configuration
   */
  getConfig(): FaceToStoryConfig {
    return { ...this.config };
  }

  /**
   * Check if transition is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.cancel();
    this.phase = 'idle';
    this.progress = 0;
    this.dissolveProgress = 0;
    this.faceCaptured = false;
    this.storyVisible = false;
    this.initializeDissolveCells();
  }

  /**
   * Wait for a specified duration
   */
  private async waitForDuration(duration: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, duration);
    });
  }

  /**
   * Yield to animation frame
   */
  private yieldToAnimation(): Promise<void> {
    return new Promise(resolve => {
      this.animationFrameId = requestAnimationFrame(() => {
        resolve();
      });
    });
  }

  /**
   * Notify all callbacks of state change
   */
  private notifyCallbacks(): void {
    const state = this.getState();
    this.callbacks.forEach(callback => callback(state));
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.reset();
    this.callbacks.clear();
    this.hooks = {};
  }
}

/**
 * Create a face-to-story transition with default configuration
 */
export function createFaceToStoryTransition(options?: FaceToStoryOptions): FaceToStoryTransition {
  return new FaceToStoryTransition(options);
}
