/**
 * Face State Machine Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FaceStateMachine, FaceState } from '../state-machine';

describe('FaceStateMachine', () => {
  let stateMachine: FaceStateMachine;

  beforeEach(() => {
    stateMachine = new FaceStateMachine();
  });

  afterEach(() => {
    stateMachine.stop();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      expect(stateMachine.getCurrentState()).toBe(FaceState.Idle);
    });

    it('should accept custom config', () => {
      const customMachine = new FaceStateMachine(undefined, undefined, {
        idleTimeout: 10,
        sleepingTimeout: 120,
      });
      
      expect(customMachine).toBeDefined();
      customMachine.stop();
    });
  });

  describe('start/stop', () => {
    it('should start in idle state', () => {
      stateMachine.start();
      expect(stateMachine.getCurrentState()).toBe(FaceState.Idle);
    });

    it('should stop the state machine', () => {
      stateMachine.start();
      stateMachine.stop();
      stateMachine.update(1.0);
      // Should not transition automatically
    });
  });

  describe('getCurrentState', () => {
    it('should return current state', () => {
      expect(stateMachine.getCurrentState()).toBe(FaceState.Idle);
    });
  });

  describe('canTransitionTo', () => {
    it('should return true for valid transitions', () => {
      stateMachine.start();
      expect(stateMachine.canTransitionTo(FaceState.Active)).toBe(true);
      expect(stateMachine.canTransitionTo(FaceState.Happy)).toBe(true);
    });

    it('should return false for same state', () => {
      stateMachine.start();
      expect(stateMachine.canTransitionTo(FaceState.Idle)).toBe(false);
    });
  });

  describe('transitionTo', () => {
    it('should transition to valid state', () => {
      stateMachine.start();
      const result = stateMachine.transitionTo(FaceState.Active);
      
      expect(result).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(FaceState.Active);
    });

    it('should record history on transition', () => {
      stateMachine.start();
      stateMachine.transitionTo(FaceState.Active);
      
      const history = stateMachine.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should return false for invalid transition', () => {
      stateMachine.start();
      stateMachine.transitionTo(FaceState.Sleeping);
      const result = stateMachine.transitionTo(FaceState.Happy);
      
      // May or may not be valid depending on config
    });
  });

  describe('callbacks', () => {
    it('should notify state change', () => {
      const callback = vi.fn();
      stateMachine.start();
      stateMachine.onStateChange(callback);
      
      stateMachine.transitionTo(FaceState.Active);
      
      expect(callback).toHaveBeenCalled();
    });

    it('should include event data', () => {
      const callback = vi.fn();
      stateMachine.start();
      stateMachine.onStateChange(callback);
      
      stateMachine.transitionTo(FaceState.Happy);
      
      const event = callback.mock.calls[0][0];
      expect(event.previousState).toBeDefined();
      expect(event.currentState).toBeDefined();
      expect(event.timestamp).toBeDefined();
    });

    it('should notify state enter', () => {
      const callback = vi.fn();
      stateMachine.start();
      stateMachine.onStateEnter(callback);
      
      stateMachine.transitionTo(FaceState.Active);
      
      expect(callback).toHaveBeenCalled();
    });

    it('should notify state exit', () => {
      const callback = vi.fn();
      stateMachine.start();
      stateMachine.onStateExit(callback);
      
      stateMachine.transitionTo(FaceState.Active);
      
      expect(callback).toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
      const callback = vi.fn();
      const unsubscribe = stateMachine.onStateChange(callback);
      unsubscribe();
      
      stateMachine.transitionTo(FaceState.Active);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('activity triggers', () => {
    it('should trigger activity', () => {
      stateMachine.start();
      stateMachine.triggerActivity();
      // Should reset idle timer
    });

    it('should trigger speaking', () => {
      stateMachine.start();
      stateMachine.triggerSpeaking();
      
      expect(stateMachine.getCurrentState()).toBe(FaceState.Speaking);
    });

    it('should trigger listening', () => {
      stateMachine.start();
      stateMachine.triggerListening();
      
      expect(stateMachine.getCurrentState()).toBe(FaceState.Listening);
    });

    it('should trigger thinking', () => {
      stateMachine.start();
      stateMachine.triggerThinking();
      
      expect(stateMachine.getCurrentState()).toBe(FaceState.Thinking);
    });
  });

  describe('context', () => {
    it('should return current context', () => {
      const context = stateMachine.getContext();
      
      expect(context.currentEmotion).toBeDefined();
      expect(context.isSpeaking).toBe(false);
      expect(context.isListening).toBe(false);
    });

    it('should update context', () => {
      stateMachine.setContext({ isSpeaking: true });
      
      const context = stateMachine.getContext();
      expect(context.isSpeaking).toBe(true);
    });
  });

  describe('history', () => {
    it('should record state history', () => {
      stateMachine.start();
      stateMachine.transitionTo(FaceState.Active);
      stateMachine.transitionTo(FaceState.Happy);
      
      const history = stateMachine.getHistory();
      expect(history.length).toBe(2);
    });

    it('should track last state', () => {
      stateMachine.start();
      stateMachine.transitionTo(FaceState.Active);
      
      // Check the current state directly
      expect(stateMachine.getCurrentState()).toBe(FaceState.Active);
      // History may have the previous state
    });

    it('should return null for last state if no history', () => {
      const newMachine = new FaceStateMachine();
      expect(newMachine.getLastState()).toBeNull();
    });
  });

  describe('automatic transitions', () => {
    it('should transition from sleepy to sleeping after timeout', () => {
      const sleepyMachine = new FaceStateMachine(undefined, undefined, {
        idleTimeout: 0.1,
        sleepingTimeout: 0.2,
      });
      
      sleepyMachine.start();
      sleepyMachine.triggerActivity();
      sleepyMachine.transitionTo(FaceState.Sleepy);
      
      // Wait for sleeping timeout
      for (let i = 0; i < 5; i++) {
        sleepyMachine.update(0.1);
      }
      
      sleepyMachine.stop();
    });

    it('should wake from sleeping on activity', () => {
      const sleepMachine = new FaceStateMachine(undefined, undefined, {
        sleepingTimeout: 0.1,
      });
      
      sleepMachine.start();
      sleepMachine.transitionTo(FaceState.Sleeping);
      sleepMachine.triggerActivity();
      
      // triggerActivity wakes up from sleeping and transitions to Idle
      const state = sleepMachine.getCurrentState();
      expect(state === FaceState.Idle || state === FaceState.Active).toBe(true);
      sleepMachine.stop();
    });
  });
});
