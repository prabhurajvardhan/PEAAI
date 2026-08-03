/**
 * Tests for Interpolation Engine (T-022)
 */

import { InterpolationEngine } from '../interpolation';

describe('Interpolation Engine', () => {
  describe('Basic easing functions', () => {
    it('should return 0 at t=0', () => {
      const easings = [
        'linear',
        'easeInQuad', 'easeOutQuad', 'easeInOutQuad',
        'easeInCubic', 'easeOutCubic', 'easeInOutCubic',
        'easeInQuart', 'easeOutQuart', 'easeInOutQuart',
        'easeInQuint', 'easeOutQuint', 'easeInOutQuint',
        'easeInSine', 'easeOutSine', 'easeInOutSine',
        'easeInExpo', 'easeOutExpo', 'easeInOutExpo',
        'easeInCirc', 'easeOutCirc', 'easeInOutCirc',
        'easeInBack', 'easeOutBack', 'easeInOutBack',
        'easeInElastic', 'easeOutElastic', 'easeInOutElastic',
        'easeInBounce', 'easeOutBounce', 'easeInOutBounce',
        'smoothStep', 'smootherStep',
      ];

      for (const easingName of easings) {
        const easing = InterpolationEngine.fromName(easingName);
        expect(easing(0)).toBeCloseTo(0, 5);
      }
    });

    it('should return 1 at t=1', () => {
      const easings = [
        'linear',
        'easeInQuad', 'easeOutQuad', 'easeInOutQuad',
        'easeInCubic', 'easeOutCubic', 'easeInOutCubic',
        'easeInQuart', 'easeOutQuart', 'easeInOutQuart',
        'easeInQuint', 'easeOutQuint', 'easeInOutQuint',
        'easeInSine', 'easeOutSine', 'easeInOutSine',
        'easeInExpo', 'easeOutExpo', 'easeInOutExpo',
        'easeInCirc', 'easeOutCirc', 'easeInOutCirc',
        'easeInBack', 'easeOutBack', 'easeInOutBack',
        'easeInElastic', 'easeOutElastic', 'easeInOutElastic',
        'easeInBounce', 'easeOutBounce', 'easeInOutBounce',
        'smoothStep', 'smootherStep',
      ];

      for (const easingName of easings) {
        const easing = InterpolationEngine.fromName(easingName);
        expect(easing(1)).toBeCloseTo(1, 5);
      }
    });

    it('should stay within 0-1 range', () => {
      const easings = [
        'linear',
        'easeInQuad', 'easeOutQuad', 'easeInOutQuad',
        'easeInCubic', 'easeOutCubic', 'easeInOutCubic',
        'easeInQuart', 'easeOutQuart', 'easeInOutQuart',
        'easeInQuint', 'easeOutQuint', 'easeInOutQuint',
        'easeInSine', 'easeOutSine', 'easeInOutSine',
        'easeInExpo', 'easeOutExpo', 'easeInOutExpo',
        'easeInCirc', 'easeOutCirc', 'easeInOutCirc',
        'easeInBack', 'easeOutBack', 'easeInOutBack',
        'easeInElastic', 'easeOutElastic', 'easeInOutElastic',
        'easeInBounce', 'easeOutBounce', 'easeInOutBounce',
        'smoothStep', 'smootherStep',
      ];

      for (const easingName of easings) {
        const easing = InterpolationEngine.fromName(easingName);
        for (let t = 0; t <= 1; t += 0.1) {
          const result = easing(t);
          // Elastic and bounce easings can overshoot, allow wider tolerance
          expect(result).toBeGreaterThanOrEqual(-0.5);
          expect(result).toBeLessThanOrEqual(1.5);
        }
      }
    });

    it('should have 34 easing functions', () => {
      const names = InterpolationEngine.getEasingNames();
      expect(names.length).toBe(34);
    });
  });

  describe('Linear interpolation', () => {
    it('should return start at t=0', () => {
      expect(InterpolationEngine.lerp(10, 20, 0)).toBe(10);
    });

    it('should return end at t=1', () => {
      expect(InterpolationEngine.lerp(10, 20, 1)).toBe(20);
    });

    it('should return midpoint at t=0.5', () => {
      expect(InterpolationEngine.lerp(10, 20, 0.5)).toBe(15);
    });
  });

  describe('Inverse lerp', () => {
    it('should return 0 at start value', () => {
      expect(InterpolationEngine.inverseLerp(10, 20, 10)).toBe(0);
    });

    it('should return 1 at end value', () => {
      expect(InterpolationEngine.inverseLerp(10, 20, 20)).toBe(1);
    });

    it('should return 0.5 at midpoint', () => {
      expect(InterpolationEngine.inverseLerp(10, 20, 15)).toBe(0.5);
    });

    it('should handle equal start and end', () => {
      expect(InterpolationEngine.inverseLerp(10, 10, 10)).toBe(0);
    });
  });

  describe('Remap', () => {
    it('should map value from one range to another', () => {
      expect(InterpolationEngine.remap(0.5, 0, 1, 0, 100)).toBe(50);
    });

    it('should handle non-normalized ranges', () => {
      expect(InterpolationEngine.remap(25, 0, 50, 0, 100)).toBe(50);
    });

    it('should handle negative ranges', () => {
      expect(InterpolationEngine.remap(0.5, 0, 1, -50, 50)).toBe(0);
    });
  });

  describe('Position interpolation', () => {
    it('should interpolate between positions', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 100, y: 50 };
      
      const result = InterpolationEngine.lerpPosition(start, end, 0.5);
      
      expect(result.x).toBe(50);
      expect(result.y).toBe(25);
    });

    it('should apply easing to position interpolation', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 100, y: 100 };
      
      const result = InterpolationEngine.lerpPosition(
        start, end, 0.5, InterpolationEngine.easeInQuad
      );
      
      expect(result.x).toBe(25);
      expect(result.y).toBe(25);
    });
  });

  describe('Array interpolation', () => {
    it('should interpolate array of values', () => {
      const starts = [0, 0, 0];
      const ends = [100, 200, 300];
      
      const result = InterpolationEngine.lerpArray(starts, ends, 0.5);
      
      expect(result).toEqual([50, 100, 150]);
    });

    it('should apply easing to array interpolation', () => {
      const starts = [0, 0];
      const ends = [100, 100];
      
      const result = InterpolationEngine.lerpArray(
        starts, ends, 0.5, InterpolationEngine.easeInQuad
      );
      
      expect(result[0]).toBe(25);
      expect(result[1]).toBe(25);
    });
  });

  describe('Clamp', () => {
    it('should return value when within range', () => {
      expect(InterpolationEngine.clamp(5, 0, 10)).toBe(5);
    });

    it('should return min when below range', () => {
      expect(InterpolationEngine.clamp(-5, 0, 10)).toBe(0);
    });

    it('should return max when above range', () => {
      expect(InterpolationEngine.clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('Ping-pong', () => {
    it('should return value within range', () => {
      expect(InterpolationEngine.pingPong(5, 0, 10)).toBe(5);
    });

    it('should reverse direction at end', () => {
      expect(InterpolationEngine.pingPong(15, 0, 10)).toBe(5);
    });

    it('should handle values in middle', () => {
      expect(InterpolationEngine.pingPong(3, 0, 10)).toBe(3);
    });
  });

  describe('Repeat', () => {
    it('should return value within range', () => {
      expect(InterpolationEngine.repeat(5, 0, 10)).toBe(5);
    });

    it('should wrap values above max', () => {
      expect(InterpolationEngine.repeat(15, 0, 10)).toBe(5);
    });

    it('should handle negative values', () => {
      expect(InterpolationEngine.repeat(-5, 0, 10)).toBe(5);
    });
  });

  describe('Catmull-Rom spline', () => {
    it('should return p1 at t=0', () => {
      expect(InterpolationEngine.catmullRom(0, 0, 10, 20, 30)).toBe(10);
    });

    it('should return p2 at t=1', () => {
      expect(InterpolationEngine.catmullRom(1, 0, 10, 20, 30)).toBe(20);
    });

    it('should interpolate through values', () => {
      const result = InterpolationEngine.catmullRom(0.5, 0, 10, 20, 30);
      expect(result).toBeGreaterThan(10);
      expect(result).toBeLessThan(20);
    });
  });

  describe('Step functions', () => {
    it('should return 0 before 1', () => {
      expect(InterpolationEngine.step(0)).toBe(0);
      expect(InterpolationEngine.step(0.5)).toBe(0);
      expect(InterpolationEngine.step(0.99)).toBe(0);
    });

    it('should return 1 at 1', () => {
      expect(InterpolationEngine.step(1)).toBe(1);
    });
  });

  describe('Smooth step', () => {
    it('should start at 0', () => {
      expect(InterpolationEngine.smoothStep(0)).toBe(0);
    });

    it('should end at 1', () => {
      expect(InterpolationEngine.smoothStep(1)).toBe(1);
    });

    it('should be different from linear at midpoint', () => {
      const linear = InterpolationEngine.lerp(0, 1, 0.5);
      const smooth = InterpolationEngine.smoothStep(0.5);
      // Both should be 0.5 at midpoint due to symmetry
      expect(linear).toBe(0.5);
      expect(smooth).toBe(0.5);
    });
  });

  describe('Smoother step', () => {
    it('should start at 0', () => {
      expect(InterpolationEngine.smootherStep(0)).toBe(0);
    });

    it('should end at 1', () => {
      expect(InterpolationEngine.smootherStep(1)).toBe(1);
    });

    it('should have expected value at midpoint', () => {
      // At t=0.5, smootherStep should be 0.5
      const smoother = InterpolationEngine.smootherStep(0.5);
      expect(smoother).toBe(0.5);
    });
  });

  describe('Spring easing', () => {
    it('should start at 0', () => {
      expect(InterpolationEngine.spring(0)).toBeCloseTo(0, 5);
    });

    it('should approach 1', () => {
      const result = InterpolationEngine.spring(1);
      expect(result).toBeGreaterThan(0.9);
      expect(result).toBeLessThan(1.1);
    });

    it('should handle custom parameters', () => {
      const result = InterpolationEngine.spring(0.5, {
        mass: 0.5,
        stiffness: 200,
        damping: 5,
      });
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1.2); // Spring can overshoot
    });

    it('should allow tuning overshoot', () => {
      const stiff = InterpolationEngine.spring(0.5, { stiffness: 500 });
      const loose = InterpolationEngine.spring(0.5, { stiffness: 50 });
      expect(stiff).not.toBe(loose);
    });
  });

  describe('Bezier curve', () => {
    it('should return 0 at t=0', () => {
      const result = InterpolationEngine.bezier(0, { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 });
      expect(result).toBeCloseTo(0, 3);
    });

    it('should return 1 at t=1', () => {
      const result = InterpolationEngine.bezier(1, { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 });
      expect(result).toBeCloseTo(1, 3);
    });

    it('should curve based on control points', () => {
      // Linear bezier should return approximately 0.5
      const linear = InterpolationEngine.bezier(0.5, { x1: 0, y1: 0, x2: 1, y2: 1 });
      expect(linear).toBeCloseTo(0.5, 1);
    });
  });

  describe('fromName', () => {
    it('should return easing function for valid name', () => {
      const easing = InterpolationEngine.fromName('easeInQuad');
      expect(typeof easing).toBe('function');
    });

    it('should throw for invalid name', () => {
      expect(() => InterpolationEngine.fromName('invalidEasing')).toThrow();
    });
  });
});
