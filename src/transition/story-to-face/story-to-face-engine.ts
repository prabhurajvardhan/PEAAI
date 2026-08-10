/**
 * Story-to-Face Transition Engine
 * 
 * Handles transitions from story scenes back to the companion face.
 * 
 * Features:
 * - Scene capture for pixel merging
 * - Pixel-level merge effect (reverse of dissolve)
 * - Face fade-in animation
 * - Configurable timing control
 */

import type { GeneratedScene } from '../../story-viz/scene-generator/types';
import type { IFaceState } from '../../companion/geometry/types';
import type { 
  TransitionConfig,
  StoryToFaceConfig,
  TransitionPhase,
  DissolveCell,
  TransitionHooks,
  SceneCaptureData,
  EasingFunction,
} from '../types';
import { 
  DEFAULT_TRANSITION_CONFIG,
  DEFAULT_TRANSITION_TIMING,
} from '../types';
import type { 
  StoryToFaceState, 
  StoryToFaceCallback,
  StoryToFaceOptions,
} from './types';

/**
 * Story-to-Face Transition Engine
 */
export class StoryToFaceTransition {
  private config: StoryToFaceConfig;
  private phase: TransitionPhase = 'idle';
  private progress: number = 0;
  private mergeProgress: number = 0;
  private dissolveCells: DissolveCell[] = [];
  private sceneCaptured: boolean = false;
  private faceVisible: boolean = false;
  private startTime: number = 0;
  private currentPhaseStartTime: number = 0;
  private isRunning: boolean = false;
  private isCancelled: boolean = false;
  private animationFrameId: number | null = null;
  
  private sceneCapture: (() => Promise<SceneCaptureData>) | null = null;
  private callbacks: Set<StoryToFaceCallback> = new Set();
  private hooks: TransitionHooks = {};

  constructor(options?: StoryToFaceOptions) {
    this.config = {
      ...DEFAULT_TRANSITION_CONFIG,
      ...options?.config,
    } as StoryToFaceConfig;
    
    if (options?.captureScene) {
      this.sceneCapture = options.captureScene;
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
   * Initialize dissolve cells for merge effect
   */
  private initializeDissolveCells(): void {
    const { gridSize } = this.config;
    const cellSize = 1;
    this.dissolveCells = [];
    
    // Initialize with inverted dissolve state (all visible, will become visible)
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        this.dissolveCells.push({
          x,
          y,
          size: cellSize,
          progress: 1, // Start fully dissolved
          alpha: 0,    // Start invisible (story showing)
          velocity: { x: 0, y: 0 },
          active: false, // Inactive until merge starts
        });
      }
    }
  }

  /**
   * Transition from story scene to face
   */
  async transition(targetFace: IFaceState): Promise<void> {
    if (this.isRunning) {
      throw new Error('Transition already in progress');
    }
    
    this.isRunning = true;
    this.isCancelled = false;
    this.phase = 'capturing';
    this.progress = 0;
    this.mergeProgress = 0;
    this.sceneCaptured = false;
    this.faceVisible = false;
    this.startTime = performance.now();
    this.currentPhaseStartTime = this.startTime;
    
    this.hooks.onStart?.();
    this.notifyCallbacks();
    
    try {
      // Phase 1: Capture story scene state
      await this.executeCapturePhase();
      
      if (this.isCancelled) return;
      
      // Phase 2: Pixel merging (reverse of dissolve)
      await this.executeMergePhase();
      
      if (this.isCancelled) return;
      
      // Phase 3: Face fade-in
      await this.executeFaceFadeIn(targetFace);
      
      if (this.isCancelled) return;
      
      // Complete
      this.phase = 'complete';
      this.progress = 1;
      this.faceVisible = true;
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
   * Execute scene capture phase
   */
  private async executeCapturePhase(): Promise<void> {
    this.phase = 'capturing';
    this.currentPhaseStartTime = performance.now();
    
    const { captureDuration } = this.config.timing;
    
    if (this.sceneCapture) {
      await this.sceneCapture();
    }
    
    this.sceneCaptured = true;
    
    // Wait for capture duration
    await this.waitForDuration(captureDuration);
  }

  /**
   * Execute pixel merging phase (reverse dissolve)
   */
  private async executeMergePhase(): Promise<void> {
    this.phase = 'merging';
    this.currentPhaseStartTime = performance.now();
    
    const { dissolveDuration } = this.config.timing;
    const startTime = performance.now();
    
    // Activate all cells for merging
    for (const cell of this.dissolveCells) {
      cell.active = true;
    }
    
    while (this.mergeProgress < 1 && !this.isCancelled) {
      const elapsed = performance.now() - startTime;
      this.mergeProgress = Math.min(1, elapsed / dissolveDuration);
      this.progress = 0.3 + (this.mergeProgress * 0.4); // 30-70%
      
      this.updateMergeCells();
      this.notifyCallbacks();
      
      await this.yieldToAnimation();
    }
    
    this.mergeProgress = 1;
    this.progress = 0.7;
  }

  /**
   * Update merge cells based on progress (reverse of dissolve)
   */
  private updateMergeCells(): void {
    const { gridSize, dissolvePattern, easing } = this.config;
    const patternProgress = easing(this.mergeProgress);
    
    for (let i = 0; i < this.dissolveCells.length; i++) {
      const cell = this.dissolveCells[i];
      if (!cell.active) continue;
      
      // Reverse pattern: cells become visible from edges inward
      const cellProgress = this.getPatternValue(cell.x, cell.y, gridSize, dissolvePattern, patternProgress);
      
      // Alpha increases as merge progresses (opposite of dissolve)
      if (this.mergeProgress > (1 - cellProgress)) {
        cell.alpha = Math.min(1, (this.mergeProgress - (1 - cellProgress)) * 3);
        cell.active = cell.alpha < 0.99;
      }
    }
  }

  /**
   * Get merge pattern value for a cell (reverse of dissolve)
   */
  private getPatternValue(
    x: number, 
    y: number, 
    gridSize: number,
    pattern: string,
    progress: number
  ): number {
    // Reverse pattern for merging (edges in, center last)
    switch (pattern) {
      case 'grid':
        // Merge from edges inward
        const centerX = gridSize / 2;
        const centerY = gridSize / 2;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
        return 1 - ((distance / maxDistance) * 0.8 + 0.1);
        
      case 'radial':
        // Radial merge from edges inward
        const dist = Math.sqrt(x * x + y * y);
        return 1 - (dist / (gridSize * Math.SQRT2));
        
      case 'spiral':
        // Spiral merge pattern (reverse)
        const angle = Math.atan2(y - gridSize/2, x - gridSize/2);
        const dist2 = Math.sqrt((x - gridSize/2) ** 2 + (y - gridSize/2) ** 2);
        const spiralPhase = (angle + Math.PI) / (2 * Math.PI);
        return 1 - ((spiralPhase + dist2 / gridSize) % 1 * 0.8);
        
      case 'wave':
        // Wave-based merge
        const waveValue = Math.sin((x + y) * 0.3 + (1 - progress) * Math.PI * 2);
        return (waveValue + 1) / 2;
        
      case 'noise':
        // Pseudo-random noise-based merge
        const noise = this.pseudoNoise(x, y);
        return 1 - (noise * 0.8 + 0.1);
        
      case 'particle':
        // Particle-based merge
        const particleVal = this.pseudoNoise(x * 3, y * 7);
        return 1 - particleVal;
        
      default:
        return 1 - progress;
    }
  }

  /**
   * Simple pseudo-random noise function
   */
  private pseudoNoise(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  /**
   * Execute face fade-in phase
   */
  private async executeFaceFadeIn(targetFace: IFaceState): Promise<void> {
    this.phase = 'merging'; // Keep merging phase
    this.currentPhaseStartTime = performance.now();
    
    const { mergeDuration } = this.config.timing;
    const startTime = performance.now();
    
    while (this.progress < 1 && !this.isCancelled) {
      const elapsed = performance.now() - startTime;
      const phaseProgress = Math.min(1, elapsed / mergeDuration);
      
      this.progress = 0.7 + (phaseProgress * 0.3); // 70-100%
      
      // Face becomes fully visible after 70% progress
      if (phaseProgress > 0.7) {
        this.faceVisible = true;
      }
      
      this.notifyCallbacks();
      
      await this.yieldToAnimation();
    }
    
    this.progress = 1;
    this.faceVisible = true;
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
  getState(): StoryToFaceState {
    return {
      phase: this.phase,
      progress: this.progress,
      sceneCaptured: this.sceneCaptured,
      mergeProgress: this.mergeProgress,
      faceVisible: this.faceVisible,
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
  onProgress(callback: StoryToFaceCallback): () => void {
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
  setConfig(config: Partial<StoryToFaceConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.gridSize && config.gridSize !== this.config.gridSize) {
      this.initializeDissolveCells();
    }
  }

  /**
   * Get configuration
   */
  getConfig(): StoryToFaceConfig {
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
    this.mergeProgress = 0;
    this.sceneCaptured = false;
    this.faceVisible = false;
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
 * Create a story-to-face transition with default configuration
 */
export function createStoryToFaceTransition(options?: StoryToFaceOptions): StoryToFaceTransition {
  return new StoryToFaceTransition(options);
}
