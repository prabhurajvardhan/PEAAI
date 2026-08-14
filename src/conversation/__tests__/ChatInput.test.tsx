import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from '../chat/ChatInput';

describe('ChatInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders input field', () => {
      render(<ChatInput onSend={vi.fn()} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders send button', () => {
      render(<ChatInput onSend={vi.fn()} />);
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    it('uses placeholder text', () => {
      render(<ChatInput onSend={vi.fn()} placeholder="Type here..." />);
      expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls onSend when message is sent', () => {
      const handleSend = vi.fn();
      render(<ChatInput onSend={handleSend} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Hello!' } });

      const sendButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(sendButton);

      expect(handleSend).toHaveBeenCalledWith('Hello!');
    });

    it('clears input after sending', () => {
      const handleSend = vi.fn();
      render(<ChatInput onSend={handleSend} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Hello!' } });
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(sendButton);

      expect((textarea as HTMLTextAreaElement).value).toBe('');
    });

    it('does not send empty messages', () => {
      const handleSend = vi.fn();
      render(<ChatInput onSend={handleSend} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '   ' } });

      const sendButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(sendButton);

      expect(handleSend).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Support', () => {
    it('sends on Enter key', () => {
      const handleSend = vi.fn();
      render(<ChatInput onSend={handleSend} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

      expect(handleSend).toHaveBeenCalledWith('Test message');
    });

    it('does not send on Shift+Enter', () => {
      const handleSend = vi.fn();
      render(<ChatInput onSend={handleSend} sendOnEnter />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });

      expect(handleSend).not.toHaveBeenCalled();
    });

    it('respects sendOnEnter option', () => {
      const handleSend = vi.fn();
      render(<ChatInput onSend={handleSend} sendOnEnter={false} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

      expect(handleSend).not.toHaveBeenCalled();
    });
  });

  describe('Character Count', () => {
    it('shows character count when enabled', () => {
      render(<ChatInput onSend={vi.fn()} showCharacterCount maxLength={100} />);
      expect(screen.getByText(/^\d+\/100$/)).toBeInTheDocument();
    });

    it('respects maxLength', () => {
      render(<ChatInput onSend={vi.fn()} maxLength={10} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'This is a long message' } });

      expect((textarea as HTMLTextAreaElement).value.length).toBeLessThanOrEqual(10);
    });

    it('shows warning when near max length', () => {
      const maxLength = 10;
      render(
        <ChatInput 
          onSend={vi.fn()} 
          showCharacterCount 
          maxLength={maxLength}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '123456789' } }); // 9 chars, 90%

      const countElement = screen.getByText(/^\d+\/\d+$/);
      expect(countElement).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables input when disabled', () => {
      render(<ChatInput onSend={vi.fn()} disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('disables send button when disabled', () => {
      render(<ChatInput onSend={vi.fn()} disabled />);
      expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
    });

    it('disables when loading', () => {
      render(<ChatInput onSend={vi.fn()} loading />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('shows loading spinner when loading', () => {
      render(<ChatInput onSend={vi.fn()} loading />);
      // The button should show a spinner SVG
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has aria label', () => {
      render(<ChatInput onSend={vi.fn()} aria-label="Chat message input" />);
      expect(screen.getByRole('textbox', { name: /chat message input/i })).toBeInTheDocument();
    });

    it('has accessible send button', () => {
      render(<ChatInput onSend={vi.fn()} />);
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });
  });
});
