/**
 * Render Batching - Batch render operations for optimal performance
 */

export interface RenderBatchItem {
  id: string;
  priority: number;
  render: () => void;
  region?: { x: number; y: number; width: number; height: number };
}

export interface RenderBatcherConfig {
  maxBatchSize?: number;
  maxWaitTime?: number;
  enablePrioritization?: boolean;
  enableRegionBatching?: boolean;
}

const defaultConfig: Required<RenderBatcherConfig> = {
  maxBatchSize: 100,
  maxWaitTime: 16,
  enablePrioritization: true,
  enableRegionBatching: true,
};

export class RenderBatcher {
  private config: Required<RenderBatcherConfig>;
  private pendingItems: RenderBatchItem[] = [];
  private executing: boolean = false;
  private lastFlushTime: number = 0;
  private flushTimerId: number | null = null;
  private onFlush?: () => void;

  constructor(config: RenderBatcherConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  add(item: RenderBatchItem): void {
    if (this.pendingItems.length >= this.config.maxBatchSize) {
      this.flush();
    }

    const existingIndex = this.pendingItems.findIndex((i) => i.id === item.id);
    if (existingIndex !== -1) {
      this.pendingItems[existingIndex] = item;
    } else {
      this.pendingItems.push(item);
    }

    if (this.config.enablePrioritization) {
      this.pendingItems.sort((a, b) => b.priority - a.priority);
    }

    this.scheduleFlush();
  }

  addRender(id: string, render: () => void, priority: number = 0): void {
    this.add({ id, render, priority });
  }

  remove(id: string): boolean {
    const index = this.pendingItems.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.pendingItems.splice(index, 1);
      return true;
    }
    return false;
  }

  has(id: string): boolean {
    return this.pendingItems.some((item) => item.id === id);
  }

  private scheduleFlush(): void {
    if (this.flushTimerId !== null) return;

    const now = performance.now();
    const timeSinceLastFlush = now - this.lastFlushTime;

    if (timeSinceLastFlush >= this.config.maxWaitTime) {
      this.flush();
      return;
    }

    const delay = this.config.maxWaitTime - timeSinceLastFlush;
    this.flushTimerId = window.setTimeout(() => {
      this.flushTimerId = null;
      this.flush();
    }, delay);
  }

  flush(): void {
    if (this.executing || this.pendingItems.length === 0) {
      if (this.flushTimerId !== null) {
        clearTimeout(this.flushTimerId);
        this.flushTimerId = null;
      }
      return;
    }

    if (this.flushTimerId !== null) {
      clearTimeout(this.flushTimerId);
      this.flushTimerId = null;
    }

    this.executing = true;
    this.lastFlushTime = performance.now();

    try {
      if (this.config.enableRegionBatching) {
        this.flushWithRegionBatching();
      } else {
        this.flushSimple();
      }
    } finally {
      this.executing = false;
      if (this.onFlush) {
        this.onFlush();
      }
    }
  }

  private flushSimple(): void {
    const items = [...this.pendingItems];
    this.pendingItems = [];

    for (const item of items) {
      try {
        item.render();
      } catch (error) {
        console.error(`Render batch item ${item.id} failed:`, error);
      }
    }
  }

  private flushWithRegionBatching(): void {
    const regions = new Map<string, RenderBatchItem[]>();

    for (const item of this.pendingItems) {
      const regionKey = item.region
        ? `${item.region.x},${item.region.y},${item.region.width},${item.region.height}`
        : 'full';

      if (!regions.has(regionKey)) {
        regions.set(regionKey, []);
      }
      regions.get(regionKey)!.push(item);
    }

    const sortedRegions = Array.from(regions.entries()).sort((a, b) => {
      if (a[0] === 'full') return -1;
      if (b[0] === 'full') return 1;
      return 0;
    });

    this.pendingItems = [];

    for (const [, items] of sortedRegions) {
      for (const item of items) {
        try {
          item.render();
        } catch (error) {
          console.error(`Render batch item ${item.id} failed:`, error);
        }
      }
    }
  }

  onFrameFlush(callback: () => void): () => void {
    this.onFlush = callback;
    return () => {
      this.onFlush = undefined;
    };
  }

  clear(): void {
    this.pendingItems = [];
    if (this.flushTimerId !== null) {
      clearTimeout(this.flushTimerId);
      this.flushTimerId = null;
    }
  }

  size(): number {
    return this.pendingItems.length;
  }

  isEmpty(): boolean {
    return this.pendingItems.length === 0;
  }

  isExecuting(): boolean {
    return this.executing;
  }

  getPendingItems(): RenderBatchItem[] {
    return [...this.pendingItems];
  }

  setMaxBatchSize(size: number): void {
    this.config.maxBatchSize = size;
  }

  setMaxWaitTime(ms: number): void {
    this.config.maxWaitTime = ms;
  }

  getStats(): {
    pendingCount: number;
    isExecuting: boolean;
    lastFlushTime: number;
    maxBatchSize: number;
  } {
    return {
      pendingCount: this.pendingItems.length,
      isExecuting: this.executing,
      lastFlushTime: this.lastFlushTime,
      maxBatchSize: this.config.maxBatchSize,
    };
  }
}

export { RenderBatcher as default };
