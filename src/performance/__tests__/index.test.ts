/**
 * Tests for Performance Engine Module Index
 */

import {
  PERFORMANCE_VERSION,
  TARGET_FRAME_RATE,
  FRAME_TIME_MS,
  MEMORY_WARNING_THRESHOLD,
  MEMORY_CRITICAL_THRESHOLD,
} from '../index';

describe('Performance Engine', () => {
  describe('Exports', () => {
    it('should export PERFORMANCE_VERSION', () => {
      expect(PERFORMANCE_VERSION).toBe('1.0.0');
    });

    it('should export TARGET_FRAME_RATE', () => {
      expect(TARGET_FRAME_RATE).toBe(60);
    });

    it('should export FRAME_TIME_MS', () => {
      expect(FRAME_TIME_MS).toBe(16.67);
    });

    it('should export MEMORY_WARNING_THRESHOLD', () => {
      expect(MEMORY_WARNING_THRESHOLD).toBe(0.7);
    });

    it('should export MEMORY_CRITICAL_THRESHOLD', () => {
      expect(MEMORY_CRITICAL_THRESHOLD).toBe(0.9);
    });
  });
});
