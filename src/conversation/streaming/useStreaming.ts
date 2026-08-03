import { useState, useCallback, useRef, useEffect } from 'react';
import { StreamManager } from './StreamManager';
import { Message, StreamingOptions } from '../types';

export interface UseStreamingOptions extends StreamingOptions {
  initialMessageId?: string;
}

export interface UseStreamingReturn {
  message: Message | null;
  isStreaming: boolean;
  isCancelled: boolean;
  error: Error | null;
  buffer: string;
  startStream: (response: Response) => Promise<void>;
  addToken: (token: string) => void;
  complete: () => void;
  cancel: () => void;
  reset: () => void;
}

const generateId = (): string => {
  return `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useStreaming = (options?: UseStreamingOptions): UseStreamingReturn => {
  const [message, setMessage] = useState<Message | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [buffer, setBuffer] = useState('');

  const streamManagerRef = useRef<StreamManager | null>(null);
  const messageIdRef = useRef(options?.initialMessageId || generateId());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamManagerRef.current?.destroy();
    };
  }, []);

  const startStream = useCallback(async (response: Response) => {
    const messageId = messageIdRef.current;

    setMessage({
      id: messageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      status: 'sending',
      isStreaming: true,
    });

    setIsStreaming(true);
    setIsCancelled(false);
    setError(null);
    setBuffer('');

    const streamManager = new StreamManager({
      messageId,
      bufferSize: options?.bufferSize,
      onToken: options?.onToken,
      onComplete: options?.onComplete,
      onError: options?.onError,
    });

    streamManagerRef.current = streamManager;

    // Set up handlers
    streamManager.onToken((token) => {
      setBuffer((prev) => {
        const newBuffer = prev + token;
        setMessage((msg) =>
          msg ? { ...msg, content: newBuffer } : null
        );
        return newBuffer;
      });
    });

    streamManager.onComplete(() => {
      setIsStreaming(false);
      setMessage((msg) =>
        msg ? { ...msg, status: 'sent', isStreaming: false } : null
      );
    });

    streamManager.onError((err) => {
      setError(err);
      setIsStreaming(false);
      setMessage((msg) =>
        msg ? { ...msg, status: 'error', isStreaming: false } : null
      );
    });

    // Process the stream
    try {
      await streamManager.processStream(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsStreaming(false);
      setMessage((msg) =>
        msg ? { ...msg, status: 'error', isStreaming: false } : null
      );
    }
  }, [options]);

  const addToken = useCallback((token: string) => {
    streamManagerRef.current?.addToken(token);
  }, []);

  const complete = useCallback(() => {
    streamManagerRef.current?.complete();
    setIsStreaming(false);
  }, []);

  const cancel = useCallback(() => {
    streamManagerRef.current?.cancel();
    setIsCancelled(true);
    setIsStreaming(false);
    setMessage((msg) =>
      msg ? { ...msg, isStreaming: false } : null
    );
  }, []);

  const reset = useCallback(() => {
    streamManagerRef.current?.destroy();
    streamManagerRef.current = null;
    messageIdRef.current = generateId();
    setMessage(null);
    setIsStreaming(false);
    setIsCancelled(false);
    setError(null);
    setBuffer('');
  }, []);

  return {
    message,
    isStreaming,
    isCancelled,
    error,
    buffer,
    startStream,
    addToken,
    complete,
    cancel,
    reset,
  };
};

export default useStreaming;
