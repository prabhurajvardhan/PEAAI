import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from '../types';

export interface ChatContainerProps {
  messages: Message[];
  isLoading?: boolean;
  autoScroll?: boolean;
  emptyState?: React.ReactNode;
  renderMessage?: (message: Message, index: number) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
  'aria-label'?: string;
  className?: string;
  style?: React.CSSProperties;
}

interface VirtualItem {
  index: number;
  offsetTop: number;
  height: number;
}

const ITEM_ESTIMATED_HEIGHT = 80;
const OVERSCAN = 5;

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading = false,
  autoScroll = true,
  emptyState,
  renderMessage,
  renderHeader,
  renderFooter,
  'aria-label': ariaLabel = 'Chat conversation',
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const userScrolledRef = useRef(false);

  // Measure container height
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Calculate virtual items
  const virtualItems = React.useMemo<VirtualItem[]>(() => {
    const items: VirtualItem[] = [];
    let offsetTop = 0;

    for (let i = 0; i < messages.length; i++) {
      const height = ITEM_ESTIMATED_HEIGHT; // Would need measurement for production
      items.push({ index: i, offsetTop, height });
      offsetTop += height;
    }

    return items;
  }, [messages.length]);

  // Calculate visible range
  const visibleRange = React.useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_ESTIMATED_HEIGHT) - OVERSCAN);
    const endIndex = Math.min(
      messages.length - 1,
      Math.ceil((scrollTop + containerHeight) / ITEM_ESTIMATED_HEIGHT) + OVERSCAN
    );
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, messages.length]);

  // Auto-scroll behavior
  useEffect(() => {
    if (autoScroll && !userScrolledRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
    
    // Check if user scrolled up from bottom
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;
    userScrolledRef.current = !isAtBottom;
  }, []);

  const totalHeight = messages.length * ITEM_ESTIMATED_HEIGHT;

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    ...style,
  };

  const messagesAreaStyles: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    position: 'relative',
  };

  const messagesListStyles: React.CSSProperties = {
    height: `${totalHeight}px`,
    position: 'relative',
  };

  return (
    <div 
      ref={containerRef}
      style={containerStyles}
      className={className}
      role="region"
      aria-label={ariaLabel}
      onScroll={handleScroll}
    >
      {renderHeader?.()}
      
      <div style={messagesAreaStyles} role="log" aria-live="polite" aria-relevant="additions">
        {messages.length === 0 ? (
          emptyState || (
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: 'var(--color-text-secondary)',
              }}
              role="status"
            >
              No messages yet. Start the conversation!
            </div>
          )
        ) : (
          <div style={messagesListStyles}>
            {virtualItems.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item) => {
              const message = messages[item.index];
              return (
                <div
                  key={message.id}
                  style={{
                    position: 'absolute',
                    top: item.offsetTop,
                    left: 0,
                    right: 0,
                    height: item.height,
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                  }}
                >
                  {renderMessage ? (
                    renderMessage(message, item.index)
                  ) : (
                    <ChatMessage message={message} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isLoading && (
        <div 
          style={{ 
            padding: 'var(--spacing-sm) var(--spacing-md)',
            color: 'var(--color-text-secondary)',
            fontSize: '0.875rem',
          }}
          role="status"
          aria-label="Loading"
        >
          Processing...
        </div>
      )}

      {renderFooter?.()}
    </div>
  );
};

export interface ChatMessageProps {
  message: Message;
  className?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, className }) => {
  const messageStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
    gap: 'var(--spacing-sm)',
    alignItems: 'flex-start',
  };

  const bubbleStyles: React.CSSProperties = {
    maxWidth: '70%',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    borderRadius: 'var(--border-radius)',
    backgroundColor: message.role === 'user' 
      ? 'var(--color-primary)' 
      : 'var(--color-surface)',
    color: message.role === 'user' 
      ? 'white' 
      : 'var(--color-text-primary)',
    wordBreak: 'break-word',
  };

  const avatarStyles: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: message.role === 'user' 
      ? 'var(--color-primary-hover)' 
      : 'var(--color-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    color: 'white',
    flexShrink: 0,
  };

  const metadataStyles: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    marginTop: 'var(--spacing-xs)',
    display: 'flex',
    gap: 'var(--spacing-sm)',
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'user': return 'You';
      case 'assistant': return 'AI';
      case 'system': return 'System';
      default: return role;
    }
  };

  return (
    <div style={messageStyles} className={className} role="article" aria-label={`${getRoleLabel(message.role)} message`}>
      <div style={avatarStyles} aria-hidden="true">
        {message.role === 'user' ? '👤' : '🤖'}
      </div>
      <div>
        <div style={bubbleStyles}>
          {message.content}
          {message.isStreaming && (
            <span 
              style={{ 
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'currentColor',
                marginLeft: '4px',
                animation: 'pulse 1s infinite',
              }}
              aria-label="Typing"
            />
          )}
        </div>
        <div style={metadataStyles}>
          <span>{getRoleLabel(message.role)}</span>
          <span>{message.timestamp.toLocaleTimeString()}</span>
          {message.status === 'error' && <span style={{ color: 'var(--color-error)' }}>Failed</span>}
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
