import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { Breakpoint, BreakpointConfig, LayoutContextValue, LayoutState } from './types';

const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};

function getBreakpoint(width: number, breakpoints: BreakpointConfig = DEFAULT_BREAKPOINTS): Breakpoint {
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'mobile';
}

export function useBreakpoint(breakpoints: BreakpointConfig = DEFAULT_BREAKPOINTS): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return getBreakpoint(window.innerWidth, breakpoints);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setBreakpoint(getBreakpoint(window.innerWidth, breakpoints));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoints]);

  return breakpoint;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${DEFAULT_BREAKPOINTS.tablet - 1}px)`);
}

export function useIsTablet(): boolean {
  return useMediaQuery(`(min-width: ${DEFAULT_BREAKPOINTS.tablet}px) and (max-width: ${DEFAULT_BREAKPOINTS.desktop - 1}px)`);
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${DEFAULT_BREAKPOINTS.desktop}px)`);
}

const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

const initialState: LayoutState = {
  sidebarOpen: true,
  chatPanelOpen: true,
  activeBreakpoint: 'desktop',
};

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LayoutState>(initialState);
  const breakpoint = useBreakpoint();

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      activeBreakpoint: breakpoint,
      sidebarOpen: breakpoint !== 'mobile',
      chatPanelOpen: breakpoint !== 'mobile',
    }));
  }, [breakpoint]);

  const toggleSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, sidebarOpen: open }));
  }, []);

  const toggleChatPanel = useCallback(() => {
    setState((prev) => ({ ...prev, chatPanelOpen: !prev.chatPanelOpen }));
  }, []);

  const setChatPanelOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, chatPanelOpen: open }));
  }, []);

  const value: LayoutContextValue = {
    ...state,
    toggleSidebar,
    setSidebarOpen,
    toggleChatPanel,
    setChatPanelOpen,
  };

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout(): LayoutContextValue {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
