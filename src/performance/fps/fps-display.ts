/**
 * FPS Display - Visual FPS indicator
 */

import { FPSMonitor, FPSConfig, FrameTiming } from './fps-monitor';

export interface FPSDisplayConfig {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';
  x?: number;
  y?: number;
  showStats?: boolean;
  showGraph?: boolean;
  graphWidth?: number;
  graphHeight?: number;
  updateInterval?: number;
  decimals?: number;
  colorGood?: string;
  colorWarning?: string;
  colorBad?: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  zIndex?: number;
}

const defaultDisplayConfig: Required<Omit<FPSDisplayConfig, 'position' | 'x' | 'y'>> = {
  showStats: true,
  showGraph: true,
  graphWidth: 100,
  graphHeight: 30,
  updateInterval: 100,
  decimals: 1,
  colorGood: '#00ff00',
  colorWarning: '#ffff00',
  colorBad: '#ff0000',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  textColor: '#ffffff',
  fontSize: 12,
  fontFamily: 'monospace',
  zIndex: 9999,
};

export class FPSDisplay {
  private monitor: FPSMonitor;
  private config: Required<FPSDisplayConfig>;
  private container: HTMLElement | null = null;
  private fpsValueElement: HTMLElement | null = null;
  private statsElement: HTMLElement | null = null;
  private graphCanvas: HTMLCanvasElement | null = null;
  private graphCtx: CanvasRenderingContext2D | null = null;
  private graphData: number[] = [];
  private updateIntervalId: number | null = null;
  private isVisible: boolean = false;

  constructor(monitor: FPSMonitor, config: FPSDisplayConfig = {}) {
    this.monitor = monitor;
    this.config = {
      ...defaultDisplayConfig,
      position: config.position || 'top-right',
      x: config.x ?? 10,
      y: config.y ?? 10,
      ...config,
    };
  }

  mount(): HTMLElement {
    if (this.container) {
      return this.container;
    }

    this.container = document.createElement('div');
    this.container.className = 'peaai-fps-display';
    this.container.style.cssText = `
      position: fixed;
      ${this.getPositionCSS()}
      background: ${this.config.backgroundColor};
      color: ${this.config.textColor};
      font-family: ${this.config.fontFamily};
      font-size: ${this.config.fontSize}px;
      padding: 8px;
      border-radius: 4px;
      z-index: ${this.config.zIndex};
      pointer-events: none;
      user-select: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;

    this.fpsValueElement = document.createElement('div');
    this.fpsValueElement.style.fontWeight = 'bold';
    this.fpsValueElement.style.marginBottom = '4px';
    this.container.appendChild(this.fpsValueElement);

    if (this.config.showGraph) {
      this.graphCanvas = document.createElement('canvas');
      this.graphCanvas.width = this.config.graphWidth;
      this.graphCanvas.height = this.config.graphHeight;
      this.graphCanvas.style.display = 'block';
      this.graphCanvas.style.width = `${this.config.graphWidth}px`;
      this.graphCanvas.style.height = `${this.config.graphHeight}px`;
      this.graphCanvas.style.marginBottom = '4px';
      this.container.appendChild(this.graphCanvas);
      this.graphCtx = this.graphCanvas.getContext('2d');
    }

    if (this.config.showStats) {
      this.statsElement = document.createElement('div');
      this.statsElement.style.fontSize = '10px';
      this.statsElement.style.opacity = '0.8';
      this.container.appendChild(this.statsElement);
    }

    this.isVisible = true;
    document.body.appendChild(this.container);

    this.startUpdates();

    return this.container;
  }

  private getPositionCSS(): string {
    switch (this.config.position) {
      case 'top-left':
        return 'top: 10px; left: 10px;';
      case 'top-right':
        return 'top: 10px; right: 10px;';
      case 'bottom-left':
        return 'bottom: 10px; left: 10px;';
      case 'bottom-right':
        return 'bottom: 10px; right: 10px;';
      case 'custom':
        return `top: ${this.config.y}px; left: ${this.config.x}px;`;
      default:
        return 'top: 10px; right: 10px;';
    }
  }

  private startUpdates(): void {
    this.updateIntervalId = window.setInterval(() => {
      this.update();
    }, this.config.updateInterval);

    this.monitor.onFrame((timing: FrameTiming) => {
      this.addGraphDataPoint(timing.fps);
    });
  }

  private update(): void {
    if (!this.isVisible || !this.fpsValueElement) return;

    const stats = this.monitor.getStats();
    const fpsColor = this.getFPSColor(stats.fps);

    this.fpsValueElement.textContent = `FPS: ${stats.fps.toFixed(this.config.decimals)}`;
    this.fpsValueElement.style.color = fpsColor;

    if (this.statsElement) {
      this.statsElement.textContent = `Avg: ${stats.avgFPS} | Min: ${stats.minFPS} | Max: ${stats.maxFPS}`;
    }

    if (this.config.showGraph) {
      this.renderGraph();
    }
  }

  private getFPSColor(fps: number): string {
    const target = this.monitor.getStats().targetFPS;
    const ratio = fps / target;

    if (ratio >= 1) {
      return this.config.colorGood;
    } else if (ratio >= 0.8) {
      return this.config.colorWarning;
    } else {
      return this.config.colorBad;
    }
  }

  private addGraphDataPoint(fps: number): void {
    this.graphData.push(fps);
    const maxPoints = Math.floor(this.config.graphWidth / 2);
    if (this.graphData.length > maxPoints) {
      this.graphData.shift();
    }
  }

  private renderGraph(): void {
    if (!this.graphCtx || !this.graphCanvas) return;

    const { width, height } = this.graphCanvas;
    const ctx = this.graphCtx;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);

    if (this.graphData.length < 2) return;

    const target = this.monitor.getStats().targetFPS;
    const maxFPS = Math.max(target * 1.5, ...this.graphData);
    const minFPS = Math.min(0, ...this.graphData);
    const range = maxFPS - minFPS || 1;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    const targetY = height - (target - minFPS) / range * height;
    ctx.beginPath();
    ctx.moveTo(0, targetY);
    ctx.lineTo(width, targetY);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = this.config.colorGood;
    ctx.lineWidth = 2;

    for (let i = 0; i < this.graphData.length; i++) {
      const x = (i / (this.graphData.length - 1)) * width;
      const y = height - ((this.graphData[i] - minFPS) / range) * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    const lastIndex = this.graphData.length - 1;
    const lastX = width;
    const lastY = height - ((this.graphData[lastIndex] - minFPS) / range) * height;

    ctx.fillStyle = this.getFPSColor(this.graphData[lastIndex]);
    ctx.beginPath();
    ctx.arc(lastX - 2, lastY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  show(): void {
    if (this.container) {
      this.container.style.display = 'block';
      this.isVisible = true;
    }
  }

  hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
      this.isVisible = false;
    }
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  unmount(): void {
    if (this.updateIntervalId !== null) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.container = null;
    this.fpsValueElement = null;
    this.statsElement = null;
    this.graphCanvas = null;
    this.graphCtx = null;
    this.isVisible = false;
  }

  setPosition(x: number, y: number): void {
    this.config.x = x;
    this.config.y = y;
    if (this.container) {
      this.container.style.top = `${y}px`;
      this.container.style.left = `${x}px`;
    }
  }
}

export { FPSDisplay as default };
