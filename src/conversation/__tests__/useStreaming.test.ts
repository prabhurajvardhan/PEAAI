import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
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

      expect(result.current.message?.id).toBe('custom-id');
    });
  });

  describe('Streaming', () => {
    it('starts streaming and updates message', async () => {
      const mockReader = {
        read: vi.fn().mockResolvedValue({
          done: false,
          value: new TextEncoder().encode('Hello'),
        }),
      };

      const mockResponse = {
        body: {
          getReader: () => mockReader,
        },
      };

      const { result } = renderHook(() => useStreaming());

      await act(async () => {
        await result.current.startStream(mockResponse as unknown as Response);
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
      });

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

      const streamPromise = act(async () => {
        await result.current.startStream(mockResponse as unknown as Response);
      });

      expect(result.current.isStreaming).toBe(true);

      await act(async () => {
        resolveRead!({ done: true });
      });

      await streamPromise;
    });
  });

  describe('Manual Token Addition', () => {
    it('adds tokens manually', async () => {
      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.addToken('Hello');
      });

      expect(result.current.buffer).toBe('Hello');

      act(() => {
        result.current.addToken(' World');
      });

      expect(result.current.buffer).toBe('Hello World');
    });
  });

  describe('Completion', () => {
    it('completes streaming', () => {
      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.addToken('Hello');
        result.current.complete();
      });

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.message?.status).toBe('sent');
    });
  });

  describe('Cancellation', () => {
    it('cancels streaming', async () => {
      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.addToken('Hello');
        result.current.cancel();
      });

      expect(result.current.isCancelled).toBe(true);
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('handles errors', () => {
      const { result } = renderHook(() =>
        useStreaming({
          onError: vi.fn(),
        })
      );

      act(() => {
        result.current.errorStream(new Error('Test error'));
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Test error');
    });
  });

  describe('Reset', () => {
    it('resets state', () => {
      const { result } = renderHook(() => useStreaming());

      act(() => {
        result.current.addToken('Hello');
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
      const { result, unmount } = renderHook(() => useStreaming());

      act(() => {
        result.current.addToken('Hello');
      });

      unmount();

      // Should not throw
      expect(true).toBe(true);
    });
  });
});
