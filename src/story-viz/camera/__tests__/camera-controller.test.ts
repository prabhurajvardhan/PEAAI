/**
 * Camera Controller Tests
 */

import { CameraController } from '../camera-controller';
import type { CameraPreset, EasingPreset } from '../types';

describe('CameraController', () => {
  let camera: CameraController;

  beforeEach(() => {
    camera = new CameraController();
  });

  afterEach(() => {
    camera.reset();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const state = camera.getState();
      
      expect(state.position.x).toBe(0.5);
      expect(state.position.y).toBe(0.5);
      expect(state.zoom).toBe(1);
      expect(state.rotation).toBe(0);
    });

    it('should use custom configuration', () => {
      const customCamera = new CameraController({
        defaultZoom: 2,
        canvasWidth: 1920,
        canvasHeight: 1080,
      });
      
      const state = customCamera.getState();
      expect(state.zoom).toBe(2);
    });
  });

  describe('pan', () => {
    it('should pan left', async () => {
      const initialX = camera.getState().position.x;
      
      await camera.pan({
        direction: 'left',
        distance: 0.2,
        duration: 100,
        easing: 'linear',
      });
      
      const state = camera.getState();
      expect(state.position.x).toBeLessThan(initialX);
    });

    it('should pan right', async () => {
      const initialX = camera.getState().position.x;
      
      await camera.pan({
        direction: 'right',
        distance: 0.2,
        duration: 100,
        easing: 'linear',
      });
      
      const state = camera.getState();
      expect(state.position.x).toBeGreaterThan(initialX);
    });

    it('should pan up', async () => {
      const initialY = camera.getState().position.y;
      
      await camera.pan({
        direction: 'up',
        distance: 0.2,
        duration: 100,
        easing: 'linear',
      });
      
      const state = camera.getState();
      expect(state.position.y).toBeLessThan(initialY);
    });

    it('should pan down', async () => {
      const initialY = camera.getState().position.y;
      
      await camera.pan({
        direction: 'down',
        distance: 0.2,
        duration: 100,
        easing: 'linear',
      });
      
      const state = camera.getState();
      expect(state.position.y).toBeGreaterThan(initialY);
    });

    it('should constrain pan within bounds', async () => {
      await camera.pan({
        direction: 'left',
        distance: 5, // Very large, should be constrained
        duration: 100,
        easing: 'linear',
      });
      
      const state = camera.getState();
      expect(state.position.x).toBeGreaterThanOrEqual(-1); // minX bound
    });
  });

  describe('zoom', () => {
    it('should zoom in', async () => {
      const initialZoom = camera.getState().zoom;
      
      await camera.zoom({
        target: 2,
        duration: 100,
        easing: 'linear',
      });
      
      const state = camera.getState();
      expect(state.zoom).toBe(2);
      expect(state.zoom).toBeGreaterThan(initialZoom);
    });

    it('should zoom out', async () => {
      await camera.zoom({ target: 2, duration: 50, easing: 'linear' });
      const zoomedIn = camera.getState().zoom;
      
      await camera.zoom({
        target: 0.5,
        duration: 100,
        easing: 'linear',
      });
      
      const state = camera.getState();
      expect(state.zoom).toBe(0.5);
      expect(state.zoom).toBeLessThan(zoomedIn);
    });

    it('should constrain zoom within bounds', async () => {
      await camera.zoom({
        target: 100, // Very large, should be constrained
        duration: 100,
        easing: 'linear',
      });
      
      const state = camera.getState();
      expect(state.zoom).toBeLessThanOrEqual(3); // maxZoom bound
    });

    it('should use focal point for zoom', async () => {
      const focalPoint = { x: 0.3, y: 0.7 };
      
      await camera.zoom({
        target: 2,
        focalPoint,
        duration: 100,
        easing: 'linear',
      });
      
      const state = camera.getState();
      expect(state.focalPoint).toEqual(focalPoint);
    });
  });

  describe('zoomIn/zoomOut', () => {
    it('should zoom in by factor', async () => {
      const initialZoom = camera.getZoom();
      
      await camera.zoomIn(1.5, 50);
      
      expect(camera.getZoom()).toBe(initialZoom * 1.5);
    });

    it('should zoom out by factor', async () => {
      await camera.zoomIn(2, 50);
      const zoomedIn = camera.getZoom();
      
      await camera.zoomOut(2, 50);
      
      expect(camera.getZoom()).toBeCloseTo(zoomedIn / 2);
    });
  });

  describe('shake', () => {
    it('should complete shake animation', async () => {
      const promise = camera.shake({
        intensity: 5,
        frequency: 10,
        duration: 200,
      });
      
      await promise;
      
      // Shake should complete
      expect(true).toBe(true);
    });
  });

  describe('presets', () => {
    it('should apply wide preset', async () => {
      await camera.applyPreset('wide', 100);
      
      const state = camera.getState();
      expect(state.zoom).toBe(0.7);
    });

    it('should apply closeup preset', async () => {
      await camera.applyPreset('closeup', 100);
      
      const state = camera.getState();
      expect(state.zoom).toBe(1.5);
    });

    it('should apply establishing preset', async () => {
      await camera.applyPreset('establishing', 100);
      
      const state = camera.getState();
      expect(state.zoom).toBe(0.5);
    });

    it('should throw error for unknown preset', async () => {
      await expect(camera.applyPreset('unknown' as CameraPreset, 100))
        .rejects.toThrow('Unknown camera preset');
    });
  });

  describe('moveTo', () => {
    it('should move to specific position', async () => {
      await camera.moveTo({ x: 0.8, y: 0.3 }, 100, 'linear');
      
      const state = camera.getState();
      expect(state.position.x).toBe(0.8);
      expect(state.position.y).toBe(0.3);
    });

    it('should constrain position within bounds', async () => {
      await camera.moveTo({ x: 10, y: 10 }, 100, 'linear');
      
      const state = camera.getState();
      expect(state.position.x).toBeLessThanOrEqual(2);
      expect(state.position.y).toBeLessThanOrEqual(2);
    });
  });

  describe('reset', () => {
    it('should reset camera to default state', async () => {
      await camera.moveTo({ x: 0.8, y: 0.8 }, 50, 'linear');
      await camera.zoom({ target: 2, duration: 50, easing: 'linear' });
      
      camera.reset();
      
      const state = camera.getState();
      expect(state.position.x).toBe(0.5);
      expect(state.position.y).toBe(0.5);
      expect(state.zoom).toBe(1);
    });
  });

  describe('event subscription', () => {
    it('should receive movement updates', async () => {
      const updates: number[] = [];
      
      camera.on(({ state }) => {
        updates.push(state.zoom);
      });
      
      await camera.zoom({ target: 1.5, duration: 100, easing: 'linear' });
      
      expect(updates.length).toBeGreaterThan(1);
    });
  });

  describe('configuration', () => {
    it('should allow configuration updates', () => {
      camera.configure({
        defaultZoom: 1.5,
      });
      
      const config = camera.getConfig();
      expect(config.defaultZoom).toBe(1.5);
    });

    it('should update bounds', () => {
      camera.configure({
        bounds: {
          minX: -2,
          maxX: 3,
          minY: -2,
          maxY: 3,
          minZoom: 0.25,
          maxZoom: 5,
        },
      });
      
      const config = camera.getConfig();
      expect(config.bounds.minZoom).toBe(0.25);
      expect(config.bounds.maxZoom).toBe(5);
    });
  });
});
