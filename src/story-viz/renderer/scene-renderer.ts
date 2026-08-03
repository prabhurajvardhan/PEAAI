/**
 * Scene Renderer
 * 
 * Combines all scene elements into pixel-perfect rendered output.
 * 
 * Features:
 * - Layer composition system
 * - Pixel-perfect rendering
 * - Scene transitions
 * - Performance optimization
 */

import { IColor, IPosition } from '../../graphics/types';
import type { GeneratedScene } from '../scene-generator/types';
import type { CameraState } from '../camera/types';
import type { CharacterPlacement } from '../character-placement/types';
import type { EnvironmentData } from '../environment/types';
import type {
  RenderLayer,
  RenderLayerData,
  RenderConfig,
  RenderStats,
  TransitionEffect,
  DirtyRegion,
  PixelPerfectOptions,
  SceneRendererEventType,
} from './types';

/**
 * Layer z-indices
 */
const LAYER_Z_INDICES: Record<RenderLayer, number> = {
  background: 0,
  parallax: 10,
  environment: 20,
  characters: 30,
  effects: 40,
  weather: 50,
  atmosphere: 60,
  ui: 100,
};

/**
 * Default render configuration
 */
const DEFAULT_CONFIG: RenderConfig = {
  width: 1920,
  height: 1080,
  pixelScale: 1,
  enableVSync: true,
  enablePerfStats: false,
  backgroundColor: { r: 32, g: 32, b: 32, a: 1 },
  clearEachFrame: true,
};

/**
 * Default pixel-perfect options
 */
const DEFAULT_PIXEL_OPTIONS: PixelPerfectOptions = {
  enabled: true,
  scale: 1,
  snapToPixel: true,
  preserveAspectRatio: true,
};

/**
 * Scene Renderer class
 */
export class SceneRenderer {
  private config: RenderConfig;
  private pixelOptions: PixelPerfectOptions;
  private layers: Map<RenderLayer, RenderLayerData> = new Map();
  private currentScene: GeneratedScene | null = null;
  private currentCamera: CameraState | null = null;
  private currentPlacements: CharacterPlacement[] = [];
  private currentEnvironment: EnvironmentData | null = null;
  private transition: TransitionEffect | null = null;
  private isRendering: boolean = false;
  private frameId: number | null = null;
  private dirtyRegions: DirtyRegion[] = [];
  private stats: RenderStats = {
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    pixelsRendered: 0,
    layersRendered: 0,
  };
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fpsUpdateInterval: number = 500;
  private lastFpsUpdate: number = 0;
  private eventListeners: Map<string, Set<() => void>> = new Map();
  private renderBuffer: Uint8ClampedArray | null = null;
  private offscreenCanvas: OffscreenCanvas | null = null;
  private offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;

  constructor(
    config: Partial<RenderConfig> = {},
    pixelOptions: Partial<PixelPerfectOptions> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.pixelOptions = { ...DEFAULT_PIXEL_OPTIONS, ...pixelOptions };
    this.initializeLayers();
  }

  /**
   * Initialize render layers
   */
  private initializeLayers(): void {
    const layerTypes: RenderLayer[] = [
      'background',
      'parallax',
      'environment',
      'characters',
      'effects',
      'weather',
      'atmosphere',
      'ui',
    ];

    for (const layer of layerTypes) {
      this.layers.set(layer, {
        type: layer,
        zIndex: LAYER_Z_INDICES[layer],
        visible: true,
        opacity: 1,
        dirty: true,
      });
    }
  }

  /**
   * Set the scene to render
   */
  setScene(scene: GeneratedScene): void {
    if (this.currentScene?.id !== scene.id) {
      this.currentScene = scene;
      this.markAllLayersDirty();
      this.emit('sceneChange');
    }
  }

  /**
   * Set camera state
   */
  setCamera(camera: CameraState): void {
    if (this.currentCamera) {
      const positionChanged = 
        this.currentCamera.position.x !== camera.position.x ||
        this.currentCamera.position.y !== camera.position.y ||
        this.currentCamera.zoom !== camera.zoom;
      
      if (positionChanged) {
        this.currentCamera = camera;
        this.markLayerDirty('characters');
        this.markLayerDirty('effects');
      }
    } else {
      this.currentCamera = camera;
    }
  }

  /**
   * Set character placements
   */
  setCharacterPlacements(placements: CharacterPlacement[]): void {
    this.currentPlacements = placements;
    this.markLayerDirty('characters');
  }

  /**
   * Set environment data
   */
  setEnvironment(environment: EnvironmentData): void {
    this.currentEnvironment = environment;
    this.markLayerDirty('background');
    this.markLayerDirty('weather');
    this.markLayerDirty('atmosphere');
  }

  /**
   * Start the render loop
   */
  start(): void {
    if (this.isRendering) return;

    this.isRendering = true;
    this.lastFrameTime = performance.now();
    this.lastFpsUpdate = this.lastFrameTime;
    this.runLoop();
  }

  /**
   * Stop the render loop
   */
  stop(): void {
    this.isRendering = false;
    
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  /**
   * Pause rendering
   */
  pause(): void {
    this.isRendering = false;
  }

  /**
   * Resume rendering
   */
  resume(): void {
    if (!this.isRendering) {
      this.isRendering = true;
      this.lastFrameTime = performance.now();
      this.runLoop();
    }
  }

  /**
   * Run the render loop
   */
  private runLoop = (): void => {
    if (!this.isRendering) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Update FPS counter
    this.frameCount++;
    if (currentTime - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      this.stats.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }

    this.stats.frameTime = deltaTime;
    this.render();

    this.frameId = requestAnimationFrame(this.runLoop);
  };

  /**
   * Main render function
   */
  render(): void {
    if (!this.currentScene) return;

    const startTime = performance.now();
    this.emit('renderStart');

    this.stats.drawCalls = 0;
    this.stats.pixelsRendered = 0;
    this.stats.layersRendered = 0;

    // Clear if needed
    if (this.config.clearEachFrame) {
      this.clear();
    }

    // Update transition
    if (this.transition) {
      this.updateTransition();
    }

    // Render layers in order
    const sortedLayers = Array.from(this.layers.values())
      .filter(layer => layer.visible && !layer.dirty === false)
      .sort((a, b) => a.zIndex - b.zIndex);

    for (const layer of sortedLayers) {
      this.renderLayer(layer.type);
      this.stats.layersRendered++;
      layer.dirty = false;
    }

    // Update dirty regions
    this.updateDirtyRegions();

    const endTime = performance.now();
    this.stats.frameTime = endTime - startTime;
    this.stats.pixelsRendered = this.config.width * this.config.height;

    this.emit('renderComplete');
    this.emit('frameComplete');
  }

  /**
   * Render a specific layer
   */
  private renderLayer(layerType: RenderLayer): void {
    const layer = this.layers.get(layerType);
    if (!layer || !layer.visible) return;

    switch (layerType) {
      case 'background':
        this.renderBackground();
        break;
      case 'parallax':
        this.renderParallax();
        break;
      case 'environment':
        this.renderEnvironment();
        break;
      case 'characters':
        this.renderCharacters();
        break;
      case 'effects':
        this.renderEffects();
        break;
      case 'weather':
        this.renderWeather();
        break;
      case 'atmosphere':
        this.renderAtmosphere();
        break;
      case 'ui':
        this.renderUI();
        break;
    }

    this.stats.drawCalls++;
  }

  /**
   * Render background layer
   */
  private renderBackground(): void {
    if (!this.currentEnvironment) return;

    const bg = this.currentEnvironment.backgrounds[0];
    if (!bg) return;

    // Render gradient background if available
    // Background can have a gradient property in some implementations
    const hasGradient = 'gradient' in bg && (bg as unknown as { gradient?: unknown }).gradient !== undefined;
    if (hasGradient) {
      // Pixel-perfect gradient rendering would go here
      this.stats.drawCalls++;
    }
  }

  /**
   * Render parallax layers
   */
  private renderParallax(): void {
    if (!this.currentEnvironment || !this.currentCamera) return;

    const cameraOffset = this.getCameraOffset();

    for (const parallaxLayer of this.currentEnvironment.parallaxLayers) {
      const scrollOffset = {
        x: cameraOffset.x * parallaxLayer.scrollFactor,
        y: cameraOffset.y * parallaxLayer.scrollFactor * 0.5,
      };

      // Parallax rendering would go here
      this.stats.drawCalls++;
    }
  }

  /**
   * Render environment elements
   */
  private renderEnvironment(): void {
    if (!this.currentEnvironment) return;

    // Environment props and decorations would be rendered here
    this.stats.drawCalls++;
  }

  /**
   * Render characters
   */
  private renderCharacters(): void {
    if (this.currentPlacements.length === 0) return;

    // Sort by layer for proper depth
    const sortedPlacements = [...this.currentPlacements].sort((a, b) => a.layer - b.layer);

    for (const placement of sortedPlacements) {
      this.renderCharacter(placement);
      this.stats.drawCalls++;
    }
  }

  /**
   * Render a single character
   */
  private renderCharacter(placement: CharacterPlacement): void {
    if (!this.currentCamera) return;

    // Calculate screen position with camera transform
    const screenPos = this.worldToScreen(placement.position);
    
    // Apply pixel-perfect positioning
    if (this.pixelOptions.snapToPixel) {
      screenPos.x = Math.round(screenPos.x);
      screenPos.y = Math.round(screenPos.y);
    }

    // Character sprite would be rendered here
    // This is where we would draw the character's pixel sprite
  }

  /**
   * Render effects layer
   */
  private renderEffects(): void {
    if (!this.currentScene) return;

    // Visual effects (particles, glow, etc.) would be rendered here
    this.stats.drawCalls++;
  }

  /**
   * Render weather effects
   */
  private renderWeather(): void {
    if (!this.currentEnvironment) return;

    const weather = this.currentEnvironment.weather;
    if (weather.intensity <= 0) return;

    // Weather particles would be rendered here
    for (const particle of weather.particles) {
      if (particle.active) {
        // Particle rendering would go here
        this.stats.drawCalls++;
      }
    }
  }

  /**
   * Render atmosphere effects
   */
  private renderAtmosphere(): void {
    if (!this.currentEnvironment) return;

    const atmosphere = this.currentEnvironment.atmosphere;

    // Vignette effect
    if (atmosphere.vignette.enabled) {
      this.renderVignette(atmosphere.vignette);
    }

    // Grain effect
    if (atmosphere.grain.enabled) {
      this.renderGrain(atmosphere.grain);
    }

    this.stats.drawCalls++;
  }

  /**
   * Render vignette effect
   */
  private renderVignette(config: { intensity: number; radius: number; softness: number; color: IColor }): void {
    // Vignette rendering would go here
  }

  /**
   * Render grain effect
   */
  private renderGrain(config: { intensity: number; size: number; animated: boolean }): void {
    // Grain rendering would go here
  }

  /**
   * Render UI layer
   */
  private renderUI(): void {
    // UI elements would be rendered here
  }

  /**
   * Clear the canvas
   */
  private clear(): void {
    // Clear would be called on the actual canvas
  }

  /**
   * Get camera offset for parallax
   */
  private getCameraOffset(): IPosition {
    if (!this.currentCamera) {
      return { x: 0, y: 0 };
    }

    return {
      x: (this.currentCamera.position.x - 0.5) * this.config.width * this.currentCamera.zoom,
      y: (this.currentCamera.position.y - 0.5) * this.config.height * this.currentCamera.zoom,
    };
  }

  /**
   * Convert world position to screen position
   */
  private worldToScreen(worldPos: IPosition): IPosition {
    const cameraOffset = this.getCameraOffset();
    const zoom = this.currentCamera?.zoom || 1;

    return {
      x: worldPos.x * this.config.width * this.pixelOptions.scale - cameraOffset.x,
      y: worldPos.y * this.config.height * this.pixelOptions.scale - cameraOffset.y,
    };
  }

  /**
   * Update transition effect
   */
  private updateTransition(): void {
    if (!this.transition) return;

    const elapsed = performance.now() - this.transition.startTime;
    this.transition.progress = Math.min(elapsed / this.transition.duration, 1);

    if (this.transition.progress >= 1) {
      this.transition = null;
      this.emit('transitionComplete');
    }
  }

  /**
   * Update dirty regions for optimization
   */
  private updateDirtyRegions(): void {
    // Dirty region tracking for optimization would go here
  }

  /**
   * Start a scene transition
   */
  startTransition(type: TransitionEffect['type'], duration: number = 500): Promise<void> {
    return new Promise((resolve) => {
      this.transition = {
        type,
        progress: 0,
        duration,
        startTime: performance.now(),
      };

      this.emit('transitionStart');

      const checkComplete = () => {
        if (!this.transition || this.transition.progress >= 1) {
          resolve();
        } else {
          requestAnimationFrame(checkComplete);
        }
      };

      checkComplete();
    });
  }

  /**
   * Mark a layer as dirty (needs re-rendering)
   */
  markLayerDirty(layer: RenderLayer): void {
    const layerData = this.layers.get(layer);
    if (layerData) {
      layerData.dirty = true;
    }
  }

  /**
   * Mark all layers as dirty
   */
  markAllLayersDirty(): void {
    for (const layer of this.layers.values()) {
      layer.dirty = true;
    }
  }

  /**
   * Set layer visibility
   */
  setLayerVisibility(layer: RenderLayer, visible: boolean): void {
    const layerData = this.layers.get(layer);
    if (layerData) {
      layerData.visible = visible;
      layerData.dirty = true;
    }
  }

  /**
   * Set layer opacity
   */
  setLayerOpacity(layer: RenderLayer, opacity: number): void {
    const layerData = this.layers.get(layer);
    if (layerData) {
      layerData.opacity = Math.max(0, Math.min(1, opacity));
      layerData.dirty = true;
    }
  }

  /**
   * Get render statistics
   */
  getStats(): Readonly<RenderStats> {
    return { ...this.stats };
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<RenderConfig> {
    return { ...this.config };
  }

  /**
   * Configure the renderer
   */
  configure(config: Partial<RenderConfig>): void {
    this.config = { ...this.config, ...config };
    this.markAllLayersDirty();
  }

  /**
   * Configure pixel-perfect options
   */
  configurePixelPerfect(options: Partial<PixelPerfectOptions>): void {
    this.pixelOptions = { ...this.pixelOptions, ...options };
    this.markAllLayersDirty();
  }

  /**
   * Subscribe to renderer events
   */
  on(callback: () => void, eventType?: SceneRendererEventType): () => void {
    const event = eventType || 'frameComplete';
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback());
    }
  }

  /**
   * Clear the current scene
   */
  clearScene(): void {
    this.currentScene = null;
    this.currentCamera = null;
    this.currentPlacements = [];
    this.currentEnvironment = null;
    this.transition = null;
    this.markAllLayersDirty();
  }

  /**
   * Get current scene
   */
  getCurrentScene(): GeneratedScene | null {
    return this.currentScene;
  }

  /**
   * Get current camera state
   */
  getCurrentCamera(): CameraState | null {
    return this.currentCamera;
  }

  /**
   * Check if renderer is running
   */
  isRunning(): boolean {
    return this.isRendering;
  }
}

export default SceneRenderer;
