/**
 * Composite Layers - GPU compositing optimization
 */

export type CompositeMode = 'auto' | 'none' | 'single' | 'multiple';

export interface CompositeLayerConfig {
  mode?: CompositeMode;
  enableIsolation?: boolean;
  forceLayer?: boolean;
}

export interface CompositeLayer {
  element: HTMLElement;
  mode: CompositeMode;
  isolation: string;
  zIndex: number;
}

const defaultConfig: Required<CompositeLayerConfig> = {
  mode: 'auto',
  enableIsolation: true,
  forceLayer: false,
};

export class CompositeLayerManager {
  private config: Required<CompositeLayerConfig>;
  private layers: Map<HTMLElement, CompositeLayer> = new Map();
  private isolationGroupCounter: number = 0;

  constructor(config: CompositeLayerConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  setMode(mode: CompositeMode): void {
    this.config.mode = mode;
    this.reapplyAll();
  }

  setForceLayer(force: boolean): void {
    this.config.forceLayer = force;
    this.reapplyAll();
  }

  setEnableIsolation(enable: boolean): void {
    this.config.enableIsolation = enable;
    this.reapplyAll();
  }

  createLayer(element: HTMLElement, options?: CompositeLayerConfig): CompositeLayer | null {
    if (this.layers.has(element)) {
      return this.layers.get(element)!;
    }

    const mode = options?.mode || this.config.mode;
    const layer: CompositeLayer = {
      element,
      mode,
      isolation: this.config.enableIsolation ? `isolate-${this.isolationGroupCounter++}` : 'auto',
      zIndex: this.calculateNextZIndex(),
    };

    this.applyLayerStyle(element, layer, options);
    this.layers.set(element, layer);
    return layer;
  }

  private calculateNextZIndex(): number {
    let maxZ = 0;
    for (const layer of this.layers.values()) {
      if (layer.zIndex > maxZ) {
        maxZ = layer.zIndex;
      }
    }
    return maxZ + 1;
  }

  private applyLayerStyle(
    element: HTMLElement,
    layer: CompositeLayer,
    options?: CompositeLayerConfig
  ): void {
    if (options?.mode === 'none') {
      element.style.isolation = 'auto';
      element.style.transform = 'translateZ(0)';
      return;
    }

    if (this.config.enableIsolation) {
      element.style.isolation = layer.isolation;
    }

    const transform = this.getLayerTransform(layer.mode, element);
    if (transform) {
      element.style.transform = transform;
    }

    if (this.config.forceLayer || layer.mode === 'multiple') {
      element.style.willChange = 'transform';
    }
  }

  private getLayerTransform(mode: CompositeMode, element: HTMLElement): string {
    switch (mode) {
      case 'single':
        return 'translateZ(0)';
      case 'multiple':
        return 'translateZ(0) scale(1)';
      case 'none':
        return 'none';
      case 'auto':
      default:
        return 'translateZ(0)';
    }
  }

  removeLayer(element: HTMLElement): boolean {
    if (!this.layers.has(element)) return false;

    element.style.isolation = 'auto';
    element.style.transform = 'none';
    element.style.willChange = 'auto';
    this.layers.delete(element);
    return true;
  }

  getLayer(element: HTMLElement): CompositeLayer | undefined {
    return this.layers.get(element);
  }

  isLayered(element: HTMLElement): boolean {
    return this.layers.has(element);
  }

  private reapplyAll(): void {
    const entries = Array.from(this.layers.entries());
    this.layers.clear();

    for (const [element] of entries) {
      if (element.isConnected) {
        this.createLayer(element);
      }
    }
  }

  updateLayerMode(element: HTMLElement, mode: CompositeMode): boolean {
    const layer = this.layers.get(element);
    if (!layer) return false;

    layer.mode = mode;
    this.applyLayerStyle(element, layer);
    return true;
  }

  bringToFront(element: HTMLElement): boolean {
    const layer = this.layers.get(element);
    if (!layer) return false;

    layer.zIndex = this.calculateNextZIndex();
    element.style.zIndex = String(layer.zIndex);
    return true;
  }

  sendToBack(element: HTMLElement): boolean {
    const layer = this.layers.get(element);
    if (!layer) return false;

    const minZ = Math.min(...Array.from(this.layers.values()).map((l) => l.zIndex));
    layer.zIndex = minZ - 1;
    element.style.zIndex = String(layer.zIndex);
    return true;
  }

  groupElements(elements: HTMLElement[]): string {
    const groupId = `layer-group-${this.isolationGroupCounter++}`;

    for (const element of elements) {
      const layer = this.layers.get(element);
      if (layer) {
        layer.isolation = groupId;
        element.style.isolation = groupId;
      }
    }

    return groupId;
  }

  ungroupElements(elements: HTMLElement[]): void {
    for (const element of elements) {
      const layer = this.layers.get(element);
      if (layer) {
        layer.isolation = `isolate-${this.isolationGroupCounter++}`;
        element.style.isolation = layer.isolation;
      }
    }
  }

  optimizeLayers(): void {
    const sorted = Array.from(this.layers.values()).sort((a, b) => a.zIndex - b.zIndex);

    for (const layer of sorted) {
      this.applyLayerStyle(layer.element, layer);
    }
  }

  clear(): void {
    for (const element of this.layers.keys()) {
      element.style.isolation = 'auto';
      element.style.transform = 'none';
      element.style.willChange = 'auto';
    }
    this.layers.clear();
  }

  getLayers(): CompositeLayer[] {
    return Array.from(this.layers.values());
  }

  getLayerCount(): number {
    return this.layers.size;
  }

  getStats(): {
    layerCount: number;
    mode: CompositeMode;
    enableIsolation: boolean;
    forceLayer: boolean;
    zIndexRange: { min: number; max: number };
  } {
    const layers = Array.from(this.layers.values());
    const zIndexes = layers.map((l) => l.zIndex);

    return {
      layerCount: this.layers.size,
      mode: this.config.mode,
      enableIsolation: this.config.enableIsolation,
      forceLayer: this.config.forceLayer,
      zIndexRange: {
        min: zIndexes.length > 0 ? Math.min(...zIndexes) : 0,
        max: zIndexes.length > 0 ? Math.max(...zIndexes) : 0,
      },
    };
  }
}

export { CompositeLayerManager as default };
