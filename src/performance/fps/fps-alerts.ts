/**
 * FPS Alerts - FPS warning and alert system
 */

import { FPSMonitor, FPSConfig, FrameTiming } from './fps-monitor';

export type AlertLevel = 'info' | 'warning' | 'critical';

export interface FPSAlertConfig {
  warningThreshold?: number;
  criticalThreshold?: number;
  cooldown?: number;
  maxAlertsPerMinute?: number;
}

export interface FPSAlert {
  level: AlertLevel;
  message: string;
  fps: number;
  targetFPS: number;
  timestamp: number;
}

const defaultConfig: Required<FPSAlertConfig> = {
  warningThreshold: 0.8,
  criticalThreshold: 0.5,
  cooldown: 5000,
  maxAlertsPerMinute: 6,
};

export class FPSAlertSystem {
  private monitor: FPSMonitor;
  private config: Required<FPSAlertConfig>;
  private callbacks: Map<string, (alert: FPSAlert) => void> = new Map();
  private alertHistory: FPSAlert[] = [];
  private lastAlertTime: number = 0;
  private alertCount: number = 0;
  private resetIntervalId: number | null = null;
  private unsubscribe: (() => void) | null = null;
  private isEnabled: boolean = true;

  constructor(monitor: FPSMonitor, config: FPSAlertConfig = {}) {
    this.monitor = monitor;
    this.config = { ...defaultConfig, ...config };
    this.startResetTimer();
    this.subscribe();
  }

  private subscribe(): void {
    this.unsubscribe = this.monitor.onFrame((timing: FrameTiming) => {
      this.checkFPS(timing);
    });
  }

  private checkFPS(timing: FrameTiming): void {
    if (!this.isEnabled) return;

    const targetFPS = this.monitor.getStats().targetFPS;
    const ratio = timing.fps / targetFPS;

    let level: AlertLevel | null = null;
    let message = '';

    if (ratio <= this.config.criticalThreshold) {
      level = 'critical';
      message = `Critical FPS drop: ${Math.round(timing.fps)} FPS (target: ${targetFPS})`;
    } else if (ratio <= this.config.warningThreshold) {
      level = 'warning';
      message = `Low FPS detected: ${Math.round(timing.fps)} FPS (target: ${targetFPS})`;
    }

    if (level && this.shouldAlert()) {
      this.triggerAlert({
        level,
        message,
        fps: timing.fps,
        targetFPS,
        timestamp: Date.now(),
      });
    }
  }

  private shouldAlert(): boolean {
    const now = Date.now();

    if (now - this.lastAlertTime < this.config.cooldown) {
      return false;
    }

    if (this.alertCount >= this.config.maxAlertsPerMinute) {
      return false;
    }

    return true;
  }

  private triggerAlert(alert: FPSAlert): void {
    this.lastAlertTime = Date.now();
    this.alertCount++;
    this.alertHistory.push(alert);

    if (this.alertHistory.length > 100) {
      this.alertHistory.shift();
    }

    this.callbacks.forEach((callback) => {
      try {
        callback(alert);
      } catch (error) {
        console.error('FPS Alert callback error:', error);
      }
    });

    this.dispatchEvent(alert);
  }

  private dispatchEvent(alert: FPSAlert): void {
    if (typeof window === 'undefined') return;

    const event = new CustomEvent<FPSAlert>('fpsalert', {
      detail: alert,
      bubbles: true,
    });
    window.dispatchEvent(event);
  }

  private startResetTimer(): void {
    this.resetIntervalId = window.setInterval(() => {
      this.alertCount = Math.max(0, this.alertCount - 1);
    }, 10000);
  }

  onAlert(id: string, callback: (alert: FPSAlert) => void): () => void {
    this.callbacks.set(id, callback);
    return () => {
      this.callbacks.delete(id);
    };
  }

  offAlert(id: string): void {
    this.callbacks.delete(id);
  }

  getAlertHistory(): FPSAlert[] {
    return [...this.alertHistory];
  }

  getRecentAlerts(count: number = 10): FPSAlert[] {
    return this.alertHistory.slice(-count);
  }

  getAlertsByLevel(level: AlertLevel): FPSAlert[] {
    return this.alertHistory.filter((alert) => alert.level === level);
  }

  clearHistory(): void {
    this.alertHistory = [];
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  isActive(): boolean {
    return this.isEnabled;
  }

  setThresholds(warning: number, critical: number): void {
    this.config.warningThreshold = warning;
    this.config.criticalThreshold = critical;
  }

  setCooldown(ms: number): void {
    this.config.cooldown = ms;
  }

  getStats(): {
    totalAlerts: number;
    warningCount: number;
    criticalCount: number;
    lastAlertTime: number;
    isEnabled: boolean;
  } {
    return {
      totalAlerts: this.alertHistory.length,
      warningCount: this.getAlertsByLevel('warning').length,
      criticalCount: this.getAlertsByLevel('critical').length,
      lastAlertTime: this.lastAlertTime,
      isEnabled: this.isEnabled,
    };
  }

  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.resetIntervalId !== null) {
      clearInterval(this.resetIntervalId);
      this.resetIntervalId = null;
    }

    this.callbacks.clear();
    this.alertHistory = [];
  }
}

export { FPSAlertSystem as default };
