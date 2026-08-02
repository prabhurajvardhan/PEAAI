/**
 * Image lazy loading with intersection observer
 */

import { intersectionObserver, IntersectionObserverEntry } from './intersection-observer';
import { placeholderManager, PlaceholderConfig } from './placeholder';

export interface LazyImageConfig {
  src: string;
  srcset?: string;
  sizes?: string;
  alt: string;
  threshold?: number;
  rootMargin?: string;
  placeholder?: PlaceholderConfig | boolean;
  loadingClass?: string;
  loadedClass?: string;
  errorClass?: string;
}

export interface LazyImageInstance {
  element: HTMLImageElement;
  config: LazyImageConfig;
  load: () => Promise<void>;
  destroy: () => void;
}

const defaultConfig: Partial<LazyImageConfig> = {
  threshold: 0,
  rootMargin: '50px',
  loadingClass: 'lazy-loading',
  loadedClass: 'lazy-loaded',
  errorClass: 'lazy-error',
};

class ImageLazyLoader {
  private images: Map<HTMLImageElement, LazyImageInstance> = new Map();
  private observer: typeof intersectionObserver | null = null;

  constructor() {
    if (intersectionObserver.isSupported()) {
      this.observer = intersectionObserver;
    }
  }

  create(element: HTMLImageElement, config: LazyImageConfig): LazyImageInstance {
    const mergedConfig = { ...defaultConfig, ...config };
    const instance: LazyImageInstance = {
      element,
      config: mergedConfig,
      load: this.loadImage.bind(this, element, mergedConfig),
      destroy: this.destroyInstance.bind(this, element),
    };

    element.dataset.lazySrc = config.src;
    element.classList.add(mergedConfig.loadingClass || '');

    if (mergedConfig.placeholder !== false) {
      const placeholderConfig = mergedConfig.placeholder === true
        ? {}
        : mergedConfig.placeholder as PlaceholderConfig;
      placeholderManager.show(element, placeholderConfig);
    }

    if (this.observer) {
      this.observer.observe(element, (entries: IntersectionObserverEntry[]) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          instance.load();
        }
      });
    } else {
      this.loadOnVisible(element, mergedConfig);
    }

    this.images.set(element, instance);
    return instance;
  }

  private async loadImage(element: HTMLImageElement, config: LazyImageConfig): Promise<void> {
    if (element.dataset.loaded === 'true') return;

    element.dataset.loaded = 'true';

    if (this.observer) {
      this.observer.unobserve(element);
    }

    if (config.placeholder !== false) {
      placeholderManager.hide(element);
    }

    try {
      await this.loadImageSrc(element, config);
      if (config.loadingClass) {
        element.classList.remove(config.loadingClass);
      }
      if (config.loadedClass) {
        element.classList.add(config.loadedClass);
      }
      element.dispatchEvent(new CustomEvent('lazyloaded', { bubbles: true }));
    } catch (error) {
      if (config.loadingClass) {
        element.classList.remove(config.loadingClass);
      }
      if (config.errorClass) {
        element.classList.add(config.errorClass);
      }
      element.dispatchEvent(new CustomEvent('lazyerror', { bubbles: true, detail: error }));
    }
  }

  private loadImageSrc(element: HTMLImageElement, config: LazyImageConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        element.src = config.src;
        if (config.srcset) {
          element.srcset = config.srcset;
        }
        if (config.sizes) {
          element.sizes = config.sizes;
        }
        resolve();
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${config.src}`));
      };

      img.src = config.src;
    });
  }

  private loadOnVisible(element: HTMLImageElement, config: LazyImageConfig): void {
    const checkVisible = () => {
      const rect = element.getBoundingClientRect();
      const isVisible = (
        rect.top < window.innerHeight + (parseInt(config.rootMargin || '50px') || 50) &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth + (parseInt(config.rootMargin || '50px') || 50) &&
        rect.right > 0
      );

      if (isVisible) {
        this.loadImage(element, config);
        window.removeEventListener('scroll', checkVisible);
        window.removeEventListener('resize', checkVisible);
      }
    };

    window.addEventListener('scroll', checkVisible, { passive: true });
    window.addEventListener('resize', checkVisible, { passive: true });
    checkVisible();
  }

  private destroyInstance(element: HTMLImageElement): void {
    const instance = this.images.get(element);
    if (!instance) return;

    if (this.observer) {
      this.observer.unobserve(element);
    }

    if (instance.config.placeholder !== false) {
      placeholderManager.hide(element, false);
    }

    element.classList.remove(
      instance.config.loadingClass || '',
      instance.config.loadedClass || '',
      instance.config.errorClass || ''
    );

    delete element.dataset.lazySrc;
    delete element.dataset.loaded;

    this.images.delete(element);
  }

  getInstance(element: HTMLImageElement): LazyImageInstance | undefined {
    return this.images.get(element);
  }

  preload(config: LazyImageConfig): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to preload image: ${config.src}`));
      img.src = config.src;
    });
  }

  destroy(): void {
    this.images.forEach((instance) => {
      instance.destroy();
    });
    this.images.clear();
  }
}

export const imageLazyLoader = new ImageLazyLoader();

export function createLazyImage(
  container: HTMLElement,
  config: LazyImageConfig
): LazyImageInstance {
  const element = document.createElement('img');
  element.alt = config.alt;
  element.dataset.lazy = 'true';
  container.appendChild(element);
  return imageLazyLoader.create(element, config);
}

export { ImageLazyLoader as default };
