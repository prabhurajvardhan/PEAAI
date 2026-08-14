/**
 * Module Integration Layer
 * 
 * This module provides integration between M01 (Product Foundation) and M07 (Conversation Engine).
 * It also provides integration points for other modules (M02-M06, M08-M11) as they become available.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

// Module interfaces
export interface IModuleIntegration {
  initialize: () => Promise<void>;
  isReady: () => boolean;
  getModule: <T>(moduleId: string) => T | null;
}

export interface ModuleRegistry {
  [moduleId: string]: {
    isLoaded: boolean;
    isInitializing: boolean;
    error: Error | null;
    instance: unknown;
  };
}

const ModuleContext = createContext<{
  registry: ModuleRegistry;
  registerModule: (moduleId: string, instance: unknown) => void;
  unregisterModule: (moduleId: string) => void;
  isModuleReady: (moduleId: string) => boolean;
} | null>(null);

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const [registry, setRegistry] = useState<ModuleRegistry>({});

  const registerModule = useCallback((moduleId: string, instance: unknown) => {
    setRegistry((prev) => ({
      ...prev,
      [moduleId]: {
        isLoaded: true,
        isInitializing: false,
        error: null,
        instance,
      },
    }));
  }, []);

  const unregisterModule = useCallback((moduleId: string) => {
    setRegistry((prev) => {
      const newRegistry = { ...prev };
      delete newRegistry[moduleId];
      return newRegistry;
    });
  }, []);

  const isModuleReady = useCallback(
    (moduleId: string) => {
      return registry[moduleId]?.isLoaded ?? false;
    },
    [registry]
  );

  return (
    <ModuleContext.Provider
      value={{
        registry,
        registerModule,
        unregisterModule,
        isModuleReady,
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule<T>(moduleId: string): T | null {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModule must be used within ModuleProvider');
  }
  return (context.registry[moduleId]?.instance as T) ?? null;
}

// M01 Integration
export interface M01Integration {
  designSystem: {
    colors: unknown;
    typography: unknown;
    spacing: unknown;
    shadows: unknown;
    borders: unknown;
  };
  theme: {
    currentTheme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    toggleTheme: () => void;
  };
  components: {
    Button: unknown;
    Input: unknown;
    Card: unknown;
    Modal: unknown;
    Toast: unknown;
    Spinner: unknown;
  };
}

// M07 Integration
export interface M07Integration {
  chat: {
    sendMessage: (message: string) => Promise<void>;
    subscribeToMessages: (callback: (message: unknown) => void) => () => void;
  };
  streaming: {
    isStreaming: boolean;
    cancel: () => void;
  };
  typing: {
    isTyping: boolean;
    showIndicator: (show: boolean) => void;
  };
  markdown: {
    parse: (text: string) => string;
  };
  notifications: {
    show: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  };
}

// Event bus for module communication
export type EventHandler<T = unknown> = (data: T) => void;

class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  emit<T = unknown>(event: string, data?: T): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler);

    return () => {
      this.handlers.get(event)?.delete(handler as EventHandler);
    };
  }

  once<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    const unsubscribe = this.on<T>(event, (data) => {
      unsubscribe();
      handler(data);
    });
    return unsubscribe;
  }

  off(event: string, handler?: EventHandler): void {
    if (handler) {
      this.handlers.get(event)?.delete(handler);
    } else {
      this.handlers.delete(event);
    }
  }

  offAll(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();

// Module initialization hooks
export function useModuleInitialization(moduleId: string, initialize: () => Promise<unknown>) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const init = async () => {
      try {
        await initialize();
        setIsReady(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Module initialization failed'));
      }
    };

    init();
  }, [moduleId, initialize]);

  return { isReady, error };
}

// Lazy module loading
export function useLazyModuleLoader<T>(
  loader: () => Promise<{ default: React.ComponentType<T> }>,
  deps: unknown[] = []
) {
  const [Module, setModule] = useState<React.ComponentType<T> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const imported = await loader();
        if (!cancelled) {
          setModule(() => imported.default);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load module'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { Module, isLoading, error };
}
