/**
 * GC Hints - Provide garbage collection hints and optimizations
 */

export interface GCHintConfig {
  enableAutoHints?: boolean;
  autoHintInterval?: number;
  heapThreshold?: number;
}

const defaultConfig: Required<GCHintConfig> = {
  enableAutoHints: false,
  autoHintInterval: 30000,
  heapThreshold: 0.8,
};

export class GCHintManager {
  private config: Required<GCHintConfig>;
  private intervalId: number | null = null;
  private hintHistory: Array<{ type: string; timestamp: number }> = [];
  private maxHistory: number = 100;

  constructor(config: GCHintConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  requestGC(): void {
    this.recordHint('requestGC');
    this.log('Requesting garbage collection');

    if (window.gc) {
      window.gc();
    } else {
      this.triggerIncrementalGC();
    }
  }

  private triggerIncrementalGC(): void {
    this.nullifyLargeObjects();
    this.clearTemporaryReferences();
  }

  private nullifyLargeObjects(): void {
    this.recordHint('nullifyLargeObjects');

    if (typeof window !== 'undefined') {
      const tmp: unknown[] = [];
      for (let i = 0; i < 10000; i++) {
        tmp.push(null);
      }
      tmp.length = 0;
    }
  }

  private clearTemporaryReferences(): void {
    this.recordHint('clearTemporaryReferences');
  }

  private recordHint(type: string): void {
    this.hintHistory.push({ type, timestamp: Date.now() });
    if (this.hintHistory.length > this.maxHistory) {
      this.hintHistory.shift();
    }
  }

  shouldTriggerGC(): boolean {
    if (!this.isMemoryPressureHigh()) {
      return false;
    }

    const recentHints = this.hintHistory.filter(
      (h) => Date.now() - h.timestamp < 60000
    );

    return recentHints.length < 3;
  }

  private isMemoryPressureHigh(): boolean {
    const perf = window.performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } };
    if (!perf?.memory) return false;

    const ratio = perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit;
    return ratio > this.config.heapThreshold;
  }

  startAutoHints(): void {
    if (this.intervalId !== null) return;

    this.intervalId = window.setInterval(() => {
      if (this.shouldTriggerGC()) {
        this.requestGC();
      }
    }, this.config.autoHintInterval);
  }

  stopAutoHints(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  optimizeArray(arr: unknown[]): void {
    this.recordHint('optimizeArray');

    if (arr.length > 0) {
      arr.length = arr.length;
    }
  }

  clearMap(map: Map<unknown, unknown>): void {
    this.recordHint('clearMap');

    for (const key of map.keys()) {
      map.delete(key);
    }
  }

  clearSet(set: Set<unknown>): void {
    this.recordHint('clearSet');

    for (const value of set) {
      set.delete(value);
    }
  }

  nullifyObjectProp(obj: Record<string, unknown>, prop: string): void {
    if (prop in obj) {
      obj[prop] = null;
    }
  }

  suggestCleanup(): string[] {
    const suggestions: string[] = [];

    if (this.hintHistory.length > 50) {
      suggestions.push('Consider requesting explicit GC');
    }

    if (this.isMemoryPressureHigh()) {
      suggestions.push('Memory pressure detected - clear unused caches');
      suggestions.push('Nullify large object references');
    }

    return suggestions;
  }

  getHintHistory(): Array<{ type: string; timestamp: number }> {
    return [...this.hintHistory];
  }

  getRecentHints(count: number = 10): Array<{ type: string; timestamp: number }> {
    return this.hintHistory.slice(-count);
  }

  clearHistory(): void {
    this.hintHistory = [];
  }

  reset(): void {
    this.stopAutoHints();
    this.hintHistory = [];
  }

  isAutoHintsEnabled(): boolean {
    return this.intervalId !== null;
  }

  getStats(): {
    hintCount: number;
    recentHintCount: number;
    autoHintsEnabled: boolean;
    memoryPressureHigh: boolean;
  } {
    const recentCount = this.hintHistory.filter(
      (h) => Date.now() - h.timestamp < 60000
    ).length;

    return {
      hintCount: this.hintHistory.length,
      recentHintCount: recentCount,
      autoHintsEnabled: this.isAutoHintsEnabled(),
      memoryPressureHigh: this.isMemoryPressureHigh(),
    };
  }

  private log(message: string): void {
    console.log(`[GCHintManager] ${message}`);
  }
}

export { GCHintManager as default };

export function createWeakRef<T extends object>(obj: T): WeakRef<T> {
  if (typeof WeakRef !== 'undefined') {
    return new WeakRef(obj);
  }

  return {
    deref: () => obj,
  } as WeakRef<T>;
}

export function createFinalizationRegistry<T>(
  callback: (heldValue: T) => void
): FinalizationRegistry<T> | { register: (obj: object, heldValue: T) => void; unregister: (obj: object) => void } {
  if (typeof FinalizationRegistry !== 'undefined') {
    return new FinalizationRegistry<T>(callback);
  }

  const registry = new Map<object, T>();

  return {
    register(obj: object, heldValue: T): void {
      registry.set(obj, heldValue);
    },
    unregister(obj: object): void {
      registry.delete(obj);
    },
  };
}
