/**
 * Performance Profiler - Profile render performance
 */

export interface ProfilerMark {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface ProfilerMeasure {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, unknown>;
}

export interface ProfilerStats {
  totalFrames: number;
  avgFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  fps: number;
  percentile95: number;
  percentile99: number;
  measuresCount: number;
}

export interface PerformanceBudget {
  frameTime: number;
  renderTime: number;
  updateTime: number;
}

export interface BudgetStatus {
  frameTime: { used: number; budget: number; over: boolean };
  renderTime: { used: number; budget: number; over: boolean };
  updateTime: { used: number; budget: number; over: boolean };
  isOverBudget: boolean;
}

export class PerformanceProfiler {
  private marks: Map<string, ProfilerMark> = new Map();
  private measures: ProfilerMeasure[] = [];
  private frameTimes: number[] = [];
  private maxFrameHistory: number = 120;
  private maxMeasureHistory: number = 1000;
  private budgets: PerformanceBudget = {
    frameTime: 16.67,
    renderTime: 8,
    updateTime: 4,
  };
  private isProfiling: boolean = false;
  private startTime: number = 0;

  start(): void {
    this.isProfiling = true;
    this.startTime = performance.now();
  }

  stop(): void {
    this.isProfiling = false;
  }

  isActive(): boolean {
    return this.isProfiling;
  }

  mark(name: string, metadata?: Record<string, unknown>): void {
    const mark: ProfilerMark = {
      name,
      startTime: performance.now(),
      metadata,
    };

    const existing = this.marks.get(name);
    if (existing && !existing.endTime) {
      existing.endTime = mark.startTime;
      existing.duration = existing.endTime - existing.startTime;
    }

    this.marks.set(name, mark);
  }

  measure(name: string, startMark: string, endMark?: string): void {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : { startTime: performance.now() };

    if (!start) {
      console.warn(`Measure "${name}": start mark "${startMark}" not found`);
      return;
    }

    const measure: ProfilerMeasure = {
      name,
      startTime: start.startTime,
      endTime: end?.startTime || performance.now(),
      duration: (end?.startTime || performance.now()) - start.startTime,
    };

    this.measures.push(measure);

    if (this.measures.length > this.maxMeasureHistory) {
      this.measures.shift();
    }
  }

  recordFrame(frameTime: number): void {
    this.frameTimes.push(frameTime);

    if (this.frameTimes.length > this.maxFrameHistory) {
      this.frameTimes.shift();
    }
  }

  getStats(): ProfilerStats {
    if (this.frameTimes.length === 0) {
      return {
        totalFrames: 0,
        avgFrameTime: 0,
        minFrameTime: 0,
        maxFrameTime: 0,
        fps: 0,
        percentile95: 0,
        percentile99: 0,
        measuresCount: this.measures.length,
      };
    }

    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / sorted.length;
    const fps = 1000 / avg;

    const percentile = (p: number): number => {
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)];
    };

    return {
      totalFrames: this.frameTimes.length,
      avgFrameTime: avg,
      minFrameTime: sorted[0],
      maxFrameTime: sorted[sorted.length - 1],
      fps,
      percentile95: percentile(95),
      percentile99: percentile(99),
      measuresCount: this.measures.length,
    };
  }

  getMeasures(name?: string): ProfilerMeasure[] {
    if (name) {
      return this.measures.filter((m) => m.name === name);
    }
    return [...this.measures];
  }

  getMeasureStats(name: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    totalDuration: number;
  } {
    const measures = this.measures.filter((m) => m.name === name);

    if (measures.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalDuration: 0,
      };
    }

    const durations = measures.map((m) => m.duration);
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      count: measures.length,
      avgDuration: sum / measures.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      totalDuration: sum,
    };
  }

  setBudgets(budgets: Partial<PerformanceBudget>): void {
    this.budgets = { ...this.budgets, ...budgets };
  }

  checkBudgets(frameTime: number, renderTime: number, updateTime: number): BudgetStatus {
    return {
      frameTime: {
        used: frameTime,
        budget: this.budgets.frameTime,
        over: frameTime > this.budgets.frameTime,
      },
      renderTime: {
        used: renderTime,
        budget: this.budgets.renderTime,
        over: renderTime > this.budgets.renderTime,
      },
      updateTime: {
        used: updateTime,
        budget: this.budgets.updateTime,
        over: updateTime > this.budgets.updateTime,
      },
      isOverBudget:
        frameTime > this.budgets.frameTime ||
        renderTime > this.budgets.renderTime ||
        updateTime > this.budgets.updateTime,
    };
  }

  clear(): void {
    this.marks.clear();
    this.measures = [];
    this.frameTimes = [];
  }

  reset(): void {
    this.clear();
    this.startTime = 0;
  }

  getTimeline(): Array<{ name: string; start: number; end: number; duration: number }> {
    return this.measures.map((m) => ({
      name: m.name,
      start: m.startTime - this.startTime,
      end: m.endTime - this.startTime,
      duration: m.duration,
    }));
  }

  generateReport(): string {
    const stats = this.getStats();
    const lines: string[] = [];

    lines.push('=== Performance Report ===');
    lines.push(`Total Frames: ${stats.totalFrames}`);
    lines.push(`Average FPS: ${stats.fps.toFixed(2)}`);
    lines.push(`Frame Time: ${stats.avgFrameTime.toFixed(2)}ms (avg), ${stats.minFrameTime.toFixed(2)}ms (min), ${stats.maxFrameTime.toFixed(2)}ms (max)`);
    lines.push(`95th percentile: ${stats.percentile95.toFixed(2)}ms`);
    lines.push(`99th percentile: ${stats.percentile99.toFixed(2)}ms`);
    lines.push('');
    lines.push('=== Budget Status ===');
    lines.push(`Frame budget: ${this.budgets.frameTime}ms`);
    lines.push(`Render budget: ${this.budgets.renderTime}ms`);
    lines.push(`Update budget: ${this.budgets.updateTime}ms`);
    lines.push('');
    lines.push('=== Measures ===');

    const measureNames = [...new Set(this.measures.map((m) => m.name))];
    for (const name of measureNames) {
      const stats = this.getMeasureStats(name);
      lines.push(`${name}: avg ${stats.avgDuration.toFixed(2)}ms, min ${stats.minDuration.toFixed(2)}ms, max ${stats.maxDuration.toFixed(2)}ms`);
    }

    return lines.join('\n');
  }
}

export { PerformanceProfiler as default };
