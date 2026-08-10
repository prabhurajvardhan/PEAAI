import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomeChatPanel } from '../ChatPanel';

describe('HomeChatPanel', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render chat panel when open', () => {
    render(<HomeChatPanel {...defaultProps} />);
    expect(screen.getByRole('region', { name: 'Chat panel' })).toBeInTheDocument();
  });

  it('should display header with title', () => {
    render(<HomeChatPanel {...defaultProps} />);
    expect(screen.getByText('Chat')).toBeInTheDocument();
  });

  it('should have close button', () => {
    render(<HomeChatPanel {...defaultProps} />);
    const closeButton = screen.getByRole('button', { name: 'Close chat panel' });
    expect(closeButton).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<HomeChatPanel {...defaultProps} />);
    const closeButton = screen.getByRole('button', { name: 'Close chat panel' });
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should display empty state when no messages', () => {
    render(<HomeChatPanel {...defaultProps} messages={[]} />);
    expect(screen.getByText('Start a conversation with your AI companion!')).toBeInTheDocument();
  });

  it('should display messages when provided', () => {
    const messages = [
      {
        id: '1',
        content: 'Hello!',
        sender: 'user' as const,
        timestamp: new Date('2024-01-01T12:00:00'),
      },
      {
        id: '2',
        content: 'Hi there!',
        sender: 'companion' as const,
        timestamp: new Date('2024-01-01T12:01:00'),
      },
    ];

    render(<HomeChatPanel {...defaultProps} messages={messages} />);
    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should show typing indicator when isTyping is true', () => {
    render(<HomeChatPanel {...defaultProps} isTyping={true} />);
    const typingIndicator = document.querySelector('.home-chat-panel__typing-indicator');
    expect(typingIndicator).toBeInTheDocument();
  });

  it('should have input field', () => {
    render(<HomeChatPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText('Type a message...');
    expect(input).toBeInTheDocument();
  });

  it('should have send button', () => {
    render(<HomeChatPanel {...defaultProps} />);
    const sendButton = screen.getByRole('button', { name: 'Send message' });
    expect(sendButton).toBeInTheDocument();
  });

  it('should call onSendMessage when form is submitted', () => {
    const onSendMessage = vi.fn();
    render(<HomeChatPanel {...defaultProps} onSendMessage={onSendMessage} />);

    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Test message' } });

    const sendButton = screen.getByRole('button', { name: 'Send message' });
    fireEvent.click(sendButton);

    expect(onSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('should clear input after sending message', () => {
    const onSendMessage = vi.fn();
    render(<HomeChatPanel {...defaultProps} onSendMessage={onSendMessage} />);

    const input = screen.getByPlaceholderText('Type a message...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test message' } });
    expect(input.value).toBe('Test message');

    const sendButton = screen.getByRole('button', { name: 'Send message' });
    fireEvent.click(sendButton);

    expect(input.value).toBe('');
  });

  it('should not submit empty messages', () => {
    const onSendMessage = vi.fn();
    render(<HomeChatPanel {...defaultProps} onSendMessage={onSendMessage} />);

    const sendButton = screen.getByRole('button', { name: 'Send message' });
    fireEvent.click(sendButton);

    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('should submit message on Enter key press', () => {
    const onSendMessage = vi.fn();
    render(<HomeChatPanel {...defaultProps} onSendMessage={onSendMessage} />);

    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('should disable send button when input is empty', () => {
    render(<HomeChatPanel {...defaultProps} />);
    const sendButton = screen.getByRole('button', { name: 'Send message' });
    expect(sendButton).toBeDisabled();
  });

  it('should enable send button when input has value', () => {
    render(<HomeChatPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Test' } });

    const sendButton = screen.getByRole('button', { name: 'Send message' });
    expect(sendButton).not.toBeDisabled();
  });
});
