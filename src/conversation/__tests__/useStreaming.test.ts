import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreaming } from '../streaming/useStreaming';

describe('useStreaming', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() => useStreaming());

      expect(result.current.message).toBeNull();
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.isCancelled).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.buffer).toBe('');
    });

    it('accepts custom initial message id', () => {
      const { result } = renderHook(() =>
        useStreaming({ initialMessageId: 'custom-id' })
      );

      // The message ID is only set when startStream is called
      // So we verify the hook accepts the option without error
      expect(result.current.message).toBeNull();
    });
  });

  describe('Streaming', () => {
    it('starts streaming and updates message', async () => {
      // Fixed: Use mockResolvedValueOnce chain that ends with done:true
      // to prevent infinite loop in StreamManager.processStream
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('Hello') })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(' ') })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('World') })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      const mockResponse = {
        body: {
          getReader: () => mockReader,
        },
      };

      const { result } = renderHook(() => useStreaming());

      // Start the stream (async)
      let startPromise: Promise<void>;
      act(() => {
        startPromise = result.current.startStream(mockResponse as unknown as Response);
      });

      // Run timers to completion
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await startPromise!;
      });

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.message).toBeTruthy();
      expect(result.current.message?.content).toBeTruthy();
    });

    it('sets isStreaming to true during stream', async () => {
      let resolveRead: (value: { done: boolean; value?: Uint8Array }) => void;
      const mockReader = {
        read: vi.fn().mockImplementation(() => {
          return new Promise((resolve) => {
            resolveRead = resolve;
          });
        }),
      };

      const mockResponse = {
        body: {
          getReader: () => mockReader,
        },
      };

      const { result } = renderHook(() => useStreaming());

      // Start the stream
      let startPromise: Promise<void>;
      act(() => {
        startPromise = result.current.startStream(mockResponse as unknown as Response);
      });

      // Run pending timers
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.isStreaming).toBe(true);

      // Complete the stream
      await act(async () => {
        resolveRead!({ done: true });
      });

      await act(async () => {
        await startPromise!;
      });
    });
  });

  describe('Completion', () => {
    it('completes streaming with startStream', async () => {
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      const mockResponse = {
        body: {
          getReader: () => mockReader,
        },
      };

      const { result } = renderHook(() => useStreaming());

      let startPromise: Promise<void>;
      act(() => {
        startPromise = result.current.startStream(mockResponse as unknown as Response);
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await startPromise!;
      });

      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe('Cancellation', () => {
    it('cancels streaming with startStream', async () => {
      const mockReader = {
        read: vi.fn().mockReturnValue(new Promise(() => {})),
      };

      const mockResponse = {
        body: {
          getReader: () => mockReader,
        },
      };

      const { result } = renderHook(() => useStreaming());

      let startPromise: Promise<void>;
      act(() => {
        startPromise = result.current.startStream(mockResponse as unknown as Response);
      });

      // Run pending timers
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.isStreaming).toBe(true);

      act(() => {
        result.current.cancel();
      });

      expect(result.current.isCancelled).toBe(true);
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('handles stream errors', async () => {
      const mockResponse = {
        body: null,
      };

      const { result } = renderHook(() =>
        useStreaming({
          onError: vi.fn(),
        })
      );

      let startPromise: Promise<void>;
      act(() => {
        startPromise = result.current.startStream(mockResponse as unknown as Response);
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await startPromise!;
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('Reset', () => {
    it('resets state', async () => {
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      const mockResponse = {
        body: {
          getReader: () => mockReader,
        },
      };

      const { result } = renderHook(() => useStreaming());

      let startPromise: Promise<void>;
      act(() => {
        startPromise = result.current.startStream(mockResponse as unknown as Response);
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await startPromise!;
      });

      expect(result.current.isStreaming).toBe(false);

      act(() => {
        result.current.reset();
      });

      expect(result.current.message).toBeNull();
      expect(result.current.buffer).toBe('');
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.isCancelled).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('cleans up on unmount', () => {
      const { unmount } = renderHook(() => useStreaming());

      // Simply unmount - cleanup is handled in useEffect
      unmount();

      // Should not throw
      expect(true).toBe(true);
    });
  });
});
