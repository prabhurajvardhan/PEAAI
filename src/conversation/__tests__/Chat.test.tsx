import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Chat } from '../chat/Chat';
import { Message } from '../types';

describe('Chat', () => {
  const mockMessages: Message[] = [
    {
      id: '1',
      role: 'user',
      content: 'Hello AI!',
      timestamp: new Date('2024-01-01T10:00:00'),
      status: 'sent',
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Hello! How can I help you?',
      timestamp: new Date('2024-01-01T10:01:00'),
      status: 'sent',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the chat container', () => {
      const { container } = render(<Chat messages={mockMessages} />);
      expect(container.querySelector('[role="region"]')).toBeInTheDocument();
    });

    it('displays messages correctly', () => {
      render(<Chat messages={mockMessages} />);
      expect(screen.getByText('Hello AI!')).toBeInTheDocument();
      expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument();
    });

    it('shows empty state when no messages', () => {
      const { container } = render(<Chat messages={[]} />);
      expect(container.textContent).toContain('Start');
    });

    it('shows custom empty state', () => {
      const customEmptyState = <div>No chat history</div>;
      render(<Chat messages={[]} emptyState={customEmptyState} />);
      expect(screen.getByText('No chat history')).toBeInTheDocument();
    });
  });

  describe('Message Interaction', () => {
    it('calls onSendMessage when message is sent', async () => {
      const handleSendMessage = vi.fn();
      render(<Chat messages={[]} onSendMessage={handleSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(sendButton);
      
      expect(handleSendMessage).toHaveBeenCalledWith({ content: 'Test message' });
    });

    it('clears input after sending message', async () => {
      render(<Chat messages={[]} />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(sendButton);
      
      expect((textarea as HTMLTextAreaElement).value).toBe('');
    });

    it('adds user message to the list', async () => {
      render(<Chat messages={[]} />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'New message' } });
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(sendButton);
      
      await vi.waitFor(() => {
        expect(screen.getByText('New message')).toBeInTheDocument();
      });
    });
  });

  describe('Input Behavior', () => {
    it('calls onSendMessage on Enter key press', async () => {
      const handleSendMessage = vi.fn();
      render(<Chat messages={[]} onSendMessage={handleSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Enter message' } });
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
      
      expect(handleSendMessage).toHaveBeenCalledWith({ content: 'Enter message' });
    });

    it('does not send on Shift+Enter', async () => {
      const handleSendMessage = vi.fn();
      render(<Chat messages={[]} onSendMessage={handleSendMessage} sendOnEnter />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });
      
      expect(handleSendMessage).not.toHaveBeenCalled();
    });

    it('respects disabled prop', () => {
      render(<Chat messages={[]} disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria labels', () => {
      const { container } = render(<Chat messages={mockMessages} />);
      expect(container.querySelector('[role="region"]')).toBeInTheDocument();
      expect(container.querySelector('[role="log"]')).toBeInTheDocument();
    });

    it('shows loading state with proper aria', () => {
      const { container } = render(<Chat messages={[]} loading />);
      expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    });
  });

  describe('Custom Rendering', () => {
    it('renders custom header', () => {
      const customHeader = <div>Custom Header</div>;
      render(<Chat messages={[]} renderHeader={() => customHeader} />);
      expect(screen.getByText('Custom Header')).toBeInTheDocument();
    });

    it('renders custom message', () => {
      const customMessage = (msg: Message) => <div data-testid="custom-msg">{msg.content}</div>;
      render(<Chat messages={mockMessages} renderMessage={customMessage} />);
      expect(screen.getAllByTestId('custom-msg')).toHaveLength(2);
    });
  });
});
