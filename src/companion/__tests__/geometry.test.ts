/**
 * Face Geometry Tests
 */

import { describe, it, expect } from 'vitest';
import {
  FaceGeometryEngine,
  EyeState,
  MouthState,
  DEFAULT_FACE_STATE,
  DEFAULT_FACE_GRID_SIZE,
} from '../geometry';

describe('FaceGeometryEngine', () => {
  describe('constructor', () => {
    it('should create with default 32x32 grid', () => {
      const geometry = new FaceGeometryEngine();
      expect(geometry.GRID_SIZE).toBe(32);
    });

    it('should create with custom grid size', () => {
      const geometry = new FaceGeometryEngine(64);
      expect(geometry.GRID_SIZE).toBe(64);
    });

    it('should throw for invalid grid sizes', () => {
      expect(() => new FaceGeometryEngine(8)).toThrow('Grid size must be between 16 and 128');
      expect(() => new FaceGeometryEngine(200)).toThrow('Grid size must be between 16 and 128');
    });
  });

  describe('feature positions', () => {
    it('should have eye positions defined', () => {
      const geometry = new FaceGeometryEngine();
      expect(geometry.EYE_LEFT).toBeDefined();
      expect(geometry.EYE_RIGHT).toBeDefined();
      expect(geometry.EYE_LEFT.x).toBeLessThan(geometry.EYE_RIGHT.x);
    });

    it('should have mouth position defined', () => {
      const geometry = new FaceGeometryEngine();
      expect(geometry.MOUTH).toBeDefined();
      expect(geometry.MOUTH.y).toBeGreaterThan(geometry.EYE_LEFT.y);
    });

    it('should have eyebrow positions defined', () => {
      const geometry = new FaceGeometryEngine();
      expect(geometry.EYEBROW_LEFT).toBeDefined();
      expect(geometry.EYEBROW_RIGHT).toBeDefined();
      expect(geometry.EYEBROW_LEFT.y).toBeLessThan(geometry.EYE_LEFT.y);
    });
  });

  describe('getEyeBounds', () => {
    it('should return eye bounds based on face state', () => {
      const geometry = new FaceGeometryEngine();
      const state = { ...DEFAULT_FACE_STATE, eyeOpenness: 1.0 };
      const bounds = geometry.getEyeBounds(state);
      
      expect(bounds.left).toBeDefined();
      expect(bounds.right).toBeDefined();
      expect(bounds.left.height).toBeGreaterThan(0);
      expect(bounds.right.height).toBeGreaterThan(0);
    });

    it('should scale eye height with openness', () => {
      const geometry = new FaceGeometryEngine();
      const openState = { ...DEFAULT_FACE_STATE, eyeOpenness: 1.0 };
      const closedState = { ...DEFAULT_FACE_STATE, eyeOpenness: 0.0 };
      
      const openBounds = geometry.getEyeBounds(openState);
      const closedBounds = geometry.getEyeBounds(closedState);
      
      expect(openBounds.left.height).toBeGreaterThan(closedBounds.left.height);
    });
  });

  describe('getMouthBounds', () => {
    it('should return mouth bounds based on face state', () => {
      const geometry = new FaceGeometryEngine();
      const state = { ...DEFAULT_FACE_STATE, mouthOpenness: 0.5 };
      const bounds = geometry.getMouthBounds(state);
      
      expect(bounds).toBeDefined();
      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);
    });

    it('should scale mouth height with openness', () => {
      const geometry = new FaceGeometryEngine();
      const openState = { ...DEFAULT_FACE_STATE, mouthOpenness: 1.0 };
      const closedState = { ...DEFAULT_FACE_STATE, mouthOpenness: 0.0 };
      
      const openBounds = geometry.getMouthBounds(openState);
      const closedBounds = geometry.getMouthBounds(closedState);
      
      expect(openBounds.height).toBeGreaterThan(closedBounds.height);
    });
  });

  describe('calculatePupilPosition', () => {
    it('should calculate center pupil when direction is zero', () => {
      const geometry = new FaceGeometryEngine();
      const state = DEFAULT_FACE_STATE;
      const positions = geometry.calculatePupilPosition({ x: 0, y: 0 }, state);
      
      expect(positions.left).toBeDefined();
      expect(positions.right).toBeDefined();
    });

    it('should offset pupils based on direction', () => {
      const geometry = new FaceGeometryEngine();
      const state = DEFAULT_FACE_STATE;
      
      const centerPositions = geometry.calculatePupilPosition({ x: 0, y: 0 }, state);
      const rightPositions = geometry.calculatePupilPosition({ x: 1, y: 0 }, state);
      
      expect(rightPositions.left.x).toBeGreaterThan(centerPositions.left.x);
    });

    it('should clamp direction values', () => {
      const geometry = new FaceGeometryEngine();
      const state = DEFAULT_FACE_STATE;
      
      const positions = geometry.calculatePupilPosition({ x: 5, y: -10 }, state);
      // Should not throw and should return valid positions
      expect(positions.left.x).toBeDefined();
    });
  });

  describe('getEyePixelPositions', () => {
    it('should return pixel arrays for both eyes', () => {
      const geometry = new FaceGeometryEngine();
      const state = DEFAULT_FACE_STATE;
      const positions = geometry.getEyePixelPositions(state);
      
      expect(positions.left).toBeInstanceOf(Array);
      expect(positions.right).toBeInstanceOf(Array);
      expect(positions.left.length).toBeGreaterThan(0);
      expect(positions.right.length).toBeGreaterThan(0);
    });
  });

  describe('getMouthPixelPositions', () => {
    it('should return pixel array for mouth', () => {
      const geometry = new FaceGeometryEngine();
      const state = DEFAULT_FACE_STATE;
      const positions = geometry.getMouthPixelPositions(state);
      
      expect(positions).toBeInstanceOf(Array);
      expect(positions.length).toBeGreaterThan(0);
    });
  });

  describe('getDefaultState', () => {
    it('should return default face state', () => {
      const geometry = new FaceGeometryEngine();
      const state = geometry.getDefaultState();
      
      expect(state.eyeOpenness).toBe(1.0);
      expect(state.mouthOpenness).toBe(0.0);
      expect(state.mouthCurve).toBe(0.0);
    });
  });

  describe('static helpers', () => {
    it('should convert EyeState to openness values', () => {
      expect(FaceGeometryEngine.eyeStateToOpenness(EyeState.Open)).toBe(1.0);
      expect(FaceGeometryEngine.eyeStateToOpenness(EyeState.Closed)).toBe(0.0);
      expect(FaceGeometryEngine.eyeStateToOpenness(EyeState.HalfOpen)).toBe(0.5);
    });

    it('should convert MouthState to openness and curve values', () => {
      const closed = FaceGeometryEngine.mouthStateToValues(MouthState.Closed);
      expect(closed.openness).toBe(0.0);
      expect(closed.curve).toBe(0.0);
      
      const open = FaceGeometryEngine.mouthStateToValues(MouthState.Open);
      expect(open.openness).toBeGreaterThan(0);
    });
  });
});
