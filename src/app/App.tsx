import { useState, useCallback } from 'react';
import { ThemeProvider } from '../foundation/theme';
import { ToastProvider } from '../foundation/components/toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';
import { AppProviders } from './providers';
import { AppShell } from './AppShell';
import type { AppState } from './types';

const initialState: AppState = {
  isLoading: true,
  isInitialized: false,
  currentRoute: '/',
  error: null,
};

export function App() {
  const [appState, setAppState] = useState<AppState>(initialState);

  const handleInitializationComplete = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      isLoading: false,
      isInitialized: true,
    }));
  }, []);

  const handleError = useCallback((error: Error) => {
    setAppState((prev) => ({
      ...prev,
      isLoading: false,
      error: error.message,
    }));
  }, []);

  const handleRetry = useCallback(() => {
    setAppState(initialState);
  }, []);

  // Initialization-failure fallback: a recoverable error UI (never an infinite
  // spinner). Rendered when a bootstrap error was reported via onError.
  if (appState.error) {
    return (
      <div
        role="alert"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <h1>Unable to start PEAAI</h1>
        <p>{appState.error}</p>
        <button onClick={handleRetry}>Try Again</button>
      </div>
    );
  }

  return (
    <ErrorBoundary onError={handleError}>
      <ThemeProvider>
        <ToastProvider>
          <AppProviders onReady={handleInitializationComplete} onError={handleError}>
            {appState.isLoading ? (
              <LoadingScreen message="Initializing PEAAI..." />
            ) : (
              <AppShell />
            )}
          </AppProviders>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
