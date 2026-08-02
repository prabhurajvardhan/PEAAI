/**
 * Toast Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { Toast, ToastContainer } from '../toast/Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with message', () => {
    render(<Toast message="Hello World" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders with title', () => {
    render(<Toast title="Title" message="Message" />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('renders as alert role', () => {
    render(<Toast message="Alert" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders success type', () => {
    render(<Toast type="success" message="Success" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders error type', () => {
    render(<Toast type="error" message="Error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders warning type', () => {
    render(<Toast type="warning" message="Warning" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders info type', () => {
    render(<Toast type="info" message="Info" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders close button when closable', () => {
    render(<Toast message="Closable" closable />);
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('hides close button when not closable', () => {
    render(<Toast message="Not closable" closable={false} />);
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const handleClose = vi.fn();
    render(<Toast message="Close me" onClose={handleClose} closable />);
    
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('auto dismisses after duration', () => {
    const handleClose = vi.fn();
    render(<Toast message="Auto close" onClose={handleClose} duration={1000} />);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not auto dismiss when duration is 0', () => {
    const handleClose = vi.fn();
    render(<Toast message="No auto close" onClose={handleClose} duration={0} />);
    
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('renders custom icon', () => {
    render(<Toast message="Custom icon" icon={<span>🎉</span>} />);
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('renders different positions', () => {
    const positions = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const;
    
    for (const position of positions) {
      const { unmount } = render(
        <Toast message={`Position: ${position}`} position={position} />
      );
      expect(screen.getByText(`Position: ${position}`)).toBeInTheDocument();
      unmount();
    }
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Toast ref={ref} message="With ref" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('ToastContainer', () => {
  it('renders children', () => {
    render(
      <ToastContainer>
        <Toast message="Child 1" />
        <Toast message="Child 2" />
      </ToastContainer>
    );
    
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('renders at bottom-right by default', () => {
    render(<ToastContainer><Toast message="Test" /></ToastContainer>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders at specified position', () => {
    render(
      <ToastContainer position="top-left">
        <Toast message="Top left" />
      </ToastContainer>
    );
    expect(screen.getByText('Top left')).toBeInTheDocument();
  });
});
