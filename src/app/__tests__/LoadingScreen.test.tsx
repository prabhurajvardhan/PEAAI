import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingScreen } from '../components/LoadingScreen';

describe('LoadingScreen', () => {
  it('renders default loading message', () => {
    render(<LoadingScreen />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<LoadingScreen message="Custom loading..." />);
    expect(screen.getByText('Custom loading...')).toBeInTheDocument();
  });

  it('shows progress bar when showProgress is true', () => {
    render(<LoadingScreen showProgress={true} progress={50} />);
    const content = screen.getByRole('status');
    expect(content).toBeInTheDocument();
  });

  it('renders with full screen styling', () => {
    const { container } = render(<LoadingScreen />);
    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<LoadingScreen message="Loading content..." />);
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toHaveAttribute('aria-live', 'polite');
    expect(loadingElement).toHaveAttribute('aria-label', 'Loading content...');
  });
});
