export interface AppState {
  isLoading: boolean;
  isInitialized: boolean;
  currentRoute: string;
  error: string | null;
}

export interface AppContextValue extends AppState {
  setCurrentRoute: (route: string) => void;
  setError: (error: string | null) => void;
  resetApp: () => void;
}

export type RouteParams = Record<string, string>;

export interface Route {
  path: string;
  component: React.ComponentType;
  guards?: Array<() => boolean | Promise<boolean>>;
}

export interface NavigationOptions {
  replace?: boolean;
  state?: Record<string, unknown>;
}
