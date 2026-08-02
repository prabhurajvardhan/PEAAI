/**
 * Layer Promotion Hints - CSS layer promotion optimization
 */

export type LayerPriority = 'low' | 'medium' | 'high' | 'critical';

export interface LayerPromotionConfig {
  enabled?: boolean;
  defaultPriority?: LayerPriority;
  maxLayers?: number;
}

export interface LayerInfo {
  element: HTMLElement;
  priority: LayerPriority;
  size: number;
  reason: string;
}

const defaultConfig: Required<LayerPromotionConfig> = {
  enabled: true,
  defaultPriority: 'medium',
  maxLayers: 50,
};

const PRIORITY_ORDER: Record<LayerPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export class LayerPromotionManager {
  private config: Required<LayerPromotionConfig>;
  private promotedLayers: Map<HTMLElement, LayerInfo> = new Map();
  private pendingLayers: Set<HTMLElement> = new Set();

  constructor(config: LayerPromotionConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  promote(
    element: HTMLElement,
    priority: LayerPriority = 'medium',
    reason: string = ''
  ): boolean {
    if (!this.config.enabled) return false;

    if (this.promotedLayers.size >= this.config.maxLayers) {
      this.evictLowestPriority();
    }

    const currentInfo = this.promotedLayers.get(element);
    if (currentInfo) {
      if (PRIORITY_ORDER[priority] > PRIORITY_ORDER[currentInfo.priority]) {
        currentInfo.priority = priority;
        currentInfo.reason = reason;
        this.applyWillChange(element, priority);
        return true;
      }
      return false;
    }

    const size = this.calculateLayerSize(element);
    this.promotedLayers.set(element, {
      element,
      priority,
      size,
      reason,
    });

    this.applyWillChange(element, priority);
    return true;
  }

  private calculateLayerSize(element: HTMLElement): number {
    const rect = element.getBoundingClientRect();
    return rect.width * rect.height;
  }

  private applyWillChange(element: HTMLElement, priority: LayerPriority): void {
    const property = this.getWillChangeProperty(priority);
    element.style.willChange = property;
  }

  private getWillChangeProperty(priority: LayerPriority): string {
    switch (priority) {
      case 'critical':
        return 'transform, opacity, top, left';
      case 'high':
        return 'transform, opacity';
      case 'medium':
        return 'transform';
      case 'low':
      default:
        return 'auto';
    }
  }

  demote(element: HTMLElement): boolean {
    const info = this.promotedLayers.get(element);
    if (!info) return false;

    element.style.willChange = 'auto';
    this.promotedLayers.delete(element);
    return true;
  }

  private evictLowestPriority(): void {
    let lowestPriority: LayerPriority = 'critical';
    let lowestLayer: HTMLElement | null = null;

    for (const [element, info] of this.promotedLayers) {
      if (PRIORITY_ORDER[info.priority] < PRIORITY_ORDER[lowestPriority]) {
        lowestPriority = info.priority;
        lowestLayer = element;
      }
    }

    if (lowestLayer) {
      this.demote(lowestLayer);
    }
  }

  updatePriority(element: HTMLElement, newPriority: LayerPriority): boolean {
    const info = this.promotedLayers.get(element);
    if (!info) return false;

    if (PRIORITY_ORDER[newPriority] > PRIORITY_ORDER[info.priority]) {
      info.priority = newPriority;
      this.applyWillChange(element, newPriority);
      return true;
    }

    return false;
  }

  getPromotedLayers(): LayerInfo[] {
    return Array.from(this.promotedLayers.values());
  }

  isPromoted(element: HTMLElement): boolean {
    return this.promotedLayers.has(element);
  }

  getLayerInfo(element: HTMLElement): LayerInfo | undefined {
    return this.promotedLayers.get(element);
  }

  getTotalLayerSize(): number {
    let total = 0;
    for (const info of this.promotedLayers.values()) {
      total += info.size;
    }
    return total;
  }

  optimize(elements: HTMLElement[], priorities: Map<HTMLElement, LayerPriority>): void {
    const sorted = elements
      .map((el, i) => ({ element: el, priority: priorities.get(el) || 'medium', index: i }))
      .sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority])
      .slice(0, this.config.maxLayers);

    for (const { element, priority } of sorted) {
      this.promote(element, priority);
    }

    for (const el of elements) {
      if (!sorted.find((s) => s.element === el)) {
        this.demote(el);
      }
    }
  }

  clear(): void {
    for (const element of this.promotedLayers.keys()) {
      element.style.willChange = 'auto';
    }
    this.promotedLayers.clear();
    this.pendingLayers.clear();
  }

  enable(): void {
    this.config.enabled = true;
  }

  disable(): void {
    this.config.enabled = false;
    this.clear();
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getStats(): {
    promotedCount: number;
    totalLayerSize: number;
    priorityBreakdown: Record<LayerPriority, number>;
    maxLayers: number;
  } {
    const breakdown: Record<LayerPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const info of this.promotedLayers.values()) {
      breakdown[info.priority]++;
    }

    return {
      promotedCount: this.promotedLayers.size,
      totalLayerSize: this.getTotalLayerSize(),
      priorityBreakdown: breakdown,
      maxLayers: this.config.maxLayers,
    };
  }
}

export { LayerPromotionManager as default };
