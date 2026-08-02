/**
 * Tests for FPS Monitor Module
 */

import {
  FPSMonitor,
  FPSConfig,
} from '../fps/fps-monitor';

import { FPSAlertSystem, FPSAlertConfig } from '../fps/fps-alerts';

describe('FPS Monitor Module', () => {
  describe('FPSMonitor', () => {
    let monitor: FPSMonitor;

    beforeEach(() => {
      monitor = new FPSMonitor({
        targetFPS: 60,
        sampleSize: 30,
        updateInterval: 100,
        alertThreshold: 0.8,
      });
    });

    afterEach(() => {
      monitor.stop();
    });

    it('should create FPS monitor with default config', () => {
      const m = new FPSMonitor();
      expect(m).toBeDefined();
      expect(typeof m.start).toBe('function');
      expect(typeof m.stop).toBe('function');
      expect(typeof m.calculateFPS).toBe('function');
      m.stop();
    });

    it('should create FPS monitor with custom config', () => {
      expect(monitor).toBeDefined();
      expect(monitor.getStats().targetFPS).toBe(60);
    });

    it('should calculate FPS', () => {
      const fps = monitor.calculateFPS();
      expect(typeof fps).toBe('number');
    });

    it('should get current FPS', () => {
      const fps = monitor.getCurrentFPS();
      expect(typeof fps).toBe('number');
    });

    it('should register frame callback', () => {
      const callback = jest.fn();
      const unsubscribe = monitor.onFrame(callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should register alert callback', () => {
      const callback = jest.fn();
      const unsubscribe = monitor.onAlert(callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should get stats', () => {
      const stats = monitor.getStats();
      expect(stats).toBeDefined();
      expect(stats.targetFPS).toBe(60);
      expect(typeof stats.fps).toBe('number');
      expect(typeof stats.avgFPS).toBe('number');
    });

    it('should reset monitor', () => {
      monitor.reset();
      const stats = monitor.getStats();
      expect(stats.frameCount).toBe(0);
    });

    it('should set target FPS', () => {
      monitor.setTargetFPS(30);
      expect(monitor.getStats().targetFPS).toBe(30);
    });

    it('should check if active', () => {
      expect(monitor.isActive()).toBe(false);
      monitor.start();
      expect(monitor.isActive()).toBe(true);
      monitor.stop();
      expect(monitor.isActive()).toBe(false);
    });
  });

  describe('FPSAlertSystem', () => {
    let monitor: FPSMonitor;
    let alertSystem: FPSAlertSystem;

    beforeEach(() => {
      monitor = new FPSMonitor({ targetFPS: 60 });
      alertSystem = new FPSAlertSystem(monitor, {
        warningThreshold: 0.8,
        criticalThreshold: 0.5,
        cooldown: 1000,
      });
    });

    afterEach(() => {
      monitor.stop();
      alertSystem.destroy();
    });

    it('should create alert system with default config', () => {
      const a = new FPSAlertSystem(monitor);
      expect(a).toBeDefined();
      a.destroy();
    });

    it('should create alert system with custom config', () => {
      expect(alertSystem).toBeDefined();
    });

    it('should register alert callback', () => {
      const callback = jest.fn();
      const unsubscribe = alertSystem.onAlert('test', callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should get alert history', () => {
      const history = alertSystem.getAlertHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should get recent alerts', () => {
      const alerts = alertSystem.getRecentAlerts(5);
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should get alerts by level', () => {
      const alerts = alertSystem.getAlertsByLevel('warning');
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should clear history', () => {
      alertSystem.clearHistory();
      expect(alertSystem.getAlertHistory().length).toBe(0);
    });

    it('should enable/disable', () => {
      alertSystem.disable();
      expect(alertSystem.isActive()).toBe(false);
      alertSystem.enable();
      expect(alertSystem.isActive()).toBe(true);
    });

    it('should get stats', () => {
      const stats = alertSystem.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalAlerts).toBe('number');
      expect(typeof stats.isEnabled).toBe('boolean');
    });

    it('should set thresholds', () => {
      alertSystem.setThresholds(0.7, 0.4);
      const stats = alertSystem.getStats();
      expect(stats).toBeDefined();
    });

    it('should set cooldown', () => {
      alertSystem.setCooldown(2000);
      const stats = alertSystem.getStats();
      expect(stats).toBeDefined();
    });
  });
});
