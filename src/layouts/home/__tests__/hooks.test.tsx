import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBreakpoint, useIsMobile, useLayout, LayoutProvider } from '../hooks';
import type { ReactNode } from 'react';

describe('useBreakpoint', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.useFakeTimers();
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  it('should return a valid breakpoint', () => {
    const { result } = renderHook(() => useBreakpoint());
    expect(['mobile', 'tablet', 'desktop']).toContain(result.current);
  });

  it('should be a string type', () => {
    const { result } = renderHook(() => useBreakpoint());
    expect(typeof result.current).toBe('string');
  });
});

describe('useIsMobile', () => {
  it('should return a boolean', () => {
    const { result } = renderHook(() => useIsMobile());
    expect(typeof result.current).toBe('boolean');
  });
});

describe('LayoutProvider', () => {
  const wrapper = ({ children }: { children: ReactNode }) => {
    return (
      <LayoutProvider>
        {children}
      </LayoutProvider>
    );
  };

  it('should provide initial layout state', () => {
    const { result } = renderHook(() => useLayout(), { wrapper });

    expect(result.current).toMatchObject({
      sidebarOpen: expect.any(Boolean),
      chatPanelOpen: expect.any(Boolean),
      activeBreakpoint: expect.any(String),
      toggleSidebar: expect.any(Function),
      setSidebarOpen: expect.any(Function),
      toggleChatPanel: expect.any(Function),
      setChatPanelOpen: expect.any(Function),
    });
  });

  it('should toggle sidebar state', () => {
    const { result } = renderHook(() => useLayout(), { wrapper });
    const initialState = result.current.sidebarOpen;

    act(() => {
      result.current.toggleSidebar();
    });

    expect(result.current.sidebarOpen).toBe(!initialState);
  });

  it('should set sidebar open state', () => {
    const { result } = renderHook(() => useLayout(), { wrapper });

    act(() => {
      result.current.setSidebarOpen(false);
    });

    expect(result.current.sidebarOpen).toBe(false);

    act(() => {
      result.current.setSidebarOpen(true);
    });

    expect(result.current.sidebarOpen).toBe(true);
  });

  it('should toggle chat panel state', () => {
    const { result } = renderHook(() => useLayout(), { wrapper });
    const initialState = result.current.chatPanelOpen;

    act(() => {
      result.current.toggleChatPanel();
    });

    expect(result.current.chatPanelOpen).toBe(!initialState);
  });

  it('should set chat panel open state', () => {
    const { result } = renderHook(() => useLayout(), { wrapper });

    act(() => {
      result.current.setChatPanelOpen(false);
    });

    expect(result.current.chatPanelOpen).toBe(false);

    act(() => {
      result.current.setChatPanelOpen(true);
    });

    expect(result.current.chatPanelOpen).toBe(true);
  });

  it('should throw error when useLayout is used outside LayoutProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useLayout());
    }).toThrow('useLayout must be used within a LayoutProvider');

    vi.restoreAllMocks();
  });
});
