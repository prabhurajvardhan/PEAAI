import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChatContainer } from './ChatContainer';
import { ChatInput } from './ChatInput';
import { Message, SendMessagePayload, ConversationEvents } from '../types';

export interface ChatProps {
  messages?: Message[];
  onSendMessage?: (payload: SendMessagePayload) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  autoScroll?: boolean;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxMessageLength?: number;
  emptyState?: React.ReactNode;
  renderMessage?: (message: Message, index: number) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  renderTypingIndicator?: () => React.ReactNode;
  'aria-label'?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
}

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const Chat: React.FC<ChatProps> = ({
  messages: initialMessages = [],
  onSendMessage,
  onTypingStart,
  onTypingStop,
  autoScroll = true,
  loading = false,
  disabled = false,
  placeholder = 'Type a message...',
  maxMessageLength = 4000,
  emptyState,
  renderMessage,
  renderHeader,
  renderTypingIndicator,
  'aria-label': ariaLabel = 'Chat interface',
  className,
  style,
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);

  // Sync external messages
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Handle typing indicator timing
  const handleTypingStart = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(true);
    onTypingStart?.();
  }, [onTypingStart]);

  const handleTypingStop = useCallback(() => {
    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false);
      onTypingStop?.();
    }, 300);
  }, [onTypingStop]);

  const handleSendMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, newMessage]);
    handleTypingStart();

    onSendMessage?.({ content });

    // Simulate message being sent
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );
    }, 500);
  }, [onSendMessage, handleTypingStart]);

  const handleRetryMessage = useCallback((messageId: string) => {
    setMessages((prev) => {
      const msg = prev.find((m) => m.id === messageId);
      if (msg) {
        return prev.filter((m) => m.id !== messageId);
      }
      return prev;
    });
    handleSendMessage(msg!.content);
  }, [handleSendMessage]);

  const handleClearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const defaultEmptyState = (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        gap: 'var(--spacing-md)',
        color: 'var(--color-text-secondary)',
      }}
      role="status"
    >
      <span style={{ fontSize: '3rem' }}>💬</span>
      <p>Start a conversation with your AI companion!</p>
    </div>
  );

  const effectiveEmptyState = emptyState ?? defaultEmptyState;

  const defaultRenderMessage = (message: Message) => {
    return (
      <div 
        style={{ 
          display: 'flex',
          flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
          gap: 'var(--spacing-sm)',
          alignItems: 'flex-start',
          padding: 'var(--spacing-xs) 0',
        }}
        role="article"
        aria-label={`${message.role} message`}
      >
        <div 
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: message.role === 'user' 
              ? 'var(--color-primary)' 
              : 'var(--color-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {message.role === 'user' ? '👤' : '🤖'}
        </div>
        <div style={{ maxWidth: '75%' }}>
          <div
            style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              borderRadius: 'var(--border-radius)',
              backgroundColor: message.role === 'user' 
                ? 'var(--color-primary)' 
                : 'var(--color-surface)',
              color: message.role === 'user' 
                ? 'white' 
                : 'var(--color-text-primary)',
              wordBreak: 'break-word',
              lineHeight: '1.5',
            }}
          >
            {message.content}
            {message.isStreaming && (
              <span 
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '16px',
                  backgroundColor: 'currentColor',
                  marginLeft: '4px',
                  animation: 'blink 1s infinite',
                  verticalAlign: 'middle',
                }}
                aria-label="Typing indicator"
              />
            )}
          </div>
          <div 
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--spacing-xs)',
              padding: message.role === 'user' ? '0 var(--spacing-sm)' : '0',
              textAlign: message.role === 'user' ? 'right' : 'left',
            }}
          >
            <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {message.status === 'error' && (
              <span 
                style={{ color: 'var(--color-error)', marginLeft: 'var(--spacing-sm)', cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onClick={() => handleRetryMessage(message.id)}
                onKeyDown={(e) => e.key === 'Enter' && handleRetryMessage(message.id)}
              >
                Retry
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--color-background)',
        borderRadius: 'var(--border-radius)',
        overflow: 'hidden',
        ...style,
      }}
      className={className}
    >
      {renderHeader?.()}
      
      <ChatContainer
        messages={messages}
        isLoading={isTyping || loading}
        autoScroll={autoScroll}
        emptyState={effectiveEmptyState}
        renderMessage={renderMessage || defaultRenderMessage}
      />

      {(isTyping || loading) && renderTypingIndicator?.()}

      <ChatInput
        onSend={handleSendMessage}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxMessageLength}
        loading={loading}
      />
    </div>
  );
};

export default Chat;
