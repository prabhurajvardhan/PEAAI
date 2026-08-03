/**
 * Tests for Keyframe Engine (T-021)
 */

import { KeyframeEngine, KeyframeSequenceManager } from '../keyframe';

describe('Keyframe Engine', () => {
  describe('KeyframeEngine', () => {
    let engine: KeyframeEngine<number>;

    beforeEach(() => {
      engine = new KeyframeEngine<number>();
    });

    describe('addKeyframe', () => {
      it('should add keyframe to property', () => {
        engine.addKeyframe('x', { time: 0, value: 0 });
        const keyframes = engine.getKeyframes('x');
        expect(keyframes.length).toBe(1);
        expect(keyframes[0].value).toBe(0);
      });

      it('should add multiple keyframes to same property', () => {
        engine.addKeyframe('x', { time: 0, value: 0 });
        engine.addKeyframe('x', { time: 500, value: 100 });
        engine.addKeyframe('x', { time: 1000, value: 200 });
        
        const keyframes = engine.getKeyframes('x');
        expect(keyframes.length).toBe(3);
      });

      it('should replace keyframe at same time', () => {
        engine.addKeyframe('x', { time: 0, value: 0 });
        engine.addKeyframe('x', { time: 0, value: 10 });
        
        const keyframes = engine.getKeyframes('x');
        expect(keyframes.length).toBe(1);
        expect(keyframes[0].value).toBe(10);
      });

      it('should auto-sort keyframes by time', () => {
        engine.addKeyframe('x', { time: 100, value: 100 });
        engine.addKeyframe('x', { time: 0, value: 0 });
        engine.addKeyframe('x', { time: 50, value: 50 });
        
        const keyframes = engine.getKeyframes('x');
        expect(keyframes[0].time).toBe(0);
        expect(keyframes[1].time).toBe(50);
        expect(keyframes[2].time).toBe(100);
      });
    });

    describe('removeKeyframe', () => {
      it('should remove keyframe at specified time', () => {
        engine.addKeyframe('x', { time: 0, value: 0 });
        engine.addKeyframe('x', { time: 500, value: 100 });
        engine.removeKeyframe('x', 0);
        
        const keyframes = engine.getKeyframes('x');
        expect(keyframes.length).toBe(1);
        expect(keyframes[0].time).toBe(500);
      });

      it('should delete property when all keyframes removed', () => {
        engine.addKeyframe('x', { time: 0, value: 0 });
        engine.removeKeyframe('x', 0);
        
        expect(engine.hasProperty('x')).toBe(false);
      });

      it('should handle removing non-existent keyframe', () => {
        engine.addKeyframe('x', { time: 0, value: 0 });
        expect(() => engine.removeKeyframe('x', 100)).not.toThrow();
      });
    });

    describe('getKeyframes', () => {
      it('should return empty array for non-existent property', () => {
        const keyframes = engine.getKeyframes('x');
        expect(keyframes).toEqual([]);
      });

      it('should return copy of keyframes array', () => {
        engine.addKeyframe('x', { time: 0, value: 0 });
        const keyframes1 = engine.getKeyframes('x');
        const keyframes2 = engine.getKeyframes('x');
        
        expect(keyframes1).not.toBe(keyframes2);
        expect(keyframes1).toEqual(keyframes2);
      });
    });

    describe('getValueAtTime', () => {
      beforeEach(() => {
        engine.addKeyframe('x', { time: 0, value: 0 });
        engine.addKeyframe('x', { time: 500, value: 100 });
        engine.addKeyframe('x', { time: 1000, value: 200 });
      });

      it('should return first value before first keyframe', () => {
        const value = engine.getValueAtTime('x', -100);
        expect(value).toBe(0);
      });

      it('should return last value after last keyframe', () => {
        const value = engine.getValueAtTime('x', 1500);
        expect(value).toBe(200);
      });

      it('should return value at keyframe time', () => {
        const value = engine.getValueAtTime('x', 0);
        expect(value).toBe(0);
      });

      it('should return null for non-existent property', () => {
        const value = engine.getValueAtTime('y', 500);
        expect(value).toBeNull();
      });
    });

    describe('getValueAtTimeWithInterpolation', () => {
      beforeEach(() => {
        engine.addKeyframe('x', { time: 0, value: 0 });
        engine.addKeyframe('x', { time: 500, value: 100 });
        engine.addKeyframe('x', { time: 1000, value: 200 });
      });

      it('should interpolate between keyframes', () => {
        const value = engine.getValueAtTimeWithInterpolation('x', 250);
        expect(value).toBe(50);
      });

      it('should return exact value at keyframe', () => {
        const value = engine.getValueAtTimeWithInterpolation('x', 500);
        expect(value).toBe(100);
      });

      it('should interpolate with easing', () => {
        const easeIn = (t: number) => t * t;
        engine.addKeyframe('y', { time: 0, value: 0 });
        engine.addKeyframe('y', { time: 100, value: 100, easing: easeIn });
        
        const value = engine.getValueAtTimeWithInterpolation('y', 50);
        // With easeIn at t=0.5, result should be 0 + (100 - 0) * 0.25 = 25
        expect(value).toBe(25);
      });
    });

    describe('clearProperty', () => {
      it('should clear all keyframes for property', () => {
        engine.addKeyframe('x', { time: 0, value: 0 });
        engine.addKeyframe('x', { time: 500, value: 100 });
        engine.clearProperty('x');
        
        expect(engine.getKeyframes('x')).toEqual([]);
      });
    });

    describe('clearAll', () => {
      it('should clear all properties', () => {
        engine.addKeyframe('x', { time: 0, value: 0 });
        engine.addKeyframe('y', { time: 0, value: 0 });
        engine.clearAll();
        
        expect(engine.getProperties()).toEqual([]);
      });
    });

    describe('getProperties', () => {
      it('should return all property names', () => {
        engine.addKeyframe('x', { time: 0, value: 0 });
        engine.addKeyframe('y', { time: 0, value: 0 });
        engine.addKeyframe('scale', { time: 0, value: 1 });
        
        const properties = engine.getProperties();
        expect(properties).toContain('x');
        expect(properties).toContain('y');
        expect(properties).toContain('scale');
      });
    });

    describe('hasProperty', () => {
      it('should return true for existing property', () => {
        engine.addKeyframe('x', { time: 0, value: 0 });
        expect(engine.hasProperty('x')).toBe(true);
      });

      it('should return false for non-existent property', () => {
        expect(engine.hasProperty('x')).toBe(false);
      });
    });

    describe('getDuration', () => {
      it('should return 0 for empty engine', () => {
        expect(engine.getDuration()).toBe(0);
      });

      it('should return max keyframe time', () => {
        engine.addKeyframe('x', { time: 0, value: 0 });
        engine.addKeyframe('x', { time: 500, value: 100 });
        engine.addKeyframe('y', { time: 800, value: 50 });
        engine.addKeyframe('z', { time: 1200, value: 25 });
        
        expect(engine.getDuration()).toBe(1200);
      });
    });

    describe('position interpolation', () => {
      let positionEngine: KeyframeEngine<{ x: number; y: number }>;

      beforeEach(() => {
        positionEngine = new KeyframeEngine();
      });

      it('should interpolate position values', () => {
        positionEngine.addKeyframe('pos', { time: 0, value: { x: 0, y: 0 } });
        positionEngine.addKeyframe('pos', { time: 100, value: { x: 100, y: 50 } });
        
        const value = positionEngine.getValueAtTimeWithInterpolation('pos', 50);
        expect(value).toEqual({ x: 50, y: 25 });
      });
    });
  });

  describe('KeyframeSequenceManager', () => {
    let manager: KeyframeSequenceManager<number>;

    beforeEach(() => {
      manager = new KeyframeSequenceManager<number>();
    });

    describe('createSequence', () => {
      it('should create new sequence', () => {
        const sequence = manager.createSequence('test');
        expect(sequence.name).toBe('test');
        expect(sequence.keyframes.size).toBe(0);
        expect(sequence.duration).toBe(0);
      });

      it('should allow creating multiple sequences', () => {
        manager.createSequence('seq1');
        manager.createSequence('seq2');
        
        expect(manager.getSequenceNames()).toContain('seq1');
        expect(manager.getSequenceNames()).toContain('seq2');
      });
    });

    describe('addKeyframeToSequence', () => {
      beforeEach(() => {
        manager.createSequence('test');
      });

      it('should add keyframe to sequence', () => {
        manager.addKeyframeToSequence('test', 'x', { time: 0, value: 0 });
        manager.addKeyframeToSequence('test', 'x', { time: 500, value: 100 });
        
        const sequence = manager.getSequence('test');
        expect(sequence?.keyframes.get('x')?.length).toBe(2);
      });

      it('should update sequence duration', () => {
        manager.addKeyframeToSequence('test', 'x', { time: 500, value: 100 });
        
        const sequence = manager.getSequence('test');
        expect(sequence?.duration).toBe(500);
      });

      it('should throw for non-existent sequence', () => {
        expect(() => {
          manager.addKeyframeToSequence('nonexistent', 'x', { time: 0, value: 0 });
        }).toThrow();
      });
    });

    describe('getSequenceValueAtTime', () => {
      beforeEach(() => {
        manager.createSequence('test');
        manager.addKeyframeToSequence('test', 'x', { time: 0, value: 0 });
        manager.addKeyframeToSequence('test', 'x', { time: 500, value: 100 });
        manager.addKeyframeToSequence('test', 'y', { time: 0, value: 10 });
        manager.addKeyframeToSequence('test', 'y', { time: 300, value: 30 });
      });

      it('should return interpolated values for all properties', () => {
        const values = manager.getSequenceValueAtTime('test', 250);
        
        expect(values?.get('x')).toBe(50);
        // y interpolates from 10 at t=0 to 30 at t=300
        // At t=250, that's 250/300 = 0.833... progress
        // 10 + (30 - 10) * 0.833... = 10 + 16.666... = 26.666...
        expect(values?.get('y')).toBeCloseTo(26.67, 1);
      });

      it('should return null for non-existent sequence', () => {
        const values = manager.getSequenceValueAtTime('nonexistent', 0);
        expect(values).toBeNull();
      });

      it('should handle time beyond sequence duration', () => {
        const values = manager.getSequenceValueAtTime('test', 1000);
        
        expect(values?.get('x')).toBe(100);
        expect(values?.get('y')).toBe(30);
      });
    });

    describe('deleteSequence', () => {
      it('should delete sequence', () => {
        manager.createSequence('test');
        manager.deleteSequence('test');
        
        expect(manager.getSequence('test')).toBeNull();
      });
    });
  });
});
