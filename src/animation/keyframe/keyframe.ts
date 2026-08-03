/**
 * Keyframe Engine - Keyframe definition, storage, and sequences
 * 
 * Features:
 * - Keyframe data structure for animation properties
 * - Bezier curve control points
 * - Keyframe sequence management
 * - Value interpolation between keyframes
 */

import { EasingFunction, BezierControlPoints } from '../types';

export interface IKeyframe<T = number> {
  time: number;
  value: T;
  easing?: EasingFunction;
  bezier?: BezierControlPoints;
}

export interface IKeyframeEngine<T = number> {
  addKeyframe(property: string, keyframe: IKeyframe<T>): void;
  removeKeyframe(property: string, time: number): void;
  getKeyframes(property: string): IKeyframe<T>[];
  getValueAtTime(property: string, time: number): T | null;
  getValueAtTimeWithInterpolation(property: string, time: number): T | null;
  clearProperty(property: string): void;
  clearAll(): void;
  getProperties(): string[];
  hasProperty(property: string): boolean;
}

export interface KeyframeSequence<T = number> {
  name: string;
  keyframes: Map<string, IKeyframe<T>[]>;
  duration: number;
}

export interface KeyframeEngineConfig {
  autoSort?: boolean;
  allowDuplicates?: boolean;
}

const DEFAULT_CONFIG = {
  autoSort: true,
  allowDuplicates: false,
};

/**
 * Keyframe Engine for managing animation keyframes
 */
export class KeyframeEngine<T = number> implements IKeyframeEngine<T> {
  private keyframes: Map<string, IKeyframe<T>[]> = new Map();
  private autoSort: boolean;
  private allowDuplicates: boolean;

  constructor(config: KeyframeEngineConfig = {}) {
    this.autoSort = config.autoSort ?? DEFAULT_CONFIG.autoSort;
    this.allowDuplicates = config.allowDuplicates ?? DEFAULT_CONFIG.allowDuplicates;
  }

  addKeyframe(property: string, keyframe: IKeyframe<T>): void {
    if (!this.keyframes.has(property)) {
      this.keyframes.set(property, []);
    }

    const propertyKeyframes = this.keyframes.get(property)!;
    
    if (!this.allowDuplicates) {
      const existingIndex = propertyKeyframes.findIndex(k => k.time === keyframe.time);
      if (existingIndex !== -1) {
        propertyKeyframes[existingIndex] = keyframe;
        if (this.autoSort) {
          this.sortKeyframes(propertyKeyframes);
        }
        return;
      }
    }

    propertyKeyframes.push(keyframe);

    if (this.autoSort) {
      this.sortKeyframes(propertyKeyframes);
    }
  }

  removeKeyframe(property: string, time: number): void {
    const propertyKeyframes = this.keyframes.get(property);
    if (!propertyKeyframes) return;

    const index = propertyKeyframes.findIndex(k => k.time === time);
    if (index !== -1) {
      propertyKeyframes.splice(index, 1);
    }

    if (propertyKeyframes.length === 0) {
      this.keyframes.delete(property);
    }
  }

  getKeyframes(property: string): IKeyframe<T>[] {
    const propertyKeyframes = this.keyframes.get(property);
    return propertyKeyframes ? [...propertyKeyframes] : [];
  }

  getValueAtTime(property: string, time: number): T | null {
    const propertyKeyframes = this.keyframes.get(property);
    if (!propertyKeyframes || propertyKeyframes.length === 0) {
      return null;
    }

    // Before first keyframe
    if (time <= propertyKeyframes[0].time) {
      return propertyKeyframes[0].value;
    }

    // After last keyframe
    if (time >= propertyKeyframes[propertyKeyframes.length - 1].time) {
      return propertyKeyframes[propertyKeyframes.length - 1].value;
    }

    // Find surrounding keyframes
    for (let i = 0; i < propertyKeyframes.length - 1; i++) {
      const current = propertyKeyframes[i];
      const next = propertyKeyframes[i + 1];

      if (time >= current.time && time <= next.time) {
        return current.value;
      }
    }

    return null;
  }

  getValueAtTimeWithInterpolation(property: string, time: number): T | null {
    const propertyKeyframes = this.keyframes.get(property);
    if (!propertyKeyframes || propertyKeyframes.length === 0) {
      return null;
    }

    // Before first keyframe
    if (time <= propertyKeyframes[0].time) {
      return propertyKeyframes[0].value;
    }

    // After last keyframe
    if (time >= propertyKeyframes[propertyKeyframes.length - 1].time) {
      return propertyKeyframes[propertyKeyframes.length - 1].value;
    }

    // Find surrounding keyframes
    for (let i = 0; i < propertyKeyframes.length - 1; i++) {
      const current = propertyKeyframes[i];
      const next = propertyKeyframes[i + 1];

      if (time >= current.time && time <= next.time) {
        // Linear interpolation between keyframes
        const duration = next.time - current.time;
        const elapsed = time - current.time;
        const rawProgress = duration > 0 ? elapsed / duration : 0;

        // Apply easing if defined
        let progress = rawProgress;
        if (current.easing) {
          progress = current.easing(rawProgress);
        } else if (next.easing) {
          progress = next.easing(rawProgress);
        }

        // Linear interpolation of values
        return this.interpolateValues(current.value, next.value, progress) as T;
      }
    }

    return null;
  }

  clearProperty(property: string): void {
    this.keyframes.delete(property);
  }

  clearAll(): void {
    this.keyframes.clear();
  }

  getProperties(): string[] {
    return Array.from(this.keyframes.keys());
  }

  hasProperty(property: string): boolean {
    return this.keyframes.has(property);
  }

  getDuration(): number {
    let maxTime = 0;
    for (const propertyKeyframes of this.keyframes.values()) {
      for (const keyframe of propertyKeyframes) {
        if (keyframe.time > maxTime) {
          maxTime = keyframe.time;
        }
      }
    }
    return maxTime;
  }

  private sortKeyframes(keyframes: IKeyframe<T>[]): void {
    keyframes.sort((a, b) => a.time - b.time);
  }

  private interpolateValues(start: T, end: T, progress: number): T {
    if (typeof start === 'number' && typeof end === 'number') {
      return (start + (end - start) * progress) as T;
    }
    
    if (this.isPosition(start) && this.isPosition(end)) {
      return {
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress,
      } as T;
    }

    // For non-interpolatable values, return end value at 100%
    return progress >= 1 ? end : start;
  }

  private isPosition(value: unknown): value is { x: number; y: number } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'x' in value &&
      'y' in value &&
      typeof (value as { x: unknown }).x === 'number' &&
      typeof (value as { y: unknown }).y === 'number'
    );
  }
}

/**
 * Keyframe Sequence Manager
 */
export class KeyframeSequenceManager<T = number> {
  private sequences: Map<string, KeyframeSequence<T>> = new Map();

  createSequence(name: string): KeyframeSequence<T> {
    const sequence: KeyframeSequence<T> = {
      name,
      keyframes: new Map(),
      duration: 0,
    };
    this.sequences.set(name, sequence);
    return sequence;
  }

  addKeyframeToSequence(
    sequenceName: string,
    property: string,
    keyframe: IKeyframe<T>
  ): void {
    const sequence = this.sequences.get(sequenceName);
    if (!sequence) {
      throw new Error(`Sequence "${sequenceName}" not found`);
    }

    if (!sequence.keyframes.has(property)) {
      sequence.keyframes.set(property, []);
    }

    const propertyKeyframes = sequence.keyframes.get(property)!;
    propertyKeyframes.push(keyframe);
    propertyKeyframes.sort((a, b) => a.time - b.time);

    if (keyframe.time > sequence.duration) {
      sequence.duration = keyframe.time;
    }
  }

  getSequence(name: string): KeyframeSequence<T> | null {
    return this.sequences.get(name) || null;
  }

  getSequenceValueAtTime(sequenceName: string, time: number): Map<string, T> | null {
    const sequence = this.sequences.get(sequenceName);
    if (!sequence) return null;

    const values = new Map<string, T>();

    for (const [property, propertyKeyframes] of sequence.keyframes) {
      if (propertyKeyframes.length === 0) continue;

      // Before first keyframe
      if (time <= propertyKeyframes[0].time) {
        values.set(property, propertyKeyframes[0].value);
        continue;
      }

      // After last keyframe
      if (time >= propertyKeyframes[propertyKeyframes.length - 1].time) {
        values.set(property, propertyKeyframes[propertyKeyframes.length - 1].value);
        continue;
      }

      // Find surrounding keyframes and interpolate
      for (let i = 0; i < propertyKeyframes.length - 1; i++) {
        const current = propertyKeyframes[i];
        const next = propertyKeyframes[i + 1];

        if (time >= current.time && time <= next.time) {
          const duration = next.time - current.time;
          const elapsed = time - current.time;
          let progress = duration > 0 ? elapsed / duration : 0;

          if (current.easing) {
            progress = current.easing(progress);
          }

          const startVal = current.value;
          const endVal = next.value;
          
          if (typeof startVal === 'number' && typeof endVal === 'number') {
            values.set(property, (startVal + (endVal - startVal) * progress) as T);
          }
          break;
        }
      }
    }

    return values;
  }

  deleteSequence(name: string): void {
    this.sequences.delete(name);
  }

  getSequenceNames(): string[] {
    return Array.from(this.sequences.keys());
  }
}

export { KeyframeEngine as default };
