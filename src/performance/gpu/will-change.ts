/**
 * Will-change Optimization - CSS will-change property management
 */

export type WillChangeProperty = 'auto' | 'scroll-position' | 'contents' | 'transform' | 'transform, opacity' | string;

export interface WillChangeConfig {
  optimizationLevel?: 'none' | 'basic' | 'aggressive';
  hintDuration?: number;
  maxHints?: number;
  autoCleanup?: boolean;
}

export interface WillChangeHint {
  element: HTMLElement;
  property: string;
  startTime: number;
  timeoutId?: number;
}

const defaultConfig: Required<WillChangeConfig> = {
  optimizationLevel: 'basic',
  hintDuration: 500,
  maxHints: 50,
  autoCleanup: true,
};

export class WillChangeManager {
  private config: Required<WillChangeConfig>;
  private hints: Map<HTMLElement, WillChangeHint> = new Map();
  private scheduledCleanups: Set<HTMLElement> = new Set();
  private animationFrames: Set<number> = new Set();

  constructor(config: WillChangeConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  hint(element: HTMLElement, property: WillChangeProperty = 'transform'): void {
    if (this.hints.size >= this.config.maxHints) {
      this.cleanupOldestHint();
    }

    const existing = this.hints.get(element);
    if (existing) {
      element.style.willChange = property;
      this.resetHintTimeout(element, existing);
      return;
    }

    element.style.willChange = String(property);

    const hint: WillChangeHint = {
      element,
      property: String(property),
      startTime: performance.now(),
    };

    if (this.config.autoCleanup) {
      hint.timeoutId = window.setTimeout(() => {
        this.removeHint(element);
      }, this.config.hintDuration);
    }

    this.hints.set(element, hint);
  }

  hintTransform(element: HTMLElement): void {
    this.hint(element, 'transform');
  }

  hintOpacity(element: HTMLElement): void {
    this.hint(element, 'opacity');
  }

  hintTransformOpacity(element: HTMLElement): void {
    this.hint(element, 'transform, opacity');
  }

  hintScrollPosition(element: HTMLElement): void {
    this.hint(element, 'scroll-position');
  }

  hintContents(element: HTMLElement): void {
    this.hint(element, 'contents');
  }

  removeHint(element: HTMLElement): void {
    const hint = this.hints.get(element);
    if (!hint) return;

    if (hint.timeoutId !== undefined) {
      clearTimeout(hint.timeoutId);
    }

    element.style.willChange = 'auto';
    this.hints.delete(element);
  }

  private resetHintTimeout(element: HTMLElement, hint: WillChangeHint): void {
    if (hint.timeoutId !== undefined) {
      clearTimeout(hint.timeoutId);
    }

    if (this.config.autoCleanup) {
      hint.timeoutId = window.setTimeout(() => {
        this.removeHint(element);
      }, this.config.hintDuration);
    }
  }

  private cleanupOldestHint(): void {
    let oldest: WillChangeHint | null = null;
    let oldestElement: HTMLElement | null = null;

    for (const [element, hint] of this.hints) {
      if (!oldest || hint.startTime < oldest.startTime) {
        oldest = hint;
        oldestElement = element;
      }
    }

    if (oldestElement) {
      this.removeHint(oldestElement);
    }
  }

  scheduleHint(element: HTMLElement, property: WillChangeProperty = 'transform'): void {
    const frameId = requestAnimationFrame(() => {
      this.hint(element, property);
      this.animationFrames.delete(frameId);
    });
    this.animationFrames.add(frameId);
  }

  optimizeForAnimation(element: HTMLElement, duration: number = 1000): void {
    this.hint(element, 'transform, opacity');

    if (this.config.autoCleanup) {
      setTimeout(() => {
        this.removeHint(element);
      }, duration);
    }
  }

  optimizeForFrequentUpdates(element: HTMLElement): void {
    const hint = this.hints.get(element);
    if (hint && hint.timeoutId !== undefined) {
      clearTimeout(hint.timeoutId);
      hint.timeoutId = undefined;
    }

    element.style.willChange = 'transform';

    if (!this.hints.has(element)) {
      this.hints.set(element, {
        element,
        property: 'transform',
        startTime: performance.now(),
        timeoutId: undefined,
      });
    }
  }

  isHinted(element: HTMLElement): boolean {
    return this.hints.has(element);
  }

  getHint(element: HTMLElement): WillChangeHint | undefined {
    return this.hints.get(element);
  }

  cleanupAll(): void {
    for (const frameId of this.animationFrames) {
      cancelAnimationFrame(frameId);
    }
    this.animationFrames.clear();

    for (const element of this.hints.keys()) {
      this.removeHint(element);
    }
    this.scheduledCleanups.clear();
  }

  scheduleCleanup(element: HTMLElement, delay: number = 100): void {
    if (this.scheduledCleanups.has(element)) return;

    this.scheduledCleanups.add(element);
    setTimeout(() => {
      this.scheduledCleanups.delete(element);
      if (!this.isAnimating(element)) {
        this.removeHint(element);
      }
    }, delay);
  }

  private isAnimating(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.animationName !== 'none' || style.transitionProperty !== 'all';
  }

  setOptimizationLevel(level: 'none' | 'basic' | 'aggressive'): void {
    this.config.optimizationLevel = level;

    if (level === 'none') {
      this.cleanupAll();
    }
  }

  setHintDuration(duration: number): void {
    this.config.hintDuration = duration;
  }

  setAutoCleanup(enabled: boolean): void {
    this.config.autoCleanup = enabled;
  }

  getStats(): {
    activeHints: number;
    optimizationLevel: string;
    hintDuration: number;
    scheduledCleanups: number;
  } {
    return {
      activeHints: this.hints.size,
      optimizationLevel: this.config.optimizationLevel,
      hintDuration: this.config.hintDuration,
      scheduledCleanups: this.scheduledCleanups.size,
    };
  }
}

export { WillChangeManager as default };
