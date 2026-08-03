/**
 * Camera Controller
 * 
 * Manages camera movements, zoom, and transitions for story scenes.
 * 
 * Features:
 * - Pan movements (horizontal and vertical)
 * - Zoom levels (in/out with focal point support)
 * - Camera easing (multiple easing functions)
 * - Camera presets (predefined camera positions)
 * - Smooth transitions between camera states
 */

import { IPosition } from '../../graphics/types';
import type {
  CameraState,
  CameraMovement,
  CameraMovementType,
  CameraDirection,
  CameraPreset,
  EasingPreset,
  PanConfig,
  ZoomConfig,
  TrackConfig,
  ShakeConfig,
  OrbitConfig,
  CameraControllerConfig,
  CameraBounds,
} from './types';

/**
 * Default camera bounds
 */
const DEFAULT_BOUNDS: CameraBounds = {
  minX: -1,
  maxX: 2,
  minY: -1,
  maxY: 2,
  minZoom: 0.5,
  maxZoom: 3,
};

/**
 * Default camera presets
 */
const DEFAULT_PRESETS: Record<CameraPreset, CameraControllerConfig['presets'][CameraPreset]> = {
  wide: {
    position: { x: 0.5, y: 0.5 },
    zoom: 0.7,
    rotation: 0,
    focalLength: 50,
  },
  medium: {
    position: { x: 0.5, y: 0.5 },
    zoom: 1,
    rotation: 0,
    focalLength: 35,
  },
  closeup: {
    position: { x: 0.5, y: 0.5 },
    zoom: 1.5,
    rotation: 0,
    focalLength: 85,
  },
  extreme_closeup: {
    position: { x: 0.5, y: 0.5 },
    zoom: 2.5,
    rotation: 0,
    focalLength: 200,
  },
  over_shoulder: {
    position: { x: 0.3, y: 0.5 },
    zoom: 1.2,
    rotation: 15,
    focalLength: 50,
  },
  pov: {
    position: { x: 0.5, y: 0.5 },
    zoom: 1,
    rotation: 0,
    focalLength: 28,
  },
  establishing: {
    position: { x: 0.5, y: 0.5 },
    zoom: 0.5,
    rotation: 0,
    focalLength: 24,
  },
};

/**
 * Default controller configuration
 */
const DEFAULT_CONFIG: Omit<CameraControllerConfig, 'presets'> = {
  canvasWidth: 1920,
  canvasHeight: 1080,
  defaultZoom: 1,
  bounds: DEFAULT_BOUNDS,
  defaultEasing: 'easeInOutQuad',
};

/**
 * Easing functions map
 */
const EASING_FUNCTIONS: Record<EasingPreset, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  easeInElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeInOutElastic: (t) => {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },
  easeInBounce: (t) => 1 - EASING_FUNCTIONS.easeOutBounce(1 - t),
  easeOutBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  easeInOutBounce: (t) => (t < 0.5 ? (1 - EASING_FUNCTIONS.easeOutBounce(1 - 2 * t)) / 2 : (1 + EASING_FUNCTIONS.easeOutBounce(2 * t - 1)) / 2),
};

/**
 * Camera Controller class
 */
export class CameraController {
  private state: CameraState;
  private config: CameraControllerConfig;
  private isAnimating: boolean = false;
  private animationId: number | null = null;
  private startTime: number = 0;
  private currentMovement: CameraMovement | null = null;
  private eventListeners: Map<string, Set<(event: { state: CameraState }) => void>> = new Map();
  private shakeOffset: IPosition = { x: 0, y: 0 };

  constructor(config: Partial<CameraControllerConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      presets: { ...DEFAULT_PRESETS, ...config.presets },
    };

    this.state = {
      position: { x: 0.5, y: 0.5 },
      zoom: this.config.defaultZoom,
      rotation: 0,
      focalPoint: { x: 0.5, y: 0.5 },
    };
  }

  /**
   * Get current camera state
   */
  getState(): CameraState {
    return { ...this.state };
  }

  /**
   * Get current position with shake offset
   */
  getPosition(): IPosition {
    return {
      x: this.state.position.x + this.shakeOffset.x,
      y: this.state.position.y + this.shakeOffset.y,
    };
  }

  /**
   * Get current zoom level
   */
  getZoom(): number {
    return this.state.zoom;
  }

  /**
   * Pan the camera in a direction
   */
  pan(config: PanConfig): Promise<void> {
    return new Promise((resolve) => {
      const fromState = this.getState();
      let targetPosition: IPosition;

      if (typeof config.direction === 'string') {
        targetPosition = this.getPositionFromDirection(config.direction, config.distance);
      } else {
        targetPosition = {
          x: this.state.position.x + config.direction.x * config.distance,
          y: this.state.position.y + config.direction.y * config.distance,
        };
      }

      const toState: CameraState = {
        ...fromState,
        position: this.constrainPosition(targetPosition),
      };

      this.executeMovement({
        type: 'pan',
        from: fromState,
        to: toState,
        duration: config.duration,
        easing: config.easing,
      }, resolve);
    });
  }

  /**
   * Get position from direction string
   */
  private getPositionFromDirection(direction: CameraDirection, distance: number): IPosition {
    switch (direction) {
      case 'left':
        return { x: this.state.position.x - distance, y: this.state.position.y };
      case 'right':
        return { x: this.state.position.x + distance, y: this.state.position.y };
      case 'up':
        return { x: this.state.position.x, y: this.state.position.y - distance };
      case 'down':
        return { x: this.state.position.x, y: this.state.position.y + distance };
    }
  }

  /**
   * Zoom the camera
   */
  zoom(config: ZoomConfig): Promise<void> {
    return new Promise((resolve) => {
      const fromState = this.getState();
      const targetZoom = Math.max(
        this.config.bounds.minZoom,
        Math.min(this.config.bounds.maxZoom, config.target)
      );

      const toState: CameraState = {
        ...fromState,
        zoom: targetZoom,
        focalPoint: config.focalPoint || fromState.focalPoint,
      };

      this.executeMovement({
        type: 'zoom',
        from: fromState,
        to: toState,
        duration: config.duration,
        easing: config.easing,
      }, resolve);
    });
  }

  /**
   * Zoom in by a factor
   */
  zoomIn(factor: number = 1.2, duration: number = 500): Promise<void> {
    return this.zoom({
      target: this.state.zoom * factor,
      duration,
      easing: this.config.defaultEasing,
    });
  }

  /**
   * Zoom out by a factor
   */
  zoomOut(factor: number = 1.2, duration: number = 500): Promise<void> {
    return this.zoom({
      target: this.state.zoom / factor,
      duration,
      easing: this.config.defaultEasing,
    });
  }

  /**
   * Track a target (follow with camera)
   */
  track(config: TrackConfig): Promise<void> {
    return new Promise((resolve) => {
      const fromState = this.getState();
      const toState: CameraState = {
        ...fromState,
        position: {
          x: config.offset.x + config.lookAhead,
          y: config.offset.y,
        },
      };

      this.executeMovement({
        type: 'track',
        from: fromState,
        to: toState,
        duration: config.duration,
        easing: config.easing,
      }, resolve);
    });
  }

  /**
   * Shake the camera
   */
  shake(config: ShakeConfig): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const originalPosition = { ...this.state.position };

      const shake = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / config.duration, 1);

        if (progress < 1) {
          const intensity = config.intensity * (1 - progress);
          const frequency = config.frequency;
          const time = elapsed / 1000;

          this.shakeOffset = {
            x: Math.sin(time * frequency * Math.PI * 2) * intensity * 0.01,
            y: Math.cos(time * frequency * Math.PI * 2 * 1.3) * intensity * 0.01,
          };

          this.animationId = requestAnimationFrame(shake);
        } else {
          this.shakeOffset = { x: 0, y: 0 };
          this.state.position = originalPosition;
          resolve();
        }
      };

      shake();
    });
  }

  /**
   * Apply a camera preset
   */
  applyPreset(preset: CameraPreset, duration: number = 500): Promise<void> {
    const presetConfig = this.config.presets[preset];
    if (!presetConfig) {
      return Promise.reject(new Error(`Unknown camera preset: ${preset}`));
    }

    return new Promise((resolve) => {
      const fromState = this.getState();
      const toState: CameraState = {
        position: presetConfig.position,
        zoom: presetConfig.zoom,
        rotation: presetConfig.rotation,
        focalPoint: presetConfig.position,
      };

      this.executeMovement({
        type: 'pan',
        from: fromState,
        to: toState,
        duration,
        easing: this.config.defaultEasing,
      }, resolve);

      this.emit('presetChange', { state: this.state });
    });
  }

  /**
   * Move camera to specific position
   */
  moveTo(position: IPosition, duration: number = 500, easing: EasingPreset = this.config.defaultEasing): Promise<void> {
    return new Promise((resolve) => {
      const fromState = this.getState();
      const toState: CameraState = {
        ...fromState,
        position: this.constrainPosition(position),
      };

      this.executeMovement({
        type: 'pan',
        from: fromState,
        to: toState,
        duration,
        easing,
      }, resolve);
    });
  }

  /**
   * Execute a camera movement with animation
   */
  private executeMovement(movement: CameraMovement, onComplete: () => void): void {
    if (this.isAnimating) {
      this.cancelCurrentMovement();
    }

    this.currentMovement = movement;
    this.isAnimating = true;
    this.startTime = performance.now();

    this.emit('movementStart', { state: this.state });

    const animate = () => {
      if (!this.isAnimating || !this.currentMovement) {
        return;
      }

      const elapsed = performance.now() - this.startTime;
      const progress = Math.min(elapsed / movement.duration, 1);
      const easedProgress = EASING_FUNCTIONS[movement.easing](progress);

      // Interpolate state
      this.state = {
        position: {
          x: movement.from.position.x + (movement.to.position.x - movement.from.position.x) * easedProgress,
          y: movement.from.position.y + (movement.to.position.y - movement.from.position.y) * easedProgress,
        },
        zoom: movement.from.zoom + (movement.to.zoom - movement.from.zoom) * easedProgress,
        rotation: movement.from.rotation + (movement.to.rotation - movement.from.rotation) * easedProgress,
        focalPoint: {
          x: movement.from.focalPoint.x + (movement.to.focalPoint.x - movement.from.focalPoint.x) * easedProgress,
          y: movement.from.focalPoint.y + (movement.to.focalPoint.y - movement.from.focalPoint.y) * easedProgress,
        },
      };

      this.emit('movementUpdate', { state: this.state });

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
        this.currentMovement = null;
        this.emit('movementComplete', { state: this.state });
        onComplete();
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  /**
   * Cancel current movement
   */
  private cancelCurrentMovement(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isAnimating = false;
    this.currentMovement = null;
  }

  /**
   * Constrain position within bounds
   */
  private constrainPosition(position: IPosition): IPosition {
    return {
      x: Math.max(this.config.bounds.minX, Math.min(this.config.bounds.maxX, position.x)),
      y: Math.max(this.config.bounds.minY, Math.min(this.config.bounds.maxY, position.y)),
    };
  }

  /**
   * Check if camera is currently animating
   */
  isAnimatingMovement(): boolean {
    return this.isAnimating;
  }

  /**
   * Reset camera to default state
   */
  reset(): void {
    this.cancelCurrentMovement();
    this.state = {
      position: { x: 0.5, y: 0.5 },
      zoom: this.config.defaultZoom,
      rotation: 0,
      focalPoint: { x: 0.5, y: 0.5 },
    };
    this.shakeOffset = { x: 0, y: 0 };
  }

  /**
   * Subscribe to camera events
   */
  on(callback: (event: { state: CameraState }) => void): () => void {
    return this.addEventListener('movementUpdate', callback);
  }

  /**
   * Add event listener
   */
  private addEventListener(event: string, callback: (event: { state: CameraState }) => void): () => void {
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
  private emit(event: string, data: { state: CameraState }): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Update configuration
   */
  configure(config: Partial<CameraControllerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      presets: { ...this.config.presets, ...config.presets },
      bounds: { ...this.config.bounds, ...config.bounds },
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<CameraControllerConfig> {
    return { ...this.config };
  }
}

export default CameraController;
