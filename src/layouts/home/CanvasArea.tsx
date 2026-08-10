import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { CanvasAreaProps } from './types';

interface CanvasAreaState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

interface CanvasAreaContextValue extends CanvasAreaState {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  initialize: () => void;
  destroy: () => void;
}

const CanvasAreaContext = React.createContext<CanvasAreaContextValue | undefined>(undefined);

function useCanvasArea(): CanvasAreaContextValue {
  const context = React.useContext(CanvasAreaContext);
  if (!context) {
    throw new Error('useCanvasArea must be used within a CanvasAreaProvider');
  }
  return context;
}

interface CanvasAreaProviderProps {
  children: React.ReactNode;
}

function CanvasAreaProvider({ children }: CanvasAreaProviderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CanvasAreaState>({
    isInitialized: false,
    isLoading: false,
    error: null,
  });

  const initialize = useCallback(() => {
    if (state.isInitialized || state.isLoading) return;
    
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      if (!canvasRef.current) {
        throw new Error('Canvas element not found');
      }
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D context');
      }
      
      // Set canvas size for 32x32 pixel grid with scaling
      const pixelSize = 10; // Each pixel will be 10x10 actual pixels
      canvasRef.current.width = 32 * pixelSize;
      canvasRef.current.height = 32 * pixelSize;
      
      // Disable image smoothing for crisp pixels
      ctx.imageSmoothingEnabled = false;
      
      // Fill with a neutral background
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      setState((prev) => ({ ...prev, isInitialized: true, isLoading: false }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to initialize canvas',
      }));
    }
  }, [state.isInitialized, state.isLoading]);

  const destroy = useCallback(() => {
    setState({
      isInitialized: false,
      isLoading: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      // Canvas will adapt to container size
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const value: CanvasAreaContextValue = {
    ...state,
    canvasRef,
    containerRef,
    initialize,
    destroy,
  };

  return (
    <CanvasAreaContext.Provider value={value}>
      {children}
    </CanvasAreaContext.Provider>
  );
}

function CanvasContent({ className }: CanvasAreaProps) {
  const { canvasRef, containerRef, isInitialized, isLoading, error, initialize } = useCanvasArea();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!hasInitialized && !isLoading) {
      initialize();
      setHasInitialized(true);
    }
  }, [hasInitialized, isLoading, initialize]);

  return (
    <div ref={containerRef} className={`home-canvas-area ${className || ''}`}>
      {isLoading && (
        <div className="home-canvas-area__loading">
          <div className="home-canvas-area__spinner" />
          <span>Loading...</span>
        </div>
      )}
      {error && (
        <div className="home-canvas-area__error">
          <span>{error}</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="home-canvas-area__canvas"
        style={{ display: isInitialized ? 'block' : 'none' }}
      />
      {!isInitialized && !isLoading && !error && (
        <div className="home-canvas-area__placeholder">
          <span>Canvas Area</span>
        </div>
      )}
    </div>
  );
}

export interface HomeCanvasAreaProps extends CanvasAreaProps {
  children?: React.ReactNode;
}

export function HomeCanvasArea({ className, children }: HomeCanvasAreaProps) {
  return (
    <CanvasAreaProvider>
      <CanvasContent className={className} />
      {children}
    </CanvasAreaProvider>
  );
}

export { HomeCanvasArea as CanvasArea, useCanvasArea };
