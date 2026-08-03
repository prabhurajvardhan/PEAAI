/**
 * Tests for Animation Generator (T-025)
 */

import { AnimationGenerator } from '../generator';
import { ExpressionState } from '../generator';

describe('Animation Generator', () => {
  let generator: AnimationGenerator;

  beforeEach(() => {
    generator = new AnimationGenerator({ autoStart: false });
  });

  afterEach(() => {
    generator.stop();
  });

  describe('constructor', () => {
    it('should create generator without canvas', () => {
      expect(generator).toBeDefined();
    });

    it('should have default expression state', () => {
      const expression = generator.getExpression();
      expect(expression.eyeOpenness).toBe(1);
      expect(expression.pupilDirection).toEqual({ x: 0, y: 0 });
      expect(expression.mouthOpenness).toBe(0);
      expect(expression.mouthCurve).toBe(0);
    });
  });

  describe('start and stop', () => {
    it('should start animation loop', () => {
      generator.start();
      // Can't easily test internal state, but should not throw
      expect(() => generator.start()).not.toThrow();
    });

    it('should stop animation loop', () => {
      generator.start();
      generator.stop();
      // Should not throw
    });

    it('should pause and resume', () => {
      generator.start();
      generator.pause();
      generator.resume();
      // Should not throw
    });
  });

  describe('expression management', () => {
    it('should set expression immediately', () => {
      const expression: ExpressionState = {
        eyeOpenness: 0.5,
        pupilDirection: { x: 0.5, y: 0 },
        mouthOpenness: 0.3,
        mouthCurve: 0.8,
        eyebrowAngle: 0.2,
        cheekRaise: 0.5,
      };

      generator.setExpression(expression);
      const current = generator.getExpression();

      expect(current.eyeOpenness).toBe(0.5);
      expect(current.pupilDirection).toEqual({ x: 0.5, y: 0 });
      expect(current.mouthOpenness).toBe(0.3);
      expect(current.mouthCurve).toBe(0.8);
      expect(current.eyebrowAngle).toBe(0.2);
      expect(current.cheekRaise).toBe(0.5);
    });

    it('should return copy of expression', () => {
      const expr1 = generator.getExpression();
      const expr2 = generator.getExpression();
      expect(expr1).not.toBe(expr2);
      expect(expr1).toEqual(expr2);
    });

    it('should get expression type', () => {
      // Neutral
      expect(generator.getExpressionType()).toBe('neutral');

      // Happy
      generator.setExpression({
        ...generator.getExpression(),
        mouthCurve: 0.8,
      });
      expect(generator.getExpressionType()).toBe('happy');

      // Sleepy
      generator.setExpression({
        ...generator.getExpression(),
        eyeOpenness: 0.1,
      });
      expect(generator.getExpressionType()).toBe('sleepy');
    });
  });

  describe('animateExpression', () => {
    it('should animate to target expression', async () => {
      const target: ExpressionState = {
        eyeOpenness: 0.5,
        pupilDirection: { x: 0, y: 0 },
        mouthOpenness: 0.3,
        mouthCurve: 0.8,
        eyebrowAngle: 0,
        cheekRaise: 0,
      };

      generator.start();
      
      const promise = generator.animateExpression(target, 100);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 150));
      
      await promise;

      const current = generator.getExpression();
      expect(current.eyeOpenness).toBeCloseTo(0.5, 1);
      expect(current.mouthOpenness).toBeCloseTo(0.3, 1);
      expect(current.mouthCurve).toBeCloseTo(0.8, 1);
    });
  });

  describe('idle animations', () => {
    it('should create breathing animation', () => {
      expect(() => generator.createIdleAnimation('breathing')).not.toThrow();
    });

    it('should create blinking animation', () => {
      expect(() => generator.createIdleAnimation('blinking')).not.toThrow();
    });

    it('should create looking animation', () => {
      expect(() => generator.createIdleAnimation('looking')).not.toThrow();
    });

    it('should create all idle animations', () => {
      expect(() => generator.createIdleAnimation('all')).not.toThrow();
    });

    it('should stop breathing animation', () => {
      generator.createIdleAnimation('breathing');
      expect(() => generator.stopIdleAnimation('breathing')).not.toThrow();
    });

    it('should stop all idle animations', () => {
      generator.createIdleAnimation('all');
      expect(() => generator.stopIdleAnimation('all')).not.toThrow();
    });
  });

  describe('position animation', () => {
    it('should animate position', async () => {
      generator.start();
      await generator.animatePosition({ x: 100, y: 50 }, 100);
      // Should complete without error
    });
  });

  describe('scale animation', () => {
    it('should animate scale', async () => {
      generator.start();
      await generator.animateScale(1.5, 100);
      // Should complete without error
    });
  });

  describe('bounce animation', () => {
    it('should create bounce animation', () => {
      expect(() => generator.createBounceAnimation(1)).not.toThrow();
    });

    it('should create bounce with custom intensity', () => {
      expect(() => generator.createBounceAnimation(2)).not.toThrow();
    });
  });

  describe('shake animation', () => {
    it('should create shake animation', () => {
      expect(() => generator.createShakeAnimation(5, 500)).not.toThrow();
    });

    it('should create shake with custom intensity', () => {
      expect(() => generator.createShakeAnimation(10, 1000)).not.toThrow();
    });
  });

  describe('fade animation', () => {
    it('should create fade animation', async () => {
      generator.start();
      await generator.createFadeAnimation(0, 1, 100);
      // Should complete without error
    });
  });

  describe('expression sequence', () => {
    it('should create expression sequence', async () => {
      generator.start();
      
      const expressions = [
        { expression: { mouthCurve: 0.5 }, duration: 50 },
        { expression: { mouthCurve: 0.8 }, duration: 50 },
        { expression: { mouthCurve: 0.5 }, duration: 50 },
      ];

      await generator.createExpressionSequence(expressions);
      
      const current = generator.getExpression();
      expect(current.mouthCurve).toBeCloseTo(0.5, 1);
    });
  });

  describe('callbacks', () => {
    it('should subscribe to expression changes', () => {
      const callback = jest.fn();
      const unsubscribe = generator.onExpressionChange(callback);

      generator.setExpression({
        ...generator.getExpression(),
        mouthCurve: 0.9,
      });

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0].mouthCurve).toBeCloseTo(0.9, 1);

      unsubscribe();
    });

    it('should return unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = generator.onExpressionChange(callback);

      unsubscribe();
      generator.setExpression(generator.getExpression());

      expect(callback).not.toHaveBeenCalled();
    });

    it('should subscribe to animation completion', () => {
      const callback = jest.fn();
      generator.onAnimationComplete(callback);
      // Animation completion callbacks are internal
    });
  });

  describe('canvas connection', () => {
    it('should accept canvas connection', () => {
      // Create mock canvas
      const mockCanvas = {
        getPixelBuffer: () => ({
          getData: () => new Uint8ClampedArray(32 * 32 * 4),
        }),
        render: () => {},
      } as any;

      expect(() => generator.connectCanvas(mockCanvas)).not.toThrow();
    });
  });

  describe('expression type detection', () => {
    it('should detect excited expression', () => {
      generator.setExpression({
        ...generator.getExpression(),
        mouthOpenness: 0.8,
        mouthCurve: 0.8,
      });
      expect(generator.getExpressionType()).toBe('excited');
    });

    it('should detect sad expression', () => {
      generator.setExpression({
        ...generator.getExpression(),
        mouthCurve: -0.8,
      });
      expect(generator.getExpressionType()).toBe('sad');
    });

    it('should detect angry expression', () => {
      generator.setExpression({
        ...generator.getExpression(),
        eyebrowAngle: -0.5,
      });
      expect(generator.getExpressionType()).toBe('angry');
    });

    it('should detect surprised expression', () => {
      generator.setExpression({
        ...generator.getExpression(),
        eyeOpenness: 1,
        pupilDirection: { x: 0.8, y: 0 },
      });
      expect(generator.getExpressionType()).toBe('surprised');
    });

    it('should detect curious expression', () => {
      generator.setExpression({
        ...generator.getExpression(),
        pupilDirection: { x: 0.5, y: 0.5 },
      });
      expect(generator.getExpressionType()).toBe('curious');
    });

    it('should detect thinking expression', () => {
      generator.setExpression({
        ...generator.getExpression(),
        pupilDirection: { x: 0, y: 0.5 },
      });
      expect(generator.getExpressionType()).toBe('thinking');
    });
  });
});
