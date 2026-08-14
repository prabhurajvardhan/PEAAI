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
}

export function AppProviders({ children, onReady }: AppProvidersProps) {
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize modules
        await Promise.all([
          // Initialize M01 Product Foundation
          import('../foundation').catch(() => null),
          // Initialize other modules as they become available
        ]);
        
        setState((prev) => ({
          ...prev,
          isInitialized: true,
        }));
        
        onReady?.();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Initialization failed',
        }));
      }
    };

    initialize();
  }, [onReady]);

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
