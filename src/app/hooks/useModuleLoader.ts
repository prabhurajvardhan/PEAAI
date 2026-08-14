import { useState, useEffect, useCallback } from 'react';

interface ModuleStatus {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
}

type ModuleLoader<T> = () => Promise<{ default: T }>;

export function useModuleLoader<T>(
  loader: ModuleLoader<T> | null,
  deps: unknown[] = []
): {
  module: T | null;
  status: ModuleStatus;
  reload: () => void;
} {
  const [module, setModule] = useState<T | null>(null);
  const [status, setStatus] = useState<ModuleStatus>({
    isLoading: false,
    isLoaded: false,
    error: null,
  });

  const loadModule = useCallback(async () => {
    if (!loader) return;

    setStatus((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const loaded = await loader();
      setModule(loaded.default);
      setStatus({ isLoading: false, isLoaded: true, error: null });
    } catch (error) {
      setStatus({
        isLoading: false,
        isLoaded: false,
        error: error instanceof Error ? error : new Error('Failed to load module'),
      });
    }
  }, [loader]);

  useEffect(() => {
    loadModule();
  }, [loadModule, ...deps]);

  const reload = useCallback(() => {
    setStatus({ isLoading: false, isLoaded: false, error: null });
    loadModule();
  }, [loadModule]);

  return { module, status, reload };
}

export function useLazyModule<T>(
  loader: ModuleLoader<T>
): {
  Module: React.ComponentType | null;
  isLoading: boolean;
  error: Error | null;
  load: () => void;
} {
  const [Module, setModule] = useState<React.ComponentType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loaded = await loader();
      setModule(() => loaded.default);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load module'));
    } finally {
      setIsLoading(false);
    }
  }, [loader]);

  return { Module, isLoading, error, load };
}
