import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { HomeCanvasArea, useCanvasArea } from '../CanvasArea';
import React from 'react';

// Helper component to access CanvasArea context
function TestCanvasConsumer() {
  const context = useCanvasArea();
  return (
    <div>
      <span data-testid="is-initialized">{context.isInitialized.toString()}</span>
      <span data-testid="is-loading">{context.isLoading.toString()}</span>
      <span data-testid="error">{context.error || 'none'}</span>
      <button onClick={context.initialize}>Initialize</button>
      <button onClick={context.destroy}>Destroy</button>
    </div>
  );
}

describe('HomeCanvasArea', () => {
  it('should render canvas area container', () => {
    render(
      <HomeCanvasArea>
        <TestCanvasConsumer />
      </HomeCanvasArea>
    );
    expect(document.querySelector('.home-canvas-area')).toBeInTheDocument();
  });

  it('should have canvas element after auto-initialization', async () => {
    let result: any;
    await act(async () => {
      const { result: renderResult } = render(
        <HomeCanvasArea>
          <TestCanvasConsumer />
        </HomeCanvasArea>
      );
      result = renderResult;
    });

    // Check that canvas is initialized
    const isInitialized = screen.getByTestId('is-initialized');
    expect(isInitialized.textContent).toBe('true');

    const canvas = document.querySelector('.home-canvas-area__canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should render children content', () => {
    render(
      <HomeCanvasArea>
        <div data-testid="child-content">Test Child</div>
      </HomeCanvasArea>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<HomeCanvasArea className="custom-class" />);
    const container = document.querySelector('.home-canvas-area');
    expect(container).toHaveClass('custom-class');
  });

  it('should allow destroying canvas', async () => {
    await act(async () => {
      render(
        <HomeCanvasArea>
          <TestCanvasConsumer />
        </HomeCanvasArea>
      );
    });

    // Verify initialized
    expect(screen.getByTestId('is-initialized').textContent).toBe('true');

    // Destroy
    const destroyButton = screen.getByText('Destroy');
    await act(async () => {
      destroyButton.click();
    });

    // Check that canvas is destroyed
    const isInitialized = screen.getByTestId('is-initialized');
    expect(isInitialized.textContent).toBe('false');
  });
});

describe('CanvasArea Context', () => {
  it('should throw error when useCanvasArea is used outside provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestCanvasConsumer />);
    }).toThrow('useCanvasArea must be used within a CanvasAreaProvider');

    vi.restoreAllMocks();
  });
});
