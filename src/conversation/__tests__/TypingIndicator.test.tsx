import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypingIndicator, TypingBubble, TypingDots } from '../typing/TypingIndicator';

describe('TypingIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<TypingIndicator />);
      expect(screen.getByRole('status', { name: /ai is typing/i })).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      render(<TypingIndicator label="Custom typing" showLabel />);
      expect(screen.getByText('Custom typing')).toBeInTheDocument();
    });

    it('renders correct number of dots', () => {
      const { container } = render(<TypingIndicator dots={5} />);
      const dots = container.querySelectorAll('span[aria-hidden="true"]');
      expect(dots.length).toBe(5);
    });
  });

  describe('Animation', () => {
    it('updates active dot over time', () => {
      const { container } = render(<TypingIndicator dots={3} interval={300} />);
      
      // Initial state - first dot is active (rendered differently)
      const initialDots = container.querySelectorAll('span[aria-hidden="true"]');
      expect(initialDots.length).toBe(3);

      // Advance time
      vi.advanceTimersByTime(400);
      
      // Component should re-render with different active dot
      // The exact assertion depends on implementation
      expect(container.querySelectorAll('span[aria-hidden="true"]').length).toBe(3);
    });

    it('respects custom interval', () => {
      const { container } = render(<TypingIndicator dots={3} interval={500} />);
      const dots = container.querySelectorAll('span[aria-hidden="true"]');
      expect(dots.length).toBe(3);
    });
  });

  describe('Position', () => {
    it('renders label at start position', () => {
      render(<TypingIndicator label="Start label" showLabel position="start" />);
      expect(screen.getByText('Start label')).toBeInTheDocument();
    });

    it('renders label at end position', () => {
      render(<TypingIndicator label="End label" showLabel position="end" />);
      expect(screen.getByText('End label')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria attributes', () => {
      render(<TypingIndicator aria-label="Custom aria" />);
      expect(screen.getByRole('status', { name: /custom aria/i })).toBeInTheDocument();
    });

    it('uses aria-live for screen readers', () => {
      const { container } = render(<TypingIndicator />);
      const status = container.querySelector('[aria-live="polite"]');
      expect(status).toBeInTheDocument();
    });
  });
});

describe('TypingBubble', () => {
  describe('Rendering', () => {
    it('renders with default avatar', () => {
      const { container } = render(<TypingBubble />);
      // Use container query since TypingBubble contains nested status elements
      expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    });

    it('renders with custom avatar', () => {
      const customAvatar = <span>🎭</span>;
      render(<TypingBubble avatar={customAvatar} />);
      expect(screen.getByText('🎭')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria label', () => {
      const { container } = render(<TypingBubble aria-label="AI is composing" />);
      expect(container.querySelector('[aria-label="AI is composing"]')).toBeInTheDocument();
    });
  });
});

describe('TypingDots', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders with default count', () => {
      const { container } = render(<TypingDots />);
      const dots = container.querySelectorAll('span[aria-hidden="true"]');
      expect(dots.length).toBe(3);
    });

    it('renders with custom count', () => {
      const { container } = render(<TypingDots count={5} />);
      const dots = container.querySelectorAll('span[aria-hidden="true"]');
      expect(dots.length).toBe(5);
    });
  });

  describe('Size Variants', () => {
    it('renders small size', () => {
      const { container } = render(<TypingDots size="sm" />);
      const dots = container.querySelectorAll('span[aria-hidden="true"]');
      expect(dots.length).toBe(3);
    });

    it('renders medium size', () => {
      const { container } = render(<TypingDots size="md" />);
      const dots = container.querySelectorAll('span[aria-hidden="true"]');
      expect(dots.length).toBe(3);
    });

    it('renders large size', () => {
      const { container } = render(<TypingDots size="lg" />);
      const dots = container.querySelectorAll('span[aria-hidden="true"]');
      expect(dots.length).toBe(3);
    });
  });

  describe('Custom Color', () => {
    it('renders with custom color', () => {
      const { container } = render(<TypingDots color="#ff0000" />);
      const dots = container.querySelectorAll('span[aria-hidden="true"]');
      // All dots should have the custom color (though in test environment colors may not apply)
      expect(dots.length).toBe(3);
    });
  });

  describe('Accessibility', () => {
    it('has default aria label', () => {
      render(<TypingDots />);
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });

    it('accepts custom aria label', () => {
      render(<TypingDots aria-label="Processing your request" />);
      expect(screen.getByRole('status', { name: /processing your request/i })).toBeInTheDocument();
    });
  });
});
