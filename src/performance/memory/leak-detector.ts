/**
 * Leak Detection - Detect and report memory leaks
 */

export type LeakType = 'event-listener' | 'timer' | 'dom-reference' | 'closure' | 'cache' | 'unknown';

export interface LeakCandidate {
  id: string;
  type: LeakType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  stackTrace?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface LeakDetectionConfig {
  enableMonitoring?: boolean;
  checkInterval?: number;
  gcCheckCount?: number;
  snapshotInterval?: number;
  maxCandidates?: number;
  eventListenerThreshold?: number;
  timerThreshold?: number;
}

const defaultConfig: Required<LeakDetectionConfig> = {
  enableMonitoring: false,
  checkInterval: 10000,
  gcCheckCount: 3,
  snapshotInterval: 30000,
  maxCandidates: 50,
  eventListenerThreshold: 50,
  timerThreshold: 20,
};

export class LeakDetector {
  private config: Required<LeakDetectionConfig>;
  private candidates: LeakCandidate[] = [];
  private snapshots: Map<string, number>[] = [];
  private baseline: Map<string, number> | null = null;
  private callbacks: Map<string, (candidates: LeakCandidate[]) => void> = new Map();
  private intervalId: number | null = null;
  private isMonitoring: boolean = false;
  private leakIdCounter: number = 0;

  constructor(config: LeakDetectionConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  createBaseline(): void {
    this.baseline = this.collectSnapshot();
    this.snapshots = [];
  }

  private collectSnapshot(): Map<string, number> {
    const snapshot = new Map<string, number>();

    snapshot.set('eventListeners', this.estimateEventListeners());
    snapshot.set('timers', this.estimateTimers());
    snapshot.set('domNodes', this.estimateDOMNodes());
    snapshot.set('jsHeapSize', this.getJSHeapSize());

    return snapshot;
  }

  private estimateEventListeners(): number {
    const allElements = document.querySelectorAll('*');
    let count = 0;

    for (const element of Array.from(allElements)) {
      const listeners = (element as HTMLElement & { _events?: unknown[] })._events;
      if (listeners) {
        count += listeners.length;
      }
    }

    return count;
  }

  private estimateTimers(): number {
    return window.setTimeout(() => {}, 0) - window.setTimeout(() => {}, 1);
  }

  private estimateDOMNodes(): number {
    return document.querySelectorAll('*').length;
  }

  private getJSHeapSize(): number {
    const perf = window.performance as Performance & { memory?: { usedJSHeapSize: number } };
    return perf?.memory?.usedJSHeapSize || 0;
  }

  takeSnapshot(): Map<string, number> {
    const snapshot = this.collectSnapshot();
    this.snapshots.push(snapshot);

    if (this.snapshots.length > 10) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  detectLeaks(): LeakCandidate[] {
    if (!this.baseline || this.snapshots.length < 2) {
      return [];
    }

    const newCandidates: LeakCandidate[] = [];
    const latest = this.snapshots[this.snapshots.length - 1];
    const prev = this.snapshots[this.snapshots.length - 2] || this.baseline;

    const eventListenersDiff = this.getDiff(latest, prev, 'eventListeners');
    if (eventListenersDiff > this.config.eventListenerThreshold) {
      newCandidates.push(this.createCandidate(
        'event-listener',
        'high',
        `Event listeners increased by ${eventListenersDiff}`,
        { diff: eventListenersDiff, baseline: this.baseline.get('eventListeners') || 0 }
      ));
    }

    const timersDiff = this.getDiff(latest, prev, 'timers');
    if (timersDiff > this.config.timerThreshold) {
      newCandidates.push(this.createCandidate(
        'timer',
        'high',
        `Timers increased by ${timersDiff}`,
        { diff: timersDiff, baseline: this.baseline.get('timers') || 0 }
      ));
    }

    const domDiff = this.getDiff(latest, prev, 'domNodes');
    if (domDiff > 100) {
      newCandidates.push(this.createCandidate(
        'dom-reference',
        'medium',
        `DOM nodes increased by ${domDiff}`,
        { diff: domDiff, baseline: this.baseline.get('domNodes') || 0 }
      ));
    }

    const heapDiff = this.getDiff(latest, prev, 'jsHeapSize');
    if (heapDiff > 1024 * 1024 * 10) {
      newCandidates.push(this.createCandidate(
        'unknown',
        heapDiff > 1024 * 1024 * 50 ? 'high' : 'medium',
        `JS heap increased by ${this.formatBytes(heapDiff)}`,
        { diff: heapDiff, baseline: this.baseline.get('jsHeapSize') || 0 }
      ));
    }

    for (const candidate of newCandidates) {
      if (!this.hasSimilarCandidate(candidate)) {
        this.addCandidate(candidate);
      }
    }

    return newCandidates;
  }

  private getDiff(current: Map<string, number>, prev: Map<string, number>, key: string): number {
    return (current.get(key) || 0) - (prev.get(key) || 0);
  }

  private createCandidate(
    type: LeakType,
    severity: LeakCandidate['severity'],
    description: string,
    metadata?: Record<string, unknown>
  ): LeakCandidate {
    return {
      id: `leak-${++this.leakIdCounter}`,
      type,
      severity,
      description,
      stackTrace: this.getStackTrace(),
      timestamp: Date.now(),
      metadata,
    };
  }

  private getStackTrace(): string | undefined {
    try {
      const err = new Error();
      return err.stack;
    } catch {
      return undefined;
    }
  }

  private hasSimilarCandidate(candidate: LeakCandidate): boolean {
    return this.candidates.some(
      (c) =>
        c.type === candidate.type &&
        c.description === candidate.description &&
        c.timestamp > Date.now() - 60000
    );
  }

  private addCandidate(candidate: LeakCandidate): void {
    this.candidates.push(candidate);

    if (this.candidates.length > this.config.maxCandidates) {
      this.candidates.shift();
    }
  }

  reportLeak(type: LeakType, description: string, metadata?: Record<string, unknown>): string {
    const candidate = this.createCandidate(type, 'medium', description, metadata);
    this.addCandidate(candidate);
    return candidate.id;
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.createBaseline();

    this.intervalId = window.setInterval(() => {
      this.takeSnapshot();
      const leaks = this.detectLeaks();
      if (leaks.length > 0) {
        this.notifyListeners(leaks);
      }
    }, this.config.checkInterval);
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private notifyListeners(candidates: LeakCandidate[]): void {
    for (const callback of this.callbacks.values()) {
      try {
        callback(candidates);
      } catch (e) {
        console.error('Leak detection callback error:', e);
      }
    }
  }

  onLeakDetected(callback: (candidates: LeakCandidate[]) => void): () => void {
    const id = `callback-${Date.now()}`;
    this.callbacks.set(id, callback);
    return () => {
      this.callbacks.delete(id);
    };
  }

  getCandidates(): LeakCandidate[] {
    return [...this.candidates];
  }

  getCandidatesByType(type: LeakType): LeakCandidate[] {
    return this.candidates.filter((c) => c.type === type);
  }

  getCandidatesBySeverity(severity: LeakCandidate['severity']): LeakCandidate[] {
    return this.candidates.filter((c) => c.severity === severity);
  }

  clearCandidates(): void {
    this.candidates = [];
  }

  forceGC(): void {
    if (window.gc) {
      window.gc();
    } else {
      console.warn('Manual garbage collection not available. Use --expose-gc flag.');
    }
  }

  waitForGC(): Promise<void> {
    return new Promise((resolve) => {
      this.forceGC();
      setTimeout(resolve, 100);
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return `${value.toFixed(2)} ${sizes[i]}`;
  }

  reset(): void {
    this.stopMonitoring();
    this.candidates = [];
    this.snapshots = [];
    this.baseline = null;
  }

  isActive(): boolean {
    return this.isMonitoring;
  }

  getStats(): {
    isMonitoring: boolean;
    candidateCount: number;
    snapshotCount: number;
    hasBaseline: boolean;
    leakTypeBreakdown: Record<LeakType, number>;
  } {
    const breakdown: Record<LeakType, number> = {
      'event-listener': 0,
      timer: 0,
      'dom-reference': 0,
      closure: 0,
      cache: 0,
      unknown: 0,
    };

    for (const candidate of this.candidates) {
      breakdown[candidate.type]++;
    }

    return {
      isMonitoring: this.isMonitoring,
      candidateCount: this.candidates.length,
      snapshotCount: this.snapshots.length,
      hasBaseline: this.baseline !== null,
      leakTypeBreakdown: breakdown,
    };
  }
}

export { LeakDetector as default };
