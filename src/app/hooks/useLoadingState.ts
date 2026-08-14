import { useState, useCallback } from 'react';
import type { LoadingState } from '../providers';
import { useAppState } from '../providers';

export function useLoadingState(moduleName: string) {
  const { loadingStates, setModuleLoading } = useAppState();
  const [internalState, setInternalState] = useState<LoadingState>('idle');

  const loadingState = loadingStates.modules[moduleName] ?? internalState;

  const startLoading = useCallback(() => {
    setModuleLoading(moduleName, 'loading');
    setInternalState('loading');
  }, [moduleName, setModuleLoading]);

  const stopLoading = useCallback(
    (success: boolean = true) => {
      const newState: LoadingState = success ? 'success' : 'error';
      setModuleLoading(moduleName, newState);
      setInternalState(newState);
    },
    [moduleName, setModuleLoading]
  );

  const resetLoading = useCallback(() => {
    setModuleLoading(moduleName, 'idle');
    setInternalState('idle');
  }, [moduleName, setModuleLoading]);

  const isLoading = loadingState === 'loading';
  const hasError = loadingState === 'error';
  const isSuccess = loadingState === 'success';

  return {
    loadingState,
    isLoading,
    hasError,
    isSuccess,
    startLoading,
    stopLoading,
    resetLoading,
  };
}

export function useGlobalLoading() {
  const { loadingStates, setGlobalLoading } = useAppState();
  const [internalLoading, setInternalLoading] = useState(false);

  const isLoading = loadingStates.global === 'loading' || internalLoading;

  const startGlobalLoading = useCallback(() => {
    setGlobalLoading('loading');
    setInternalLoading(true);
  }, [setGlobalLoading]);

  const stopGlobalLoading = useCallback(() => {
    setGlobalLoading('success');
    setInternalLoading(false);
  }, [setGlobalLoading]);

  return {
    isLoading,
    startLoading: startGlobalLoading,
    stopLoading: stopGlobalLoading,
  };
}
