/**
 * Transition Engine - Main Orchestrator
 * 
 * Ties together all transition components and provides
 * a unified interface for face-to-story transitions.
 */

import type { IFaceState } from '../companion/geometry/types';
import type { GeneratedScene } from '../story-viz/scene-generator/types';
import type { IEventBus } from '../event-bus';
import type { 
  TransitionConfig, 
  TransitionMode,
  TransitionPhase,
  TransitionState,
  TransitionHooks,
  TransitionEvent,
  TransitionProgressCallback,
  TransitionLifecycleHooks,
  FaceCaptureData,
  SceneCaptureData,
} from './types';
import { DEFAULT_TRANSITION_CONFIG } from './types';
import { FaceToStoryTransition } from './face-to-story';
import { StoryToFaceTransition } from './story-to-face';
import { MorphingEngine } from './morphing';
import { DissolveEffectsEngine } from './dissolve';
import { TransitionTimelineController } from './timeline';

/**
 * Transition engine configuration
 */
export interface TransitionEngineConfig {
  config: TransitionConfig;
  lifecycleHooks: TransitionLifecycleHooks;
  eventBus?: IEventBus;
  captureFace: () => Promise<FaceCaptureData>;
  captureScene: () => Promise<SceneCaptureData>;
}

/**
 * Transition engine state
 */
export interface TransitionEngineState {
  mode: TransitionMode | null;
  state: TransitionState;
  phase: TransitionPhase;
  progress: number;
  isRunning: boolean;
}

/**
 * Main Transition Engine
 */
export class TransitionEngine {
  private config: TransitionConfig;
  private lifecycleHooks: TransitionLifecycleHooks;
  private eventBus: IEventBus | null = null;
  
  private faceToStoryTransition: FaceToStoryTransition;
  private storyToFaceTransition: StoryToFaceTransition;
  private morphingEngine: MorphingEngine;
  private dissolveEngine: DissolveEffectsEngine;
  private timelineController: TransitionTimelineController;
  
  private currentMode: TransitionMode | null = null;
  private currentState: TransitionState = 'idle';
  private currentPhase: TransitionPhase = 'idle';
  private currentProgress: number = 0;
  private isRunning: boolean = false;
  
  private captureFace: (() => Promise<FaceCaptureData>) | null = null;
  private captureScene: (() => Promise<SceneCaptureData>) | null = null;
  
  private progressCallbacks: Set<TransitionProgressCallback> = new Set();
  private eventListeners: Map<string, Set<(event: TransitionEvent) => void>> = new Map();

  constructor(config?: Partial<TransitionEngineConfig>) {
    this.config = { ...DEFAULT_TRANSITION_CONFIG, ...config?.config };
    this.lifecycleHooks = { ...config?.lifecycleHooks || {} };
    this.eventBus = config?.eventBus || null;
    
    // Initialize sub-engines
    this.faceToStoryTransition = new FaceToStoryTransition({
      config: this.config,
      captureFace: config?.captureFace,
    });
    
    this.storyToFaceTransition = new StoryToFaceTransition({
      config: this.config,
      captureScene: config?.captureScene,
    });
    
    this.morphingEngine = new MorphingEngine({
      preset: this.config.morphPreset,
      easing: this.config.easing,
    });
    
    this.dissolveEngine = new DissolveEffectsEngine({
      pattern: this.config.dissolvePattern,
      easing: this.config.easing,
    });
    
    this.timelineController = new TransitionTimelineController({
      hooks: this.lifecycleHooks,
    });
    
    // Set up internal callbacks
    this.setupInternalCallbacks();
  }

  /**
   * Set up internal callbacks between sub-engines
   */
  private setupInternalCallbacks(): void {
    // Face-to-story progress
    this.faceToStoryTransition.onProgress((state) => {
      this.currentProgress = state.progress;
      this.currentPhase = state.phase;
      this.notifyProgressCallbacks();
    });
    
    // Story-to-face progress
    this.storyToFaceTransition.onProgress((state) => {
      this.currentProgress = state.progress;
      this.currentPhase = state.phase;
      this.notifyProgressCallbacks();
    });
    
    // Timeline events
    this.timelineController.onProgress((state) => {
      this.currentProgress = state.progress;
      this.currentPhase = state.phase;
      this.notifyProgressCallbacks();
    });
  }

  /**
   * Transition from face to story
   */
  async faceToStory(targetScene: GeneratedScene): Promise<void> {
    if (this.isRunning) {
      throw new Error('Transition already in progress');
    }
    
    this.isRunning = true;
    this.currentMode = 'face-to-story';
    this.currentState = 'transitioning';
    this.currentProgress = 0;
    this.currentPhase = 'capturing';
    
    this.emit('start', { mode: 'face-to-story' });
    
    try {
      // Execute pre-transition hook
      await this.lifecycleHooks.preStory?.();
      
      // Start the transition
      await this.faceToStoryTransition.transition(targetScene);
      
      // Execute post-transition hook
      await this.lifecycleHooks.postStory?.();
      
      this.currentState = 'complete';
      this.currentPhase = 'complete';
      this.emit('complete', { mode: 'face-to-story' });
      
    } catch (error) {
      this.currentState = 'cancelled';
      this.currentPhase = 'cancelled';
      this.emit('cancel', { mode: 'face-to-story', error });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Transition from story to face
   */
  async storyToFace(targetFace: IFaceState): Promise<void> {
    if (this.isRunning) {
      throw new Error('Transition already in progress');
    }
    
    this.isRunning = true;
    this.currentMode = 'story-to-face';
    this.currentState = 'transitioning';
    this.currentProgress = 0;
    this.currentPhase = 'capturing';
    
    this.emit('start', { mode: 'story-to-face' });
    
    try {
      // Execute pre-transition hook
      await this.lifecycleHooks.preFace?.();
      
      // Start the transition
      await this.storyToFaceTransition.transition(targetFace);
      
      // Execute post-transition hook
      await this.lifecycleHooks.postFace?.();
      
      this.currentState = 'complete';
      this.currentPhase = 'complete';
      this.emit('complete', { mode: 'story-to-face' });
      
    } catch (error) {
      this.currentState = 'cancelled';
      this.currentPhase = 'cancelled';
      this.emit('cancel', { mode: 'story-to-face', error });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Cancel the current transition
   */
  cancel(): void {
    if (!this.isRunning) return;
    
    this.faceToStoryTransition.cancel();
    this.storyToFaceTransition.cancel();
    this.timelineController.interrupt();
    
    this.currentState = 'cancelled';
    this.currentPhase = 'cancelled';
    this.isRunning = false;
    
    this.emit('cancel', { mode: this.currentMode });
  }

  /**
   * Interrupt the current transition
   */
  interrupt(): void {
    this.cancel();
    this.emit('interrupt', { mode: this.currentMode });
  }

  /**
   * Get current state
   */
  getState(): TransitionEngineState {
    return {
      mode: this.currentMode,
      state: this.currentState,
      phase: this.currentPhase,
      progress: this.currentProgress,
      isRunning: this.isRunning,
    };
  }

  /**
   * Get current mode
   */
  getMode(): TransitionMode | null {
    return this.currentMode;
  }

  /**
   * Get current phase
   */
  getPhase(): TransitionPhase {
    return this.currentPhase;
  }

  /**
   * Get transition progress (0-1)
   */
  getProgress(): number {
    return this.currentProgress;
  }

  /**
   * Check if transition is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Subscribe to progress updates
   */
  onProgress(callback: TransitionProgressCallback): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  /**
   * Add event listener
   */
  on(event: string, handler: (event: TransitionEvent) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
    return () => this.eventListeners.get(event)?.delete(handler);
  }

  /**
   * Emit an event
   */
  private emit(type: string, data?: unknown): void {
    const event: TransitionEvent = {
      type: type as any,
      timestamp: performance.now(),
      progress: this.currentProgress,
      phase: this.currentPhase,
      data,
    };
    
    // Emit to internal listeners
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(handler => handler(event));
    }
    
    // Emit to event bus if available
    if (this.eventBus) {
      this.eventBus.emit(`transition:${type}`, event);
    }
  }

  /**
   * Notify all progress callbacks
   */
  private notifyProgressCallbacks(): void {
    this.progressCallbacks.forEach(callback => {
      callback(this.currentProgress, this.currentPhase);
    });
  }

  /**
   * Get the face-to-story transition engine
   */
  getFaceToStoryEngine(): FaceToStoryTransition {
    return this.faceToStoryTransition;
  }

  /**
   * Get the story-to-face transition engine
   */
  getStoryToFaceEngine(): StoryToFaceTransition {
    return this.storyToFaceTransition;
  }

  /**
   * Get the morphing engine
   */
  getMorphingEngine(): MorphingEngine {
    return this.morphingEngine;
  }

  /**
   * Get the dissolve engine
   */
  getDissolveEngine(): DissolveEffectsEngine {
    return this.dissolveEngine;
  }

  /**
   * Get the timeline controller
   */
  getTimelineController(): TransitionTimelineController {
    return this.timelineController;
  }

  /**
   * Set lifecycle hooks
   */
  setLifecycleHooks(hooks: TransitionLifecycleHooks): void {
    this.lifecycleHooks = { ...this.lifecycleHooks, ...hooks };
    this.faceToStoryTransition.setHooks(this.lifecycleHooks);
    this.storyToFaceTransition.setHooks(this.lifecycleHooks);
    this.timelineController.setLifecycleHooks(this.lifecycleHooks);
  }

  /**
   * Set transition hooks
   */
  setHooks(hooks: TransitionHooks): void {
    this.faceToStoryTransition.setHooks(hooks);
    this.storyToFaceTransition.setHooks(hooks);
  }

  /**
   * Set capture functions
   */
  setCaptureFunctions(
    captureFace: () => Promise<FaceCaptureData>,
    captureScene: () => Promise<SceneCaptureData>
  ): void {
    this.faceToStoryTransition = new FaceToStoryTransition({
      config: this.config,
      captureFace,
      onProgress: (state) => {
        this.currentProgress = state.progress;
        this.currentPhase = state.phase;
        this.notifyProgressCallbacks();
      },
    });
    
    this.storyToFaceTransition = new StoryToFaceTransition({
      config: this.config,
      captureScene,
      onProgress: (state) => {
        this.currentProgress = state.progress;
        this.currentPhase = state.phase;
        this.notifyProgressCallbacks();
      },
    });
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<TransitionConfig>): void {
    this.config = { ...this.config, ...config };
    
    this.faceToStoryTransition.setConfig(this.config);
    this.storyToFaceTransition.setConfig(this.config);
    this.morphingEngine.setConfig({
      preset: this.config.morphPreset,
      easing: this.config.easing,
    });
    this.dissolveEngine.setConfig({
      pattern: this.config.dissolvePattern,
      easing: this.config.easing,
    });
  }

  /**
   * Get configuration
   */
  getConfig(): TransitionConfig {
    return { ...this.config };
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.cancel();
    this.currentMode = null;
    this.currentState = 'idle';
    this.currentPhase = 'idle';
    this.currentProgress = 0;
    this.morphingEngine.reset();
    this.dissolveEngine.reset();
    this.timelineController.reset();
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.reset();
    this.progressCallbacks.clear();
    this.eventListeners.clear();
    this.faceToStoryTransition.dispose();
    this.storyToFaceTransition.dispose();
    this.morphingEngine.dispose();
    this.dissolveEngine.dispose();
    this.timelineController.dispose();
  }
}

/**
 * Create a transition engine with default configuration
 */
export function createTransitionEngine(config?: Partial<TransitionEngineConfig>): TransitionEngine {
  return new TransitionEngine(config);
}
