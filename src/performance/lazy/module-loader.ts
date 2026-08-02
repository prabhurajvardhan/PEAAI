/**
 * Module lazy loading with dynamic imports
 */

export interface ModuleLoaderConfig {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

export interface LazyModule<T = unknown> {
  module: T | null;
  loading: boolean;
  error: Error | null;
  promise: Promise<T> | null;
  load: () => Promise<T>;
  reload: () => Promise<T>;
  reset: () => void;
}

const defaultConfig: Required<ModuleLoaderConfig> = {
  timeout: 30000,
  retryCount: 3,
  retryDelay: 1000,
};

class ModuleLoader {
  private modules: Map<string, LazyModule> = new Map();
  private config: ModuleLoaderConfig;

  constructor(config: ModuleLoaderConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  register<T>(name: string, importFn: () => Promise<T>): LazyModule<T> {
    const lazyModule: LazyModule<T> = {
      module: null,
      loading: false,
      error: null,
      promise: null,
      load: () => this.loadModule<T>(name, importFn),
      reload: () => this.reloadModule<T>(name, importFn),
      reset: () => this.resetModule(name),
    };

    this.modules.set(name, lazyModule);
    return lazyModule;
  }

  private async loadModule<T>(name: string, importFn: () => Promise<T>): Promise<T> {
    const lazyModule = this.modules.get(name) as LazyModule<T>;

    if (lazyModule.module) {
      return lazyModule.module;
    }

    if (lazyModule.loading && lazyModule.promise) {
      return lazyModule.promise;
    }

    lazyModule.loading = true;
    lazyModule.error = null;

    const timeout = this.config.timeout ?? 30000;
    const retryCount = this.config.retryCount ?? 3;
    const retryDelay = this.config.retryDelay ?? 1000;

    lazyModule.promise = this.executeWithTimeout<T>(
      importFn(),
      timeout
    ).catch(async (error) => {
      let lastError = error;
      for (let i = 0; i < retryCount; i++) {
        try {
          await this.delay(retryDelay * (i + 1));
          const result = await this.executeWithTimeout<T>(
            importFn(),
            timeout
          );
          lazyModule.module = result;
          lazyModule.loading = false;
          lazyModule.promise = null;
          return result;
        } catch (e) {
          lastError = e as Error;
        }
      }
      lazyModule.error = lastError;
      lazyModule.loading = false;
      throw lastError;
    });

    try {
      const module = await lazyModule.promise;
      lazyModule.module = module;
      lazyModule.loading = false;
      lazyModule.promise = null;
      return module;
    } catch (error) {
      lazyModule.error = error as Error;
      throw error;
    }
  }

  private async reloadModule<T>(name: string, importFn: () => Promise<T>): Promise<T> {
    const lazyModule = this.modules.get(name) as LazyModule<T>;
    lazyModule.reset();
    return this.loadModule<T>(name, importFn);
  }

  private resetModule(name: string): void {
    const lazyModule = this.modules.get(name);
    if (lazyModule) {
      lazyModule.module = null;
      lazyModule.loading = false;
      lazyModule.error = null;
      lazyModule.promise = null;
    }
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Module load timeout: ${timeout}ms`)), timeout)
      ),
    ]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  get<T>(name: string): LazyModule<T> | undefined {
    return this.modules.get(name) as LazyModule<T> | undefined;
  }

  has(name: string): boolean {
    return this.modules.has(name);
  }

  isLoaded(name: string): boolean {
    const module = this.modules.get(name);
    return module ? module.module !== null : false;
  }

  isLoading(name: string): boolean {
    const module = this.modules.get(name);
    return module ? module.loading : false;
  }

  getError(name: string): Error | null {
    const module = this.modules.get(name);
    return module ? module.error : null;
  }

  preload(name: string): Promise<unknown> | null {
    const module = this.modules.get(name);
    if (!module || module.loading || module.module) {
      return null;
    }
    return module.load();
  }

  clear(): void {
    this.modules.clear();
  }
}

export const moduleLoader = new ModuleLoader();

export function lazy<T>(
  moduleName: string,
  importFn: () => Promise<T>,
  config?: ModuleLoaderConfig
): () => Promise<T> {
  const loader = new ModuleLoader(config);

  return function lazyLoad(): Promise<T> {
    let lazyModule = loader.get<T>(moduleName);
    if (!lazyModule) {
      lazyModule = loader.register<T>(moduleName, importFn);
    }

    return lazyModule.load();
  };
}

export { ModuleLoader as default };
