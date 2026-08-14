import { StreamingOptions, Message } from '../types';

export interface StreamManagerOptions extends StreamingOptions {
  messageId: string;
}

export interface StreamState {
  messageId: string;
  buffer: string;
  isComplete: boolean;
  isCancelled: boolean;
  error: Error | null;
}

export type StreamEventType = 
  | 'token'
  | 'complete'
  | 'error'
  | 'cancel';

export interface StreamEvent {
  type: StreamEventType;
  messageId: string;
  token?: string;
  error?: Error;
  buffer?: string;
}

type StreamEventHandler = (event: StreamEvent) => void;

export class StreamManager {
  private messageId: string;
  private buffer: string = '';
  private isComplete: boolean = false;
  private isCancelled: boolean = false;
  private error: Error | null = null;
  private handlers: Set<StreamEventHandler> = new Set();
  private abortController: AbortController | null = null;
  private options: StreamManagerOptions;
  private tokenBuffer: string[] = [];
  private flushTimeout: number | null = null;

  constructor(options: StreamManagerOptions) {
    this.messageId = options.messageId;
    this.options = {
      bufferSize: 1, // Default to immediate flush
      ...options,
    };
  }

  getState(): StreamState {
    return {
      messageId: this.messageId,
      buffer: this.buffer,
      isComplete: this.isComplete,
      isCancelled: this.isCancelled,
      error: this.error,
    };
  }

  onToken(handler: (token: string) => void): () => void {
    const eventHandler: StreamEventHandler = (event) => {
      if (event.type === 'token' && event.token) {
        handler(event.token);
      }
    };
    this.handlers.add(eventHandler);
    return () => this.handlers.delete(eventHandler);
  }

  onComplete(handler: () => void): () => void {
    const eventHandler: StreamEventHandler = (event) => {
      if (event.type === 'complete') {
        handler();
      }
    };
    this.handlers.add(eventHandler);
    return () => this.handlers.delete(eventHandler);
  }

  onError(handler: (error: Error) => void): () => void {
    const eventHandler: StreamEventHandler = (event) => {
      if (event.type === 'error' && event.error) {
        handler(event.error);
      }
    };
    this.handlers.add(eventHandler);
    return () => this.handlers.delete(eventHandler);
  }

  private emit(event: StreamEvent): void {
    this.handlers.forEach((handler) => handler(event));
  }

  private flushBuffer(): void {
    const bufferSize = this.options.bufferSize || 1;
    
    while (this.tokenBuffer.length >= bufferSize) {
      const token = this.tokenBuffer.shift();
      if (token) {
        this.buffer += token;
        this.emit({
          type: 'token',
          messageId: this.messageId,
          token,
          buffer: this.buffer,
        });
        this.options.onToken?.(token);
      }
    }

    // Handle remaining tokens
    if (this.isComplete && this.tokenBuffer.length > 0) {
      while (this.tokenBuffer.length > 0) {
        const token = this.tokenBuffer.shift();
        if (token) {
          this.buffer += token;
          this.emit({
            type: 'token',
            messageId: this.messageId,
            token,
            buffer: this.buffer,
          });
          this.options.onToken?.(token);
        }
      }
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimeout !== null) {
      return;
    }
    this.flushTimeout = window.setTimeout(() => {
      this.flushTimeout = null;
      this.flushBuffer();
    }, 0);
  }

  async processStream(response: Response): Promise<void> {
    if (!response.body) {
      this.error = new Error('Response body is null');
      this.emit({
        type: 'error',
        messageId: this.messageId,
        error: this.error,
      });
      this.options.onError?.(this.error);
      return;
    }

    this.abortController = new AbortController();

    try {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        if (this.isCancelled) {
          reader.cancel();
          this.emit({
            type: 'cancel',
            messageId: this.messageId,
          });
          return;
        }

        const { done, value } = await reader.read();

        if (done) {
          this.isComplete = true;
          this.flushBuffer();
          this.emit({
            type: 'complete',
            messageId: this.messageId,
            buffer: this.buffer,
          });
          this.options.onComplete?.();
          return;
        }

        const chunk = decoder.decode(value, { stream: true });
        this.tokenBuffer.push(chunk);
        this.scheduleFlush();
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        this.isCancelled = true;
        this.emit({
          type: 'cancel',
          messageId: this.messageId,
        });
      } else {
        this.error = err instanceof Error ? err : new Error(String(err));
        this.emit({
          type: 'error',
          messageId: this.messageId,
          error: this.error,
        });
        this.options.onError?.(this.error);
      }
    }
  }

  addToken(token: string): void {
    if (this.isComplete || this.isCancelled) {
      return;
    }
    this.tokenBuffer.push(token);
    this.scheduleFlush();
  }

  complete(): void {
    this.isComplete = true;
    this.flushBuffer();
    this.emit({
      type: 'complete',
      messageId: this.messageId,
      buffer: this.buffer,
    });
    this.options.onComplete?.();
  }

  errorStream(err: Error): void {
    this.error = err;
    this.emit({
      type: 'error',
      messageId: this.messageId,
      error: err,
    });
    this.options.onError?.(err);
  }

  cancel(): void {
    this.isCancelled = true;
    this.abortController?.abort();
    this.tokenBuffer = [];
    if (this.flushTimeout !== null) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    this.emit({
      type: 'cancel',
      messageId: this.messageId,
    });
  }

  getBuffer(): string {
    return this.buffer;
  }

  isActive(): boolean {
    return !this.isComplete && !this.isCancelled && !this.error;
  }

  reset(): void {
    this.buffer = '';
    this.isComplete = false;
    this.isCancelled = false;
    this.error = null;
    this.tokenBuffer = [];
    if (this.flushTimeout !== null) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    this.abortController = null;
  }

  destroy(): void {
    this.cancel();
    this.handlers.clear();
  }
}

export default StreamManager;
