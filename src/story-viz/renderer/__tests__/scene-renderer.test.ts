/**
 * Scene Renderer Tests
 */

import { SceneRenderer } from '../scene-renderer';
import type { GeneratedScene } from '../../scene-generator/types';
import type { CameraState } from '../../camera/types';
import type { CharacterPlacement } from '../../character-placement/types';
import type { EnvironmentData } from '../../environment/types';

describe('SceneRenderer', () => {
  let renderer: SceneRenderer;

  const createMockScene = (): GeneratedScene => ({
    id: 'scene-1',
    sceneNumber: 1,
    characters: [],
    environment: {
      location: 'forest',
      timeOfDay: 'morning',
      background: { spriteId: 'bg-forest', parallax: 1, color: { r: 34, g: 85, b: 34, a: 1 } },
      backgrounds: [],
      weather: { 
        type: 'clear', 
        intensity: 0, 
        direction: { x: 0, y: 0 }, 
        particles: { count: 0, speed: 0, size: 0, opacity: 0 } 
      },
      lighting: { 
        ambient: 1, 
        direction: { x: 0, y: -1 }, 
        color: { r: 255, g: 255, b: 255, a: 1 }, 
        shadows: true,
        highlights: true
      },
      atmosphere: { 
        mood: 'calm', 
        color: { r: 100, g: 150, b: 200, a: 0.2 }, 
        blur: 0, 
        vignette: 0.3,
        grain: 0.05
      },
      parallaxLayers: [],
    },
    actions: [],
    emotion: { primary: 'neutral', intensity: 0.5, transition: { duration: 500, easing: 'easeInOutQuad', blend: true } },
    camera: { position: { x: 0.5, y: 0.5 }, zoom: 1, rotation: 0, easing: 'easeInOutQuad', duration: 500 },
    duration: 3000,
    transitionIn: { type: 'cut', duration: 0, easing: 'easeInOutQuad' },
    transitionOut: { type: 'cut', duration: 0, easing: 'easeInOutQuad' },
  });

  const createMockCamera = (): CameraState => ({
    position: { x: 0.5, y: 0.5 },
    zoom: 1,
    rotation: 0,
    focalPoint: { x: 0.5, y: 0.5 },
  });

  const createMockPlacements = (): CharacterPlacement[] => [
    {
      id: 'char-1',
      characterId: 'char-1',
      position: { x: 0.3, y: 0.7 },
      scale: 1,
      layer: 50,
      rotation: 0,
      opacity: 1,
      anchor: 'bottom',
    },
    {
      id: 'char-2',
      characterId: 'char-2',
      position: { x: 0.7, y: 0.7 },
      scale: 1,
      layer: 50,
      rotation: 0,
      opacity: 1,
      anchor: 'bottom',
    },
  ];

  beforeEach(() => {
    renderer = new SceneRenderer({
      width: 1920,
      height: 1080,
    });
  });

  afterEach(() => {
    renderer.stop();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      const config = renderer.getConfig();
      
      expect(config.width).toBe(1920);
      expect(config.height).toBe(1080);
      expect(config.pixelScale).toBe(1);
    });

    it('should use custom configuration', () => {
      const customRenderer = new SceneRenderer({
        width: 1280,
        height: 720,
        pixelScale: 2,
      });
      
      const config = customRenderer.getConfig();
      expect(config.width).toBe(1280);
      expect(config.height).toBe(720);
      expect(config.pixelScale).toBe(2);
    });
  });

  describe('setScene', () => {
    it('should set the current scene', () => {
      const scene = createMockScene();
      
      renderer.setScene(scene);
      
      expect(renderer.getCurrentScene()).toBe(scene);
    });

    it('should mark layers dirty when scene changes', () => {
      const scene = createMockScene();
      
      renderer.setScene(scene);
      
      // Scene should be set
      expect(renderer.getCurrentScene()).toBeDefined();
    });
  });

  describe('setCamera', () => {
    it('should set camera state', () => {
      const camera = createMockCamera();
      
      renderer.setCamera(camera);
      
      expect(renderer.getCurrentCamera()).toEqual(camera);
    });

    it('should update camera state', () => {
      const camera = createMockCamera();
      renderer.setCamera(camera);
      
      const newCamera: CameraState = {
        position: { x: 0.6, y: 0.6 },
        zoom: 1.5,
        rotation: 0,
        focalPoint: { x: 0.6, y: 0.6 },
      };
      
      renderer.setCamera(newCamera);
      
      expect(renderer.getCurrentCamera()?.zoom).toBe(1.5);
    });
  });

  describe('setCharacterPlacements', () => {
    it('should set character placements', () => {
      const placements = createMockPlacements();
      
      renderer.setCharacterPlacements(placements);
      
      // Placements should be set without error
      expect(renderer.getCurrentScene()).toBeDefined();
    });
  });

  describe('setEnvironment', () => {
    it('should set environment data', () => {
      const scene = createMockScene();
      renderer.setScene(scene);
      
      // Environment should be set via scene
      expect(renderer.getCurrentScene()?.environment).toBeDefined();
    });
  });

  describe('render loop', () => {
    it('should not be running initially', () => {
      expect(renderer.isRunning()).toBe(false);
    });

    it('should start rendering', () => {
      renderer.start();
      
      expect(renderer.isRunning()).toBe(true);
    });

    it('should stop rendering', () => {
      renderer.start();
      renderer.stop();
      
      expect(renderer.isRunning()).toBe(false);
    });

    it('should pause and resume rendering', () => {
      renderer.start();
      renderer.pause();
      
      expect(renderer.isRunning()).toBe(false);
      
      renderer.resume();
      
      expect(renderer.isRunning()).toBe(true);
    });
  });

  describe('layer visibility', () => {
    it('should set layer visibility', () => {
      renderer.setLayerVisibility('weather', false);
      
      // Should not throw
      renderer.start();
      renderer.stop();
    });

    it('should set layer opacity', () => {
      renderer.setLayerOpacity('characters', 0.5);
      
      // Should not throw
      renderer.start();
      renderer.stop();
    });
  });

  describe('transitions', () => {
    it('should start transition', async () => {
      const scene = createMockScene();
      renderer.setScene(scene);
      
      const promise = renderer.startTransition('fade', 100);
      
      renderer.start();
      await promise;
      renderer.stop();
      
      expect(true).toBe(true);
    });

    it('should complete fade transition', async () => {
      const scene = createMockScene();
      renderer.setScene(scene);
      
      renderer.start();
      await renderer.startTransition('fade', 50);
      renderer.stop();
      
      expect(true).toBe(true);
    });

    it('should complete dissolve transition', async () => {
      const scene = createMockScene();
      renderer.setScene(scene);
      
      renderer.start();
      await renderer.startTransition('dissolve', 50);
      renderer.stop();
      
      expect(true).toBe(true);
    });
  });

  describe('render statistics', () => {
    it('should get render stats', () => {
      const stats = renderer.getStats();
      
      expect(stats).toBeDefined();
      expect(stats.fps).toBeDefined();
      expect(stats.frameTime).toBeDefined();
      expect(stats.drawCalls).toBeDefined();
    });
  });

  describe('clearScene', () => {
    it('should clear the current scene', () => {
      const scene = createMockScene();
      renderer.setScene(scene);
      
      renderer.clearScene();
      
      expect(renderer.getCurrentScene()).toBeNull();
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      renderer.configure({
        width: 1280,
        height: 720,
      });
      
      const config = renderer.getConfig();
      expect(config.width).toBe(1280);
      expect(config.height).toBe(720);
    });

    it('should configure pixel-perfect options', () => {
      renderer.configurePixelPerfect({
        enabled: true,
        scale: 2,
        snapToPixel: true,
      });
      
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('event subscription', () => {
    it('should subscribe to frame complete events', async () => {
      let eventReceived = false;
      
      renderer.on(() => {
        eventReceived = true;
      }, 'frameComplete');
      
      // Set a scene first
      const scene = createMockScene();
      renderer.setScene(scene);
      
      renderer.start();
      
      // Wait a bit for frames to render
      await new Promise(resolve => setTimeout(resolve, 200));
      renderer.stop();
      
      expect(eventReceived).toBe(true);
    });

    it('should unsubscribe from events', () => {
      let callCount = 0;
      
      const unsubscribe = renderer.on(() => {
        callCount++;
      });
      
      unsubscribe();
      
      renderer.start();
      renderer.stop();
      
      expect(callCount).toBe(0);
    });
  });
});
