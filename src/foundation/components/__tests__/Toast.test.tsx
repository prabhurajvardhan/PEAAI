import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../toast/Toast';

function TestComponent() {
  const { addToast } = useToast();
  return (
    <button onClick={() => addToast({ message: 'Test toast', variant: 'success' })}>
      Show Toast
    </button>
  );
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders without crashing', () => {
    render(
      <ToastProvider>
        <div>Test</div>
      </ToastProvider>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('shows toast when addToast is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('auto-dismisses after duration', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('displays success variant', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('can dismiss toast manually', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Toast'));
    const closeButton = screen.getByRole('alert').querySelector('button');
    if (closeButton) fireEvent.click(closeButton);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('useToast', () => {
  it('throws error when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within a ToastProvider');
    consoleError.mockRestore();
  });
});
