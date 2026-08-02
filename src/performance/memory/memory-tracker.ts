/**
 * Memory Usage Tracking - Monitor memory consumption
 */

export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

export interface MemorySnapshot {
  stats: MemoryStats;
  delta: {
    used: number;
    total: number;
  };
  timestamp: number;
}

export interface MemoryConfig {
  enableMonitoring?: boolean;
  sampleInterval?: number;
  historySize?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
}

const defaultConfig: Required<MemoryConfig> = {
  enableMonitoring: false,
  sampleInterval: 5000,
  historySize: 100,
  warningThreshold: 0.7,
  criticalThreshold: 0.9,
};

export class MemoryTracker {
  private config: Required<MemoryConfig>;
  private snapshots: MemorySnapshot[] = [];
  private lastStats: MemoryStats | null = null;
  private callbacks: Map<string, (stats: MemoryStats) => void> = new Map();
  private warningCallbacks: Map<string, (level: 'warning' | 'critical') => void> = new Map();
  private intervalId: number | null = null;
  private isMonitoring: boolean = false;

  constructor(config: MemoryConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const perf = window.performance as Performance & { memory?: PerformanceMemory };
    return perf !== undefined && perf.memory !== undefined;
  }

  getMemoryStats(): MemoryStats | null {
    if (!this.isSupported()) return null;

    const perf = window.performance as Performance & { memory: PerformanceMemory };
    const memory = perf.memory;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now(),
    };
  }

  takeSnapshot(): MemorySnapshot | null {
    const stats = this.getMemoryStats();
    if (!stats) return null;

    const snapshot: MemorySnapshot = {
      stats,
      delta: {
        used: this.lastStats ? stats.usedJSHeapSize - this.lastStats.usedJSHeapSize : 0,
        total: this.lastStats ? stats.totalJSHeapSize - this.lastStats.totalJSHeapSize : 0,
      },
      timestamp: Date.now(),
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.config.historySize) {
      this.snapshots.shift();
    }

    this.lastStats = { ...stats };
    this.checkThresholds(stats);

    return snapshot;
  }

  private checkThresholds(stats: MemoryStats): void {
    const usageRatio = stats.usedJSHeapSize / stats.jsHeapSizeLimit;

    if (usageRatio >= this.config.criticalThreshold) {
      this.notifyWarning('critical');
    } else if (usageRatio >= this.config.warningThreshold) {
      this.notifyWarning('warning');
    }
  }

  private notifyWarning(level: 'warning' | 'critical'): void {
    for (const callback of this.warningCallbacks.values()) {
      try {
        callback(level);
      } catch (e) {
        console.error('Memory warning callback error:', e);
      }
    }
  }

  startMonitoring(): void {
    if (this.isMonitoring || !this.config.enableMonitoring) return;

    this.isMonitoring = true;
    this.takeSnapshot();

    this.intervalId = window.setInterval(() => {
      const snapshot = this.takeSnapshot();
      if (snapshot) {
        this.notifyListeners(snapshot.stats);
      }
    }, this.config.sampleInterval);
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private notifyListeners(stats: MemoryStats): void {
    for (const callback of this.callbacks.values()) {
      try {
        callback(stats);
      } catch (e) {
        console.error('Memory stats callback error:', e);
      }
    }
  }

  onUpdate(callback: (stats: MemoryStats) => void): () => void {
    const id = `listener-${Date.now()}-${Math.random()}`;
    this.callbacks.set(id, callback);
    return () => {
      this.callbacks.delete(id);
    };
  }

  onWarning(callback: (level: 'warning' | 'critical') => void): () => void {
    const id = `warning-${Date.now()}-${Math.random()}`;
    this.warningCallbacks.set(id, callback);
    return () => {
      this.warningCallbacks.delete(id);
    };
  }

  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  getLatestSnapshot(): MemorySnapshot | null {
    return this.snapshots[this.snapshots.length - 1] || null;
  }

  getAverageUsage(): number {
    if (this.snapshots.length === 0) return 0;
    const sum = this.snapshots.reduce((acc, s) => acc + s.stats.usedJSHeapSize, 0);
    return sum / this.snapshots.length;
  }

  getPeakUsage(): number {
    if (this.snapshots.length === 0) return 0;
    return Math.max(...this.snapshots.map((s) => s.stats.usedJSHeapSize));
  }

  getMemoryTrend(): 'stable' | 'growing' | 'shrinking' {
    if (this.snapshots.length < 2) return 'stable';

    const recent = this.snapshots.slice(-10);
    const first = recent[0].stats.usedJSHeapSize;
    const last = recent[recent.length - 1].stats.usedJSHeapSize;
    const diff = last - first;
    const threshold = this.config.sampleInterval * 10;

    if (diff > threshold) return 'growing';
    if (diff < -threshold) return 'shrinking';
    return 'stable';
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  getFormattedStats(): {
    used: string;
    total: string;
    limit: string;
    percentage: number;
  } | null {
    const stats = this.getMemoryStats();
    if (!stats) return null;

    return {
      used: this.formatBytes(stats.usedJSHeapSize),
      total: this.formatBytes(stats.totalJSHeapSize),
      limit: this.formatBytes(stats.jsHeapSizeLimit),
      percentage: (stats.usedJSHeapSize / stats.jsHeapSizeLimit) * 100,
    };
  }

  clearHistory(): void {
    this.snapshots = [];
    this.lastStats = null;
  }

  reset(): void {
    this.stopMonitoring();
    this.clearHistory();
    this.callbacks.clear();
    this.warningCallbacks.clear();
  }

  isActive(): boolean {
    return this.isMonitoring;
  }

  getStats(): {
    isMonitoring: boolean;
    snapshotCount: number;
    isSupported: boolean;
    config: Required<MemoryConfig>;
  } {
    return {
      isMonitoring: this.isMonitoring,
      snapshotCount: this.snapshots.length,
      isSupported: this.isSupported(),
      config: this.config,
    };
  }
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export { MemoryTracker as default };
