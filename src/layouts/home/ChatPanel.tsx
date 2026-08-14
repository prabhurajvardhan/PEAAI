import React, { useState, useRef, useEffect } from 'react';
import type { ChatPanelProps } from './types';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'companion';
  timestamp: Date;
}

interface ChatPanelContentProps extends ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isTyping?: boolean;
}

function ChatPanelContent({ open, onClose, messages, onSendMessage, isTyping }: ChatPanelContentProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      className={`home-chat-panel ${open ? 'home-chat-panel--open' : ''}`}
      role="region"
      aria-label="Chat panel"
    >
      <div className="home-chat-panel__header">
        <h2 className="home-chat-panel__title">Chat</h2>
        <button
          className="home-chat-panel__close"
          onClick={onClose}
          aria-label="Close chat panel"
          type="button"
        >
          ✕
        </button>
      </div>

      <div className="home-chat-panel__messages" role="log" aria-live="polite">
        {messages.length === 0 && (
          <div className="home-chat-panel__empty">
            <p>Start a conversation with your AI companion!</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`home-chat-panel__message home-chat-panel__message--${message.sender}`}
          >
            <div className="home-chat-panel__message-bubble">
              {message.content}
            </div>
            <span className="home-chat-panel__message-time">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {isTyping && (
          <div className="home-chat-panel__message home-chat-panel__message--companion">
            <div className="home-chat-panel__typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="home-chat-panel__input-area" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="home-chat-panel__input"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Message input"
        />
        <button
          type="submit"
          className="home-chat-panel__send"
          disabled={!inputValue.trim()}
          aria-label="Send message"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export interface HomeChatPanelState {
  messages: Message[];
  isTyping: boolean;
}

export function HomeChatPanel({
  open,
  onClose,
  messages = [],
  onSendMessage,
  isTyping = false,
}: ChatPanelContentProps & Partial<HomeChatPanelState>) {
  return (
    <ChatPanelContent
      open={open}
      onClose={onClose}
      messages={messages}
      onSendMessage={onSendMessage || (() => {})}
      isTyping={isTyping}
    />
  );
}
