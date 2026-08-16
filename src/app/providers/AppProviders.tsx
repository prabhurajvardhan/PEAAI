import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { AppState, AppContextValue } from '../types';

const initialState: AppState = {
  isLoading: false,
  isInitialized: false,
  currentRoute: '/',
  error: null,
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

interface AppProvidersProps {
  children: React.ReactNode;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

export function AppProviders({ children, onReady, onError }: AppProvidersProps) {
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize modules. The M01 foundation root barrel is loaded as a
        // bootstrap signal; a failure here is a genuine init failure and is
        // surfaced via onError (not swallowed), so the UI can never get stuck
        // on an infinite loading screen. NOTE: this file lives in
        // src/app/providers/, so the foundation barrel (src/foundation) is two
        // levels up — `../../foundation`.
        await import('../../foundation');

        setState((prev) => ({
          ...prev,
          isInitialized: true,
        }));

        onReady?.();
      } catch (error) {
        const initError =
          error instanceof Error ? error : new Error('Initialization failed');
        setState((prev) => ({
          ...prev,
          error: initError.message,
        }));
        onError?.(initError);
      }
    };

    initialize();
  }, [onReady, onError]);

  const setCurrentRoute = useCallback((route: string) => {
    setState((prev) => ({
      ...prev,
      currentRoute: route,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      error,
    }));
  }, []);

  const resetApp = useCallback(() => {
    setState(initialState);
  }, []);

  const value: AppContextValue = {
    ...state,
    setCurrentRoute,
    setError,
    resetApp,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProviders');
  }
  return context;
}
