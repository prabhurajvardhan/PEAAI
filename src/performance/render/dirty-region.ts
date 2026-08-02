/**
 * Dirty Region Tracking - Track changed regions for optimized rendering
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DirtyRegionConfig {
  maxRegions?: number;
  mergeDistance?: number;
  trackHistory?: boolean;
}

const defaultConfig: Required<DirtyRegionConfig> = {
  maxRegions: 16,
  mergeDistance: 2,
  trackHistory: true,
};

export class DirtyRegionTracker {
  private config: Required<DirtyRegionConfig>;
  private dirtyRegions: Rect[] = [];
  private history: Rect[][] = [];
  private maxHistory: number = 10;
  private fullRedraw: boolean = false;
  private lastFrameRegions: Rect[] = [];

  constructor(config: DirtyRegionConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  markDirty(x: number, y: number, width: number = 1, height: number = 1): void {
    this.fullRedraw = false;
    this.addRegion({ x, y, width, height });
  }

  markDirtyRect(rect: Rect): void {
    this.fullRedraw = false;
    this.addRegion({ ...rect });
  }

  markFullRedraw(): void {
    this.fullRedraw = true;
    this.dirtyRegions = [];
  }

  private addRegion(rect: Rect): void {
    if (rect.width <= 0 || rect.height <= 0) return;

    const normalized = this.normalizeRect(rect);

    for (const existing of this.dirtyRegions) {
      if (this.rectsOverlap(normalized, existing)) {
        this.mergeRegions(existing, normalized);
        return;
      }
    }

    if (this.dirtyRegions.length >= this.config.maxRegions) {
      this.fullRedraw = true;
      this.dirtyRegions = [];
      return;
    }

    this.dirtyRegions.push(normalized);
  }

  private normalizeRect(rect: Rect): Rect {
    return {
      x: Math.floor(rect.x),
      y: Math.floor(rect.y),
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height),
    };
  }

  private rectsOverlap(a: Rect, b: Rect): boolean {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    );
  }

  private mergeRegions(existing: Rect, newRect: Rect): void {
    const minX = Math.min(existing.x, newRect.x);
    const minY = Math.min(existing.y, newRect.y);
    const maxX = Math.max(existing.x + existing.width, newRect.x + newRect.width);
    const maxY = Math.max(existing.y + existing.height, newRect.y + newRect.height);

    existing.x = minX;
    existing.y = minY;
    existing.width = maxX - minX;
    existing.height = maxY - minY;
  }

  getDirtyRegions(): Rect[] {
    return [...this.dirtyRegions];
  }

  needsFullRedraw(): boolean {
    return this.fullRedraw;
  }

  hasDirtyRegions(): boolean {
    return this.fullRedraw || this.dirtyRegions.length > 0;
  }

  getLastFrameRegions(): Rect[] {
    return [...this.lastFrameRegions];
  }

  getStats(): {
    dirtyCount: number;
    totalDirtyArea: number;
    hasFullRedraw: boolean;
    historyLength: number;
  } {
    const totalArea = this.dirtyRegions.reduce(
      (sum, r) => sum + r.width * r.height,
      0
    );

    return {
      dirtyCount: this.dirtyRegions.length,
      totalDirtyArea: totalArea,
      hasFullRedraw: this.fullRedraw,
      historyLength: this.history.length,
    };
  }

  frame(): void {
    if (this.config.trackHistory) {
      this.history.push([...this.dirtyRegions]);
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
    }

    this.lastFrameRegions = [...this.dirtyRegions];
    this.dirtyRegions = [];
    this.fullRedraw = false;
  }

  getHistory(): Rect[][] {
    return [...this.history];
  }

  reset(): void {
    this.dirtyRegions = [];
    this.history = [];
    this.fullRedraw = false;
    this.lastFrameRegions = [];
  }

  setMaxRegions(max: number): void {
    this.config.maxRegions = max;
  }

  setMergeDistance(distance: number): void {
    this.config.mergeDistance = distance;
  }

  unionRegions(regions: Rect[]): Rect | null {
    if (regions.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const r of regions) {
      minX = Math.min(minX, r.x);
      minY = Math.min(minY, r.y);
      maxX = Math.max(maxX, r.x + r.width);
      maxY = Math.max(maxY, r.y + r.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  clipToBounds(regions: Rect[], bounds: Rect): Rect[] {
    return regions
      .map((r) => this.intersectRects(r, bounds))
      .filter((r) => r.width > 0 && r.height > 0);
  }

  private intersectRects(a: Rect, b: Rect): Rect {
    const x = Math.max(a.x, b.x);
    const y = Math.max(a.y, b.y);
    const width = Math.min(a.x + a.width, b.x + b.width) - x;
    const height = Math.min(a.y + a.height, b.y + b.height) - y;

    return { x, y, width, height };
  }
}

export { DirtyRegionTracker as default };
