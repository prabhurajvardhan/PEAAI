import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AppStateProvider, useAppState } from '../providers/AppContext';
import React from 'react';

const TestComponent = () => {
  const { state, setReady, setAuthenticated, setUserId, reset } = useAppState();

  return (
    <div>
      <span data-testid="isReady">{String(state.isReady)}</span>
      <span data-testid="isAuthenticated">{String(state.isAuthenticated)}</span>
      <span data-testid="userId">{state.userId ?? 'null'}</span>
      <button onClick={() => setReady(true)}>Set Ready</button>
      <button onClick={() => setAuthenticated(true)}>Set Auth</button>
      <button onClick={() => setUserId('user-123')}>Set User</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
};

describe('AppStateProvider', () => {
  it('provides initial state', () => {
    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>
    );

    expect(screen.getByTestId('isReady')).toHaveTextContent('false');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('userId')).toHaveTextContent('null');
  });

  it('updates state when setReady is called', () => {
    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>
    );

    act(() => {
      screen.getByText('Set Ready').click();
    });

    expect(screen.getByTestId('isReady')).toHaveTextContent('true');
  });

  it('updates state when setAuthenticated is called', () => {
    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>
    );

    act(() => {
      screen.getByText('Set Auth').click();
    });

    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
  });

  it('updates state when setUserId is called', () => {
    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>
    );

    act(() => {
      screen.getByText('Set User').click();
    });

    expect(screen.getByTestId('userId')).toHaveTextContent('user-123');
  });

  it('resets state when reset is called', () => {
    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>
    );

    // Make some state changes
    act(() => {
      screen.getByText('Set Ready').click();
      screen.getByText('Set Auth').click();
      screen.getByText('Set User').click();
    });

    // Verify state changed
    expect(screen.getByTestId('isReady')).toHaveTextContent('true');

    // Reset
    act(() => {
      screen.getByText('Reset').click();
    });

    // Verify state reset
    expect(screen.getByTestId('isReady')).toHaveTextContent('false');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('userId')).toHaveTextContent('null');
  });
});
