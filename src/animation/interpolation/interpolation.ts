/**
 * Interpolation Engine - Easing functions and value interpolation
 * 
 * Features:
 * - 20+ built-in easing functions
 * - Custom Bezier curves
 * - Multi-value interpolation
 * - Spring physics
 * - Elastic effects
 */

import { EasingFunction, BezierControlPoints, IPosition } from '../types';

/**
 * Interpolation engine for smooth animations
 */
export class InterpolationEngine {
  /**
   * Linear interpolation (no easing)
   */
  static linear(t: number): number {
    return t;
  }

  /**
   * Quadratic easing - starts slow, ends fast
   */
  static easeInQuad(t: number): number {
    return t * t;
  }

  /**
   * Quadratic easing - starts fast, ends slow
   */
  static easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  /**
   * Quadratic easing - starts slow, speeds up, ends slow
   */
  static easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /**
   * Cubic easing - starts slower than quad
   */
  static easeInCubic(t: number): number {
    return t * t * t;
  }

  /**
   * Cubic easing - ends slower than quad
   */
  static easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Cubic easing - smooth all around
   */
  static easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Quartic easing - starts even slower
   */
  static easeInQuart(t: number): number {
    return t * t * t * t;
  }

  /**
   * Quartic easing - ends even slower
   */
  static easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }

  /**
   * Quartic easing - very smooth
   */
  static easeInOutQuart(t: number): number {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }

  /**
   * Quintic easing - slowest start
   */
  static easeInQuint(t: number): number {
    return t * t * t * t * t;
  }

  /**
   * Quintic easing - slowest end
   */
  static easeOutQuint(t: number): number {
    return 1 - Math.pow(1 - t, 5);
  }

  /**
   * Quintic easing - extremely smooth
   */
  static easeInOutQuint(t: number): number {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
  }

  /**
   * Sinusoidal easing - subtle wave effect
   */
  static easeInSine(t: number): number {
    return 1 - Math.cos((t * Math.PI) / 2);
  }

  /**
   * Sinusoidal easing - subtle wave effect
   */
  static easeOutSine(t: number): number {
    return Math.sin((t * Math.PI) / 2);
  }

  /**
   * Sinusoidal easing - smooth oscillation
   */
  static easeInOutSine(t: number): number {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  /**
   * Exponential easing - very dramatic
   */
  static easeInExpo(t: number): number {
    return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
  }

  /**
   * Exponential easing - very dramatic
   */
  static easeOutExpo(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  /**
   * Exponential easing - extreme smoothness
   */
  static easeInOutExpo(t: number): number {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  }

  /**
   * Circular easing - smooth arc
   */
  static easeInCirc(t: number): number {
    return 1 - Math.sqrt(1 - Math.pow(t, 2));
  }

  /**
   * Circular easing - smooth arc
   */
  static easeOutCirc(t: number): number {
    return Math.sqrt(1 - Math.pow(t - 1, 2));
  }

  /**
   * Circular easing - smooth arc
   */
  static easeInOutCirc(t: number): number {
    return t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
  }

  /**
   * Back easing - overshoots target
   */
  static easeInBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  }

  /**
   * Back easing - overshoots target
   */
  static easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  /**
   * Back easing - overshoots both ways
   */
  static easeInOutBack(t: number): number {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  }

  /**
   * Elastic easing - spring-like bounce
   */
  static easeInElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  }

  /**
   * Elastic easing - spring-like bounce
   */
  static easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  /**
   * Elastic easing - spring-like bounce
   */
  static easeInOutElastic(t: number): number {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : t < 0.5
          ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
          : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  }

  /**
   * Bounce easing - bouncing ball effect
   */
  static easeOutBounce(t: number): number {
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
  }

  /**
   * Bounce easing - bouncing ball effect
   */
  static easeInBounce(t: number): number {
    return 1 - InterpolationEngine.easeOutBounce(1 - t);
  }

  /**
   * Bounce easing - bouncing ball effect
   */
  static easeInOutBounce(t: number): number {
    return t < 0.5
      ? (1 - InterpolationEngine.easeOutBounce(1 - 2 * t)) / 2
      : (1 + InterpolationEngine.easeOutBounce(2 * t - 1)) / 2;
  }

  /**
   * Spring easing - spring physics simulation
   */
  static spring(t: number, options: { mass?: number; stiffness?: number; damping?: number } = {}): number {
    const { mass = 1, stiffness = 100, damping = 10 } = options;
    const omega = Math.sqrt(stiffness / mass);
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));
    
    if (zeta < 1) {
      // Underdamped
      const omegaD = omega * Math.sqrt(1 - zeta * zeta);
      return 1 - Math.exp(-zeta * omega * t) * (
        Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t)
      );
    } else {
      // Critically damped or overdamped
      return 1 - (1 + omega * t) * Math.exp(-omega * t);
    }
  }

  /**
   * Custom Bezier curve interpolation
   */
  static bezier(t: number, controlPoints: BezierControlPoints): number {
    const { x1, y1, x2, y2 } = controlPoints;
    
    // Newton-Raphson iteration to find t' for given x
    const epsilon = 1e-6;
    let x = t;
    
    for (let i = 0; i < 8; i++) {
      const currentX = this.bezierBasis(t, 0, x1, x2, 1);
      const currentSlope = this.bezierDerivative(t, 0, x1, x2, 1);
      
      if (Math.abs(currentX - x) < epsilon) break;
      if (Math.abs(currentSlope) < epsilon) break;
      
      t -= (currentX - x) / currentSlope;
    }
    
    return this.bezierBasis(t, 0, y1, y2, 1);
  }

  private static bezierBasis(t: number, p0: number, p1: number, p2: number, p3: number): number {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
  }

  private static bezierDerivative(t: number, p0: number, p1: number, p2: number, p3: number): number {
    const mt = 1 - t;
    return 3 * mt * mt * (p1 - p0) + 6 * mt * t * (p2 - p1) + 3 * t * t * (p3 - p2);
  }

  /**
   * Step interpolation - no smoothing
   */
  static step(t: number): number {
    return t < 1 ? 0 : 1;
  }

  /**
   * Smooth step interpolation
   */
  static smoothStep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  /**
   * Smoother step interpolation (5th order)
   */
  static smootherStep(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /**
   * Catmull-Rom spline interpolation
   */
  static catmullRom(t: number, p0: number, p1: number, p2: number, p3: number): number {
    const t2 = t * t;
    const t3 = t2 * t;
    
    return 0.5 * (
      (2 * p1) +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3
    );
  }

  /**
   * Lerp - Linear interpolation between two values
   */
  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  /**
   * Inverse lerp - Find t given a value
   */
  static inverseLerp(start: number, end: number, value: number): number {
    if (start === end) return 0;
    return (value - start) / (end - start);
  }

  /**
   * Remap value from one range to another
   */
  static remap(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
  ): number {
    const t = this.inverseLerp(inMin, inMax, value);
    return this.lerp(outMin, outMax, t);
  }

  /**
   * Interpolate 2D position with easing
   */
  static lerpPosition(
    start: IPosition,
    end: IPosition,
    t: number,
    easing?: EasingFunction
  ): IPosition {
    const easedT = easing ? easing(t) : t;
    return {
      x: this.lerp(start.x, end.x, easedT),
      y: this.lerp(start.y, end.y, easedT),
    };
  }

  /**
   * Interpolate multiple values simultaneously
   */
  static lerpArray(starts: number[], ends: number[], t: number, easing?: EasingFunction): number[] {
    const easedT = easing ? easing(t) : t;
    return starts.map((start, i) => this.lerp(start, ends[i], easedT));
  }

  /**
   * Clamp value to range
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Wrap value to range (ping-pong)
   */
  static pingPong(value: number, min: number, max: number): number {
    const range = max - min;
    const doubled = (value - min) % (range * 2);
    return doubled < range ? doubled + min : (range * 2) - doubled + min;
  }

  /**
   * Repeat value in range (loop)
   */
  static repeat(value: number, min: number, max: number): number {
    const range = max - min;
    return ((value - min) % range + range) % range + min;
  }

  /**
   * Map easing name to function
   */
  static fromName(name: string): EasingFunction {
    const easings: Record<string, EasingFunction> = {
      linear: InterpolationEngine.linear,
      easeInQuad: InterpolationEngine.easeInQuad,
      easeOutQuad: InterpolationEngine.easeOutQuad,
      easeInOutQuad: InterpolationEngine.easeInOutQuad,
      easeInCubic: InterpolationEngine.easeInCubic,
      easeOutCubic: InterpolationEngine.easeOutCubic,
      easeInOutCubic: InterpolationEngine.easeInOutCubic,
      easeInQuart: InterpolationEngine.easeInQuart,
      easeOutQuart: InterpolationEngine.easeOutQuart,
      easeInOutQuart: InterpolationEngine.easeInOutQuart,
      easeInQuint: InterpolationEngine.easeInQuint,
      easeOutQuint: InterpolationEngine.easeOutQuint,
      easeInOutQuint: InterpolationEngine.easeInOutQuint,
      easeInSine: InterpolationEngine.easeInSine,
      easeOutSine: InterpolationEngine.easeOutSine,
      easeInOutSine: InterpolationEngine.easeInOutSine,
      easeInExpo: InterpolationEngine.easeInExpo,
      easeOutExpo: InterpolationEngine.easeOutExpo,
      easeInOutExpo: InterpolationEngine.easeInOutExpo,
      easeInCirc: InterpolationEngine.easeInCirc,
      easeOutCirc: InterpolationEngine.easeOutCirc,
      easeInOutCirc: InterpolationEngine.easeInOutCirc,
      easeInBack: InterpolationEngine.easeInBack,
      easeOutBack: InterpolationEngine.easeOutBack,
      easeInOutBack: InterpolationEngine.easeInOutBack,
      easeInElastic: InterpolationEngine.easeInElastic,
      easeOutElastic: InterpolationEngine.easeOutElastic,
      easeInOutElastic: InterpolationEngine.easeInOutElastic,
      easeInBounce: InterpolationEngine.easeInBounce,
      easeOutBounce: InterpolationEngine.easeOutBounce,
      easeInOutBounce: InterpolationEngine.easeInOutBounce,
      step: InterpolationEngine.step,
      smoothStep: InterpolationEngine.smoothStep,
      smootherStep: InterpolationEngine.smootherStep,
    };

    const easing = easings[name];
    if (!easing) {
      throw new Error(`Unknown easing function: ${name}`);
    }
    return easing;
  }

  /**
   * Get list of all available easing names
   */
  static getEasingNames(): string[] {
    return [
      'linear',
      'easeInQuad',
      'easeOutQuad',
      'easeInOutQuad',
      'easeInCubic',
      'easeOutCubic',
      'easeInOutCubic',
      'easeInQuart',
      'easeOutQuart',
      'easeInOutQuart',
      'easeInQuint',
      'easeOutQuint',
      'easeInOutQuint',
      'easeInSine',
      'easeOutSine',
      'easeInOutSine',
      'easeInExpo',
      'easeOutExpo',
      'easeInOutExpo',
      'easeInCirc',
      'easeOutCirc',
      'easeInOutCirc',
      'easeInBack',
      'easeOutBack',
      'easeInOutBack',
      'easeInElastic',
      'easeOutElastic',
      'easeInOutElastic',
      'easeInBounce',
      'easeOutBounce',
      'easeInOutBounce',
      'step',
      'smoothStep',
      'smootherStep',
    ];
  }
}

export { InterpolationEngine as default };
