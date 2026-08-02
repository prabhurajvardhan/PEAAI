/**
 * GPU Memory Tracking - Track and manage GPU memory usage
 */

export interface GPUMemoryStats {
  estimatedMemory: number;
  textureMemory: number;
  bufferMemory: number;
  layerMemory: number;
  trackedObjects: number;
  isSupported: boolean;
  vendor: string;
  renderer: string;
}

export interface TrackedGPUObject {
  id: string;
  type: 'texture' | 'buffer' | 'layer' | 'canvas';
  size: number;
  element?: HTMLElement;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export interface GPUMemoryConfig {
  enableTracking?: boolean;
  warningThreshold?: number;
  criticalThreshold?: number;
  maxTrackedObjects?: number;
}

const defaultConfig: Required<GPUMemoryConfig> = {
  enableTracking: true,
  warningThreshold: 0.7,
  criticalThreshold: 0.9,
  maxTrackedObjects: 1000,
};

export class GPUMemoryTracker {
  private config: Required<GPUMemoryConfig>;
  private trackedObjects: Map<string, TrackedGPUObject> = new Map();
  private memoryUsage: Map<string, number> = new Map();
  private callbacks: Map<string, (status: string) => void> = new Map();
  private isMonitoring: boolean = false;
  private monitorIntervalId: number | null = null;
  private deviceInfo: { vendor: string; renderer: string; isSupported: boolean } = {
    vendor: 'unknown',
    renderer: 'unknown',
    isSupported: false,
  };

  constructor(config: GPUMemoryConfig = {}) {
    this.config = { ...defaultConfig, ...config };
    this.detectGPU();
  }

  private detectGPU(): void {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (gl && gl instanceof WebGLRenderingContext) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          this.deviceInfo.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown';
          this.deviceInfo.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
        }
        this.deviceInfo.isSupported = true;
      }
    } catch (e) {
      console.warn('GPU detection failed:', e);
    }
  }

  track(
    id: string,
    type: TrackedGPUObject['type'],
    size: number,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.config.enableTracking) return;

    if (this.trackedObjects.size >= this.config.maxTrackedObjects) {
      this.evictOldest();
    }

    const obj: TrackedGPUObject = {
      id,
      type,
      size,
      createdAt: Date.now(),
      metadata,
    };

    this.trackedObjects.set(id, obj);
    this.updateMemoryUsage(type, size);
  }

  private updateMemoryUsage(type: TrackedGPUObject['type'], delta: number): void {
    const current = this.memoryUsage.get(type) || 0;
    this.memoryUsage.set(type, current + delta);
  }

  untrack(id: string): boolean {
    const obj = this.trackedObjects.get(id);
    if (!obj) return false;

    this.updateMemoryUsage(obj.type, -obj.size);
    this.trackedObjects.delete(id);
    return true;
  }

  trackTexture(id: string, width: number, height: number, format: string = 'rgba'): void {
    const bytesPerPixel = format.includes('rgba') ? 4 : format.includes('rgb') ? 3 : 1;
    const size = width * height * bytesPerPixel;
    this.track(id, 'texture', size, { width, height, format });
  }

  trackBuffer(id: string, byteLength: number): void {
    this.track(id, 'buffer', byteLength);
  }

  trackLayer(id: string, element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const size = rect.width * rect.height * 4;
    this.track(id, 'layer', size, { width: rect.width, height: rect.height });
  }

  trackCanvas(id: string, width: number, height: number): void {
    const size = width * height * 4;
    this.track(id, 'canvas', size, { width, height });
  }

  private evictOldest(): void {
    let oldest: TrackedGPUObject | null = null;
    let oldestId: string | null = null;

    for (const [id, obj] of this.trackedObjects) {
      if (!oldest || obj.createdAt < oldest.createdAt) {
        oldest = obj;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.untrack(oldestId);
    }
  }

  getStats(): GPUMemoryStats {
    let totalMemory = 0;
    for (const size of this.memoryUsage.values()) {
      totalMemory += size;
    }

    return {
      estimatedMemory: totalMemory,
      textureMemory: this.memoryUsage.get('texture') || 0,
      bufferMemory: this.memoryUsage.get('buffer') || 0,
      layerMemory: this.memoryUsage.get('layer') || 0,
      trackedObjects: this.trackedObjects.size,
      isSupported: this.deviceInfo.isSupported,
      vendor: this.deviceInfo.vendor,
      renderer: this.deviceInfo.renderer,
    };
  }

  getObject(id: string): TrackedGPUObject | undefined {
    return this.trackedObjects.get(id);
  }

  getObjectsByType(type: TrackedGPUObject['type']): TrackedGPUObject[] {
    return Array.from(this.trackedObjects.values()).filter((obj) => obj.type === type);
  }

  getMemoryBreakdown(): Record<TrackedGPUObject['type'], number> {
    return {
      texture: this.memoryUsage.get('texture') || 0,
      buffer: this.memoryUsage.get('buffer') || 0,
      layer: this.memoryUsage.get('layer') || 0,
      canvas: this.memoryUsage.get('canvas') || 0,
    };
  }

  onMemoryWarning(callback: (status: string) => void): () => void {
    const id = `callback-${Date.now()}`;
    this.callbacks.set(id, callback);
    return () => {
      this.callbacks.delete(id);
    };
  }

  private checkMemoryThreshold(): void {
    const stats = this.getStats();
    const maxMemory = 512 * 1024 * 1024;
    const usageRatio = stats.estimatedMemory / maxMemory;

    let status = 'ok';
    if (usageRatio >= this.config.criticalThreshold) {
      status = 'critical';
    } else if (usageRatio >= this.config.warningThreshold) {
      status = 'warning';
    }

    if (status !== 'ok') {
      for (const callback of this.callbacks.values()) {
        try {
          callback(status);
        } catch (e) {
          console.error('GPU memory warning callback error:', e);
        }
      }
    }
  }

  startMonitoring(interval: number = 5000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitorIntervalId = window.setInterval(() => {
      this.checkMemoryThreshold();
    }, interval);
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitorIntervalId !== null) {
      clearInterval(this.monitorIntervalId);
      this.monitorIntervalId = null;
    }
  }

  clear(): void {
    this.trackedObjects.clear();
    this.memoryUsage.clear();
  }

  getDeviceInfo(): { vendor: string; renderer: string; isSupported: boolean } {
    return { ...this.deviceInfo };
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  getFormattedStats(): Record<string, string | number | boolean> {
    const stats = this.getStats();
    return {
      estimatedMemory: this.formatBytes(stats.estimatedMemory),
      textureMemory: this.formatBytes(stats.textureMemory),
      bufferMemory: this.formatBytes(stats.bufferMemory),
      layerMemory: this.formatBytes(stats.layerMemory),
      trackedObjects: stats.trackedObjects,
      isSupported: stats.isSupported,
      vendor: stats.vendor,
      renderer: stats.renderer,
    };
  }
}

export { GPUMemoryTracker as default };
