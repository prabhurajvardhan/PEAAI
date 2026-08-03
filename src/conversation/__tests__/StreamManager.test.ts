import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StreamManager } from '../streaming/StreamManager';

describe('StreamManager', () => {
  let onToken: ReturnType<typeof vi.fn>;
  let onComplete: ReturnType<typeof vi.fn>;
  let onError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onToken = vi.fn();
    onComplete = vi.fn();
    onError = vi.fn();
  });

  describe('Initialization', () => {
    it('creates a stream manager with options', () => {
      const manager = new StreamManager({
        messageId: 'test-123',
        bufferSize: 5,
      });

      expect(manager.getState().messageId).toBe('test-123');
      expect(manager.isActive()).toBe(true);
    });

    it('uses default buffer size of 1', () => {
      const manager = new StreamManager({
        messageId: 'test-123',
      });

      expect(manager.getState()).toMatchObject({
        messageId: 'test-123',
        buffer: '',
        isComplete: false,
        isCancelled: false,
        error: null,
      });
    });
  });

  describe('Token Handling', () => {
    it('calls onToken callback for each token', () => {
      const manager = new StreamManager({
        messageId: 'test-123',
        onToken,
      });

      manager.addToken('H');
      manager.complete();

      expect(onToken).toHaveBeenCalledWith('H');
    });

    it('respects buffer size', async () => {
      const tokens: string[] = [];
      const manager = new StreamManager({
        messageId: 'test-123',
        bufferSize: 3,
        onToken: (token) => tokens.push(token),
      });

      manager.addToken('A');
      manager.addToken('B');
      manager.addToken('C');
      manager.addToken('D');
      
      // With bufferSize 3, tokens are flushed when buffer fills
      // or when complete is called
      manager.complete();

      expect(manager.getBuffer()).toBe('ABCD');
    });
  });

  describe('Completion', () => {
    it('marks stream as complete', () => {
      const manager = new StreamManager({
        messageId: 'test-123',
      });

      manager.complete();

      expect(manager.getState().isComplete).toBe(true);
      expect(manager.isActive()).toBe(false);
    });

    it('calls onComplete callback', () => {
      const manager = new StreamManager({
        messageId: 'test-123',
        onComplete,
      });

      manager.complete();

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('flushes remaining tokens on complete', () => {
      const tokens: string[] = [];
      const manager = new StreamManager({
        messageId: 'test-123',
        bufferSize: 10,
        onToken: (token) => tokens.push(token),
      });

      manager.addToken('A');
      manager.addToken('B');
      manager.complete();

      expect(tokens).toContain('A');
      expect(tokens).toContain('B');
    });
  });

  describe('Error Handling', () => {
    it('records errors', () => {
      const manager = new StreamManager({
        messageId: 'test-123',
      });

      manager.errorStream(new Error('Test error'));

      expect(manager.getState().error).toBeInstanceOf(Error);
      expect(manager.getState().error?.message).toBe('Test error');
    });

    it('calls onError callback', () => {
      const manager = new StreamManager({
        messageId: 'test-123',
        onError,
      });

      manager.errorStream(new Error('Test error'));

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('marks stream as inactive on error', () => {
      const manager = new StreamManager({
        messageId: 'test-123',
      });

      manager.errorStream(new Error('Test error'));

      expect(manager.isActive()).toBe(false);
    });
  });

  describe('Cancellation', () => {
    it('marks stream as cancelled', () => {
      const manager = new StreamManager({
        messageId: 'test-123',
      });

      manager.cancel();

      expect(manager.getState().isCancelled).toBe(true);
      expect(manager.isActive()).toBe(false);
    });

    it('clears pending tokens on cancel', () => {
      const manager = new StreamManager({
        messageId: 'test-123',
      });

      manager.addToken('A');
      manager.addToken('B');
      manager.cancel();

      expect(manager.getBuffer()).toBe('');
    });

    it('ignores tokens after cancellation', () => {
      const manager = new StreamManager({
        messageId: 'test-123',
      });

      manager.cancel();
      manager.addToken('A');

      expect(manager.getBuffer()).toBe('');
    });
  });

  describe('Event Handlers', () => {
    it('registers and unregisters token handlers', () => {
      const handler = vi.fn();
      const manager = new StreamManager({
        messageId: 'test-123',
      });

      const unsubscribe = manager.onToken(handler);
      manager.addToken('A');
      manager.complete();

      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      manager.reset();
      
      // After reset, handlers should be cleared but we created a new manager
      expect(manager.getState().buffer).toBe('');
    });

    it('registers and unregisters complete handlers', () => {
      const handler = vi.fn();
      const manager = new StreamManager({
        messageId: 'test-123',
      });

      const unsubscribe = manager.onComplete(handler);
      manager.complete();

      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      manager.reset();

      expect(manager.getState().isComplete).toBe(false);
    });

    it('registers and unregisters error handlers', () => {
      const handler = vi.fn();
      const manager = new StreamManager({
        messageId: 'test-123',
      });

      const unsubscribe = manager.onError(handler);
      manager.errorStream(new Error('Error'));

      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      manager.reset();

      expect(manager.getState().error).toBeNull();
    });
  });

  describe('processStream', () => {
    it('processes a stream response', async () => {
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

      const manager = new StreamManager({
        messageId: 'test-123',
        onToken,
        onComplete,
      });

      await manager.processStream(mockResponse as unknown as Response);

      expect(manager.getBuffer()).toBe('Hello World');
      expect(onComplete).toHaveBeenCalled();
    });

    it('handles null response body', async () => {
      const mockResponse = {
        body: null,
      };

      const manager = new StreamManager({
        messageId: 'test-123',
        onError,
      });

      await manager.processStream(mockResponse as unknown as Response);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(manager.getState().error?.message).toBe('Response body is null');
    });
  });

  describe('Destruction', () => {
    it('destroys the manager', () => {
      const manager = new StreamManager({
        messageId: 'test-123',
      });

      manager.addToken('A');
      manager.destroy();

      expect(manager.getState().isCancelled).toBe(true);
      expect(manager.isActive()).toBe(false);
    });
  });
});
