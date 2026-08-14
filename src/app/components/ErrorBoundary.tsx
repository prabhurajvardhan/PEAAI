import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../../foundation/components/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-text-primary)',
            textAlign: 'center',
          }}
          role="alert"
          aria-live="assertive"
        >
          <div
            style={{
              maxWidth: '500px',
              padding: '2rem',
              borderRadius: 'var(--border-radius-lg)',
              backgroundColor: 'var(--color-surface)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
                color: 'var(--color-error)',
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)',
                marginBottom: '1.5rem',
              }}
            >
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <Button variant="primary" onClick={this.handleReset}>
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onReset?: () => void;
}

interface AsyncErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AsyncErrorBoundary extends Component<
  AsyncErrorBoundaryProps,
  AsyncErrorBoundaryState
> {
  constructor(props: AsyncErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AsyncErrorBoundaryState {
    return { hasError: true, error };
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <>
          {this.props.fallback}
          <Button
            variant="ghost"
            size="sm"
            onClick={this.handleReset}
            style={{ position: 'fixed', bottom: '1rem', right: '1rem' }}
          >
            Retry
          </Button>
        </>
      );
    }

    return this.props.children;
  }
}
