/**
 * Performance Engine - Lazy Loading Module
 * 
 * Provides lazy loading capabilities for modules, images, and resources
 * to optimize initial page load and reduce memory usage.
 */

export {
  default as IntersectionObserverManager,
  intersectionObserver,
  observe,
  isIntersectionObserverSupported,
  type IntersectionObserverOptions,
  type IntersectionObserverEntry,
} from './intersection-observer';

export {
  default as PlaceholderManager,
  placeholderManager,
  createPlaceholderStyle,
  createPlaceholderElement,
  addPlaceholderStyles,
  type PlaceholderConfig,
  type PlaceholderStyle,
} from './placeholder';

export {
  default as ImageLazyLoader,
  imageLazyLoader,
  createLazyImage,
  type LazyImageConfig,
  type LazyImageInstance,
} from './image-lazy-loader';

export {
  default as ModuleLoader,
  moduleLoader,
  lazy,
  type ModuleLoaderConfig,
  type LazyModule,
} from './module-loader';

export const LAZY_VERSION = '1.0.0';
export const PERFORMANCE_TARGET_FPS = 60;
