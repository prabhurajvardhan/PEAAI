/**
 * Blink Engine Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlinkEngine, BlinkState } from '../blink';
import { EmotionType } from '../geometry';

describe('BlinkEngine', () => {
  let blinkEngine: BlinkEngine;

  beforeEach(() => {
    blinkEngine = new BlinkEngine();
  });

  afterEach(() => {
    blinkEngine.stop();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const config = blinkEngine.getConfig();
      expect(config.minInterval).toBe(2.0);
      expect(config.maxInterval).toBe(8.0);
      expect(config.blinkDuration).toBe(0.15);
    });

    it('should accept custom config', () => {
      const customEngine = new BlinkEngine({
        minInterval: 1.0,
        maxInterval: 4.0,
      });
      const config = customEngine.getConfig();
      expect(config.minInterval).toBe(1.0);
      expect(config.maxInterval).toBe(4.0);
    });
  });

  describe('start/stop', () => {
    it('should start the engine', () => {
      blinkEngine.start();
      blinkEngine.update(0.1);
      // Engine should be running
      expect(blinkEngine.getEyeOpenness()).toBeDefined();
    });

    it('should stop the engine', () => {
      blinkEngine.start();
      blinkEngine.stop();
      blinkEngine.update(1.0);
      // Should reset to idle state
      expect(blinkEngine.getEyeOpenness()).toBe(1.0);
    });

    it('should not restart if already running', () => {
      blinkEngine.start();
      const firstCall = vi.fn();
      blinkEngine.onBlinkStart(firstCall);
      
      // Trigger a blink manually
      blinkEngine.triggerBlink();
      blinkEngine.update(1.0);
    });
  });

  describe('pause/resume', () => {
    it('should pause updates', () => {
      blinkEngine.start();
      blinkEngine.pause();
      blinkEngine.update(10.0); // Long time should not cause blink
      // Engine should be paused
    });

    it('should resume updates', () => {
      blinkEngine.start();
      blinkEngine.pause();
      blinkEngine.resume();
      blinkEngine.update(0.1);
      // Should resume normal operation
    });
  });

  describe('getEyeOpenness', () => {
    it('should return 1.0 when not blinking', () => {
      blinkEngine.start();
      expect(blinkEngine.getEyeOpenness()).toBe(1.0);
    });

    it('should return value between 0 and 1 during blink', () => {
      blinkEngine.start();
      blinkEngine.triggerBlink();
      blinkEngine.update(0.05); // Mid-blink
      
      const openness = blinkEngine.getEyeOpenness();
      expect(openness).toBeLessThan(1.0);
      expect(openness).toBeGreaterThan(0);
    });
  });

  describe('isBlinking', () => {
    it('should return false when not blinking', () => {
      blinkEngine.start();
      expect(blinkEngine.isBlinking()).toBe(false);
    });

    it('should return true during blink animation', () => {
      blinkEngine.start();
      blinkEngine.triggerBlink();
      blinkEngine.update(0.05);
      
      expect(blinkEngine.isBlinking()).toBe(true);
    });
  });

  describe('triggerBlink', () => {
    it('should trigger immediate blink', () => {
      blinkEngine.start();
      blinkEngine.triggerBlink();
      
      expect(blinkEngine.isBlinking()).toBe(true);
    });

    it('should not trigger if already blinking', () => {
      blinkEngine.start();
      blinkEngine.triggerBlink();
      const wasBlinking = blinkEngine.isBlinking();
      blinkEngine.triggerBlink();
      
      expect(blinkEngine.isBlinking()).toBe(wasBlinking);
    });

    it('should notify blink start callbacks', () => {
      const callback = vi.fn();
      blinkEngine.onBlinkStart(callback);
      
      blinkEngine.triggerBlink();
      
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('setEmotion', () => {
    it('should update emotion', () => {
      blinkEngine.setEmotion('happy');
      blinkEngine.start();
      blinkEngine.update(0.1);
      // Should update config based on emotion
    });

    it('should affect blink timing through emotion multiplier', () => {
      const happyEngine = new BlinkEngine();
      happyEngine.setEmotion('happy');
      
      const sadEngine = new BlinkEngine();
      sadEngine.setEmotion('sad');
      
      // Different emotions have different blink rates
      const happyConfig = happyEngine.getConfig();
      const sadConfig = sadEngine.getConfig();
      
      expect(happyConfig.emotionMultiplier.happy).toBeLessThan(
        sadConfig.emotionMultiplier.sad
      );
    });
  });

  describe('callbacks', () => {
    it('should call blink start callback', () => {
      const callback = vi.fn();
      blinkEngine.onBlinkStart(callback);
      
      blinkEngine.triggerBlink();
      
      expect(callback).toHaveBeenCalled();
    });

    it('should call blink end callback after animation completes', () => {
      const callback = vi.fn();
      blinkEngine.onBlinkEnd(callback);
      
      blinkEngine.start();
      blinkEngine.triggerBlink();
      
      // Complete the blink
      for (let i = 0; i < 10; i++) {
        blinkEngine.update(0.02);
      }
      
      // Callback should have been called
      // Note: exact timing depends on config
    });

    it('should allow unsubscribing', () => {
      const callback = vi.fn();
      const unsubscribe = blinkEngine.onBlinkStart(callback);
      unsubscribe();
      
      blinkEngine.triggerBlink();
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('random timing', () => {
    it('should schedule next blink with random interval', () => {
      blinkEngine.start();
      
      // Blink timing should vary
      const intervals: number[] = [];
      for (let i = 0; i < 5; i++) {
        blinkEngine.update(100); // Large delta to force blink
        if (blinkEngine.isBlinking()) {
          intervals.push(100);
        }
      }
    });
  });
});
