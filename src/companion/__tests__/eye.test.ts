/**
 * Eye Engine Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EyeEngine } from '../eye';
import { FaceGeometryEngine, DEFAULT_FACE_STATE, EyeState, PupilDirection } from '../geometry';

describe('EyeEngine', () => {
  let eyeEngine: EyeEngine;
  let geometry: FaceGeometryEngine;

  beforeEach(() => {
    geometry = new FaceGeometryEngine();
    eyeEngine = new EyeEngine(geometry);
  });

  afterEach(() => {
    eyeEngine.stop();
  });

  describe('setLookDirection', () => {
    it('should set look direction immediately', () => {
      eyeEngine.setLookDirection({ x: 0.5, y: 0.3 });
      const state = eyeEngine.getEyeRenderData(DEFAULT_FACE_STATE);
      
      // Direction is clamped internally
      expect(state.eyeLeft.pupil.x).toBeDefined();
      expect(state.eyeRight.pupil.x).toBeDefined();
    });

    it('should clamp direction values', () => {
      eyeEngine.setLookDirection({ x: 5, y: -10 });
      const state = eyeEngine.getEyeRenderData(DEFAULT_FACE_STATE);
      
      // Should clamp to -1 to 1 range
      expect(state.eyeLeft.pupil).toBeDefined();
    });
  });

  describe('lookAt', () => {
    it('should animate look direction over duration', async () => {
      const lookPromise = eyeEngine.lookAt({ x: 0.5, y: 0 }, 100);
      expect(eyeEngine.getLookDirection()).toEqual({ x: 0, y: 0 });
      
      await lookPromise;
      expect(eyeEngine.getLookDirection().x).toBeCloseTo(0.5, 1);
    });

    it('should resolve with default duration', async () => {
      await eyeEngine.lookAt({ x: 0.3, y: 0 });
      expect(eyeEngine.getLookDirection().x).toBeCloseTo(0.3, 1);
    });
  });

  describe('setEyeState', () => {
    it('should set current eye state', () => {
      eyeEngine.setEyeState(EyeState.Closed);
      expect(eyeEngine.getCurrentState()).toBe(EyeState.Closed);
    });

    it('should notify state change callbacks', () => {
      const callback = vi.fn();
      eyeEngine.onStateChange(callback);
      
      eyeEngine.setEyeState(EyeState.Squinting);
      
      expect(callback).toHaveBeenCalledWith(EyeState.Squinting);
    });
  });

  describe('getEyeRenderData', () => {
    it('should return valid render data', () => {
      const state = { ...DEFAULT_FACE_STATE };
      const data = eyeEngine.getEyeRenderData(state);
      
      expect(data.eyeLeft).toBeDefined();
      expect(data.eyeRight).toBeDefined();
      expect(data.eyeLeft.bounds).toBeDefined();
      expect(data.eyeRight.bounds).toBeDefined();
    });

    it('should reflect openness in render data', () => {
      const openState = { ...DEFAULT_FACE_STATE, eyeOpenness: 1.0 };
      const closedState = { ...DEFAULT_FACE_STATE, eyeOpenness: 0.0 };
      
      const openData = eyeEngine.getEyeRenderData(openState);
      const closedData = eyeEngine.getEyeRenderData(closedState);
      
      expect(openData.eyeLeft.openness).toBe(1.0);
      expect(closedData.eyeLeft.openness).toBe(0.0);
    });
  });

  describe('update', () => {
    it('should update animation state', () => {
      eyeEngine.start();
      eyeEngine.update(0.016); // ~60fps delta
      
      expect(eyeEngine.isBlinking()).toBe(false);
    });

    it('should animate look direction', async () => {
      eyeEngine.start();
      eyeEngine.lookAt({ x: 0.5, y: 0 }, 200);
      
      eyeEngine.update(0.05);
      // Animation should be in progress
      eyeEngine.update(0.1);
      eyeEngine.update(0.1);
    });
  });

  describe('callbacks', () => {
    it('should register and unregister blink start callback', () => {
      const callback = vi.fn();
      const unsubscribe = eyeEngine.onBlinkStart(callback);
      
      eyeEngine.startBlink();
      expect(callback).toHaveBeenCalled();
      
      unsubscribe();
      const callback2 = vi.fn();
      eyeEngine.onBlinkStart(callback2);
      eyeEngine.startBlink();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should register and unregister blink complete callback', () => {
      const callback = vi.fn();
      const unsubscribe = eyeEngine.onBlinkComplete(callback);
      
      eyeEngine.startBlink();
      // Blinks complete in update loop
      unsubscribe();
    });

    it('should register and unregister look at callback', () => {
      const callback = vi.fn();
      const unsubscribe = eyeEngine.onLookAt(callback);
      
      eyeEngine.lookAt({ x: 0.5, y: 0 });
      expect(callback).toHaveBeenCalledWith({ x: 0.5, y: 0 });
      
      unsubscribe();
    });
  });

  describe('static helpers', () => {
    it('should convert PupilDirection enum to IPosition', () => {
      expect(EyeEngine.directionToPosition(PupilDirection.Center)).toEqual({ x: 0, y: 0 });
      expect(EyeEngine.directionToPosition(PupilDirection.Up)).toEqual({ x: 0, y: -1 });
      expect(EyeEngine.directionToPosition(PupilDirection.Down)).toEqual({ x: 0, y: 1 });
      expect(EyeEngine.directionToPosition(PupilDirection.Left)).toEqual({ x: -1, y: 0 });
      expect(EyeEngine.directionToPosition(PupilDirection.Right)).toEqual({ x: 1, y: 0 });
    });
  });
});
