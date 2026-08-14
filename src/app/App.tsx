import React, { useState, useCallback } from 'react';
import { ThemeProvider } from '../foundation/theme';
import { ToastProvider } from '../foundation/components/toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';
import { AppProviders } from './providers';
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
      error: error.message,
    }));
  }, []);

  if (appState.isLoading) {
    return <LoadingScreen message="Initializing PEAAI..." />;
  }

  return (
    <ErrorBoundary onError={handleError}>
      <ThemeProvider>
        <ToastProvider>
          <AppProviders onReady={handleInitializationComplete}>
            <div
              style={{
                minHeight: '100vh',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-primary)',
              }}
            >
              {/* Main application content will be rendered here */}
              {/* Routes and pages will be integrated by UI-004 */}
              <main style={{ padding: '2rem' }}>
                <h1>PEAAI - AI Companion</h1>
                <p>Welcome to the AI Companion experience.</p>
              </main>
            </div>
          </AppProviders>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
