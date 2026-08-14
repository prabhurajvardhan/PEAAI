import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface LoadingStates {
  global: LoadingState;
  modules: Record<string, LoadingState>;
}

type LoadingAction =
  | { type: 'SET_GLOBAL_LOADING'; payload: LoadingState }
  | { type: 'SET_MODULE_LOADING'; payload: { module: string; state: LoadingState } }
  | { type: 'RESET_ALL' };

const initialLoadingStates: LoadingStates = {
  global: 'idle',
  modules: {},
};

function loadingReducer(state: LoadingStates, action: LoadingAction): LoadingStates {
  switch (action.type) {
    case 'SET_GLOBAL_LOADING':
      return { ...state, global: action.payload };
    case 'SET_MODULE_LOADING':
      return {
        ...state,
        modules: {
          ...state.modules,
          [action.payload.module]: action.payload.state,
        },
      };
    case 'RESET_ALL':
      return initialLoadingStates;
    default:
      return state;
  }
}

interface AppState {
  isReady: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}

type AppAction =
  | { type: 'SET_READY'; payload: boolean }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_USER_ID'; payload: string | null }
  | { type: 'RESET' };

const initialAppState: AppState = {
  isReady: false,
  isAuthenticated: false,
  userId: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_READY':
      return { ...state, isReady: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'SET_USER_ID':
      return { ...state, userId: action.payload };
    case 'RESET':
      return initialAppState;
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  loadingStates: LoadingStates;
  setReady: (ready: boolean) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setUserId: (userId: string | null) => void;
  setModuleLoading: (module: string, loadingState: LoadingState) => void;
  setGlobalLoading: (loadingState: LoadingState) => void;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

interface AppStateProviderProps {
  children: React.ReactNode;
}

export function AppStateProvider({ children }: AppStateProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const [loadingStates, loadingDispatch] = useReducer(loadingReducer, initialLoadingStates);

  const setReady = useCallback((ready: boolean) => {
    dispatch({ type: 'SET_READY', payload: ready });
  }, []);

  const setAuthenticated = useCallback((authenticated: boolean) => {
    dispatch({ type: 'SET_AUTHENTICATED', payload: authenticated });
  }, []);

  const setUserId = useCallback((userId: string | null) => {
    dispatch({ type: 'SET_USER_ID', payload: userId });
  }, []);

  const setModuleLoading = useCallback((module: string, loadingState: LoadingState) => {
    loadingDispatch({ type: 'SET_MODULE_LOADING', payload: { module, state: loadingState } });
  }, []);

  const setGlobalLoading = useCallback((loadingState: LoadingState) => {
    loadingDispatch({ type: 'SET_GLOBAL_LOADING', payload: loadingState });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    loadingDispatch({ type: 'RESET_ALL' });
  }, []);

  const value = useMemo(
    () => ({
      state,
      loadingStates,
      setReady,
      setAuthenticated,
      setUserId,
      setModuleLoading,
      setGlobalLoading,
      reset,
    }),
    [state, loadingStates, setReady, setAuthenticated, setUserId, setModuleLoading, setGlobalLoading, reset]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
