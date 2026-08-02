/**
 * Intersection Observer utility for lazy loading
 */

export interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

export interface IntersectionObserverEntry {
  target: Element;
  isIntersecting: boolean;
  intersectionRatio: number;
  boundingClientRect: DOMRect;
}

type IntersectionCallback = (entries: IntersectionObserverEntry[]) => void;

class IntersectionObserverManager {
  private observer: IntersectionObserver | null = null;
  private callbacks: Map<Element, IntersectionCallback> = new Map();
  private options: IntersectionObserverOptions;

  constructor(options: IntersectionObserverOptions = {}) {
    this.options = {
      root: null,
      rootMargin: '50px',
      threshold: 0,
      ...options,
    };
  }

  private createObserver(): IntersectionObserver | null {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported');
      return null;
    }

    return new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
          const callback = this.callbacks.get(entry.target);
          if (callback) {
            callback([entry]);
          }
        });
      },
      {
        root: this.options.root,
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold,
      }
    );
  }

  observe(element: Element, callback: IntersectionCallback): () => void {
    if (!this.observer) {
      this.observer = this.createObserver();
    }

    if (this.observer) {
      this.callbacks.set(element, callback);
      this.observer.observe(element);
    }

    return () => {
      this.unobserve(element);
    };
  }

  unobserve(element: Element): void {
    if (this.observer) {
      this.observer.unobserve(element);
      this.callbacks.delete(element);
    }
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      this.callbacks.clear();
    }
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'IntersectionObserver' in window;
  }
}

export const intersectionObserver = new IntersectionObserverManager();

export function observe(
  element: Element,
  callback: IntersectionCallback,
  options?: IntersectionObserverOptions
): () => void {
  const manager = new IntersectionObserverManager(options);
  return manager.observe(element, callback);
}

export function isIntersectionObserverSupported(): boolean {
  return typeof window !== 'undefined' && 'IntersectionObserver' in window;
}

export { IntersectionObserverManager as default };
