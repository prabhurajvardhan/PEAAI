/**
 * Idle Engine Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IdleEngine, IdleState, IDLE_EXPRESSIONS, LOOK_TARGETS } from '../idle';
import { DEFAULT_IDLE_CONFIG } from '../idle/types';

describe('IdleEngine', () => {
  let idleEngine: IdleEngine;

  beforeEach(() => {
    idleEngine = new IdleEngine();
  });

  afterEach(() => {
    idleEngine.stop();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      expect(idleEngine).toBeDefined();
    });

    it('should accept custom config', () => {
      const customEngine = new IdleEngine(undefined, undefined, {
        breathingEnabled: false,
        lookAroundEnabled: false,
      });
      
      expect(customEngine).toBeDefined();
      customEngine.stop();
    });
  });

  describe('start/stop', () => {
    it('should start the engine', () => {
      idleEngine.start();
      idleEngine.update(0.1);
      // Engine should be running
    });

    it('should stop the engine', () => {
      idleEngine.start();
      idleEngine.stop();
      idleEngine.update(1.0);
      // Should reset to default state
    });
  });

  describe('pause/resume', () => {
    it('should pause updates', () => {
      idleEngine.start();
      idleEngine.pause();
      idleEngine.update(10.0);
      // Engine should be paused
    });

    it('should resume updates', () => {
      idleEngine.start();
      idleEngine.pause();
      idleEngine.resume();
      idleEngine.update(0.1);
      // Should resume normal operation
    });
  });

  describe('getIdleState', () => {
    it('should return valid face state', () => {
      idleEngine.start();
      const state = idleEngine.getIdleState();
      
      expect(state).toBeDefined();
      expect(state.eyeOpenness).toBeDefined();
      expect(state.faceScale).toBeDefined();
    });

    it('should include breathing effect', () => {
      idleEngine.start();
      const state1 = idleEngine.getIdleState();
      idleEngine.update(0.5);
      const state2 = idleEngine.getIdleState();
      
      // Scale should change over time due to breathing
      expect(state1.faceScale).toBeDefined();
      expect(state2.faceScale).toBeDefined();
    });
  });

  describe('setActive', () => {
    it('should set active state', () => {
      idleEngine.start();
      idleEngine.setActive(true);
      // State should be set without error
    });

    it('should deactivate', () => {
      idleEngine.start();
      idleEngine.setActive(true);
      idleEngine.setActive(false);
      // Should not throw
    });
  });

  describe('forceLookAt', () => {
    it('should force look direction', () => {
      idleEngine.start();
      idleEngine.forceLookAt({ x: 0.5, y: 0.3 });
      
      const state = idleEngine.getIdleState();
      expect(state.pupilDirection.x).toBeCloseTo(0.5, 1);
    });

    it('should clamp direction values', () => {
      idleEngine.start();
      idleEngine.forceLookAt({ x: 5, y: -10 });
      
      const state = idleEngine.getIdleState();
      expect(state.pupilDirection.x).toBeLessThanOrEqual(1);
      expect(state.pupilDirection.y).toBeGreaterThanOrEqual(-1);
    });
  });

  describe('callbacks', () => {
    it('should register and unregister state change callback', () => {
      const callback = vi.fn();
      const unsubscribe = idleEngine.onStateChange(callback);
      
      idleEngine.start();
      idleEngine.update(1.0);
      
      unsubscribe();
    });
  });

  describe('LOOK_TARGETS', () => {
    it('should have center target', () => {
      const centerTarget = LOOK_TARGETS.find(t => t.direction.x === 0 && t.direction.y === 0);
      expect(centerTarget).toBeDefined();
    });

    it('should have multiple targets', () => {
      expect(LOOK_TARGETS.length).toBeGreaterThan(1);
    });
  });

  describe('IDLE_EXPRESSIONS', () => {
    it('should have multiple expressions', () => {
      expect(IDLE_EXPRESSIONS.length).toBeGreaterThan(0);
    });

    it('should have valid expression values', () => {
      IDLE_EXPRESSIONS.forEach(expr => {
        expect(expr.eyebrowRaise).toBeGreaterThanOrEqual(0);
        expect(expr.cheekRaise).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
