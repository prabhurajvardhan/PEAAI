/**
 * Mouth Engine Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MouthEngine, MOUTH_EXPRESSIONS, PHONEME_MAP } from '../mouth';
import { DEFAULT_MOUTH_CONFIG, MOUTH_EXPRESSIONS as MOUTH_EXPRS } from '../mouth/types';
import { FaceGeometryEngine, DEFAULT_FACE_STATE } from '../geometry';

describe('MouthEngine', () => {
  let mouthEngine: MouthEngine;
  let geometry: FaceGeometryEngine;

  beforeEach(() => {
    geometry = new FaceGeometryEngine();
    mouthEngine = new MouthEngine(geometry);
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      expect(mouthEngine).toBeDefined();
    });

    it('should accept custom config', () => {
      const customEngine = new MouthEngine(geometry, {
        lipColor: { r: 200, g: 50, b: 50, a: 255 },
      });
      
      expect(customEngine).toBeDefined();
    });
  });

  describe('setExpression', () => {
    it('should set expression', () => {
      mouthEngine.setExpression('smile');
      expect(mouthEngine.getCurrentExpression()).toBe('smile');
    });

    it('should update expression values', () => {
      mouthEngine.setExpression('big_smile');
      // Expression should be set
      expect(mouthEngine.getCurrentExpression()).toBe('big_smile');
    });
  });

  describe('setMouthState', () => {
    it('should set mouth state', () => {
      mouthEngine.setMouthState('open' as any);
      // Should not throw
    });
  });

  describe('setLipSync', () => {
    it('should set lip sync data', () => {
      mouthEngine.setLipSync({
        phoneme: 'A',
        mouthOpenness: 0.7,
        mouthWidth: 1.0,
        tonguePosition: 0,
      });
      // Should not throw
    });

    it('should clear lip sync', () => {
      mouthEngine.setLipSync({
        phoneme: 'A',
        mouthOpenness: 0.7,
        mouthWidth: 1.0,
        tonguePosition: 0,
      });
      mouthEngine.clearLipSync();
      // Should not throw
    });
  });

  describe('getCurrentExpression', () => {
    it('should return current expression', () => {
      mouthEngine.setExpression('neutral');
      expect(mouthEngine.getCurrentExpression()).toBe('neutral');
    });
  });

  describe('getMouthRenderData', () => {
    it('should return valid render data', () => {
      const state = DEFAULT_FACE_STATE;
      const data = mouthEngine.getMouthRenderData(state);
      
      expect(data).toBeDefined();
      expect(data.bounds).toBeDefined();
      expect(data.shape).toBeDefined();
    });

    it('should reflect expression in render data', () => {
      mouthEngine.setExpression('smile');
      const state = DEFAULT_FACE_STATE;
      const data = mouthEngine.getMouthRenderData(state);
      
      expect(data.curve).toBeGreaterThan(0);
    });
  });

  describe('getMouthPixelPositions', () => {
    it('should return pixel positions', () => {
      const state = DEFAULT_FACE_STATE;
      const positions = mouthEngine.getMouthPixelPositions(state);
      
      expect(positions).toBeInstanceOf(Array);
      expect(positions.length).toBeGreaterThan(0);
    });
  });

  describe('update', () => {
    it('should update animation state', () => {
      mouthEngine.update(0.016);
      // Should not throw
    });

    it('should fade lip sync', () => {
      mouthEngine.setLipSync({
        phoneme: 'A',
        mouthOpenness: 0.7,
        mouthWidth: 1.0,
        tonguePosition: 0,
      });
      mouthEngine.update(1.0);
      // Lip sync should fade
    });
  });

  describe('MOUTH_EXPRESSIONS', () => {
    it('should have all expected expressions', () => {
      expect(MOUTH_EXPRESSIONS.neutral).toBeDefined();
      expect(MOUTH_EXPRESSIONS.smile).toBeDefined();
      expect(MOUTH_EXPRESSIONS.frown).toBeDefined();
    });

    it('should have valid values', () => {
      Object.values(MOUTH_EXPRESSIONS).forEach(expr => {
        expect(expr.openness).toBeGreaterThanOrEqual(0);
        expect(expr.openness).toBeLessThanOrEqual(1);
        expect(expr.curve).toBeGreaterThanOrEqual(-1);
        expect(expr.curve).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('PHONEME_MAP', () => {
    it('should have standard phonemes', () => {
      expect(PHONEME_MAP['A']).toBeDefined();
      expect(PHONEME_MAP['E']).toBeDefined();
      expect(PHONEME_MAP['O']).toBeDefined();
      expect(PHONEME_MAP['M']).toBeDefined();
    });

    it('should have valid values', () => {
      Object.values(PHONEME_MAP).forEach(phoneme => {
        expect(phoneme.mouthOpenness).toBeGreaterThanOrEqual(0);
        expect(phoneme.mouthOpenness).toBeLessThanOrEqual(1);
      });
    });
  });
});
