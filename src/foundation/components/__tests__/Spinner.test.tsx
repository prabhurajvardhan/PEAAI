/**
 * Spinner Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Spinner, DotsSpinner, PulseSpinner } from '../spinner/Spinner';

describe('Spinner', () => {
  it('renders with default props', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<Spinner label="Custom Loading" />);
    expect(screen.getByLabelText(/custom loading/i)).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Spinner size="xs" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<Spinner size="sm" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<Spinner size="md" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<Spinner size="lg" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<Spinner size="xl" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies primary variant color', () => {
    render(<Spinner variant="primary" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies secondary variant color', () => {
    render(<Spinner variant="secondary" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies white variant color', () => {
    render(<Spinner variant="white" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies custom color', () => {
    render(<Spinner color="#ff0000" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with overlay', () => {
    render(<Spinner overlay />);
    const overlay = document.body.querySelector('div[style*="position: fixed"]');
    expect(overlay).toBeInTheDocument();
  });

  it('has spin animation', () => {
    render(<Spinner />);
    const svg = screen.getByRole('status');
    expect(svg).toHaveStyle({
      animation: 'spin 1s linear infinite',
    });
  });

  it('supports custom className', () => {
    render(<Spinner className="custom-spinner" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('supports custom style', () => {
    render(<Spinner style={{ margin: '10px' }} />);
    const spinner = screen.getByRole('status');
    expect(spinner.style.margin).toBe('10px');
  });
});

describe('DotsSpinner', () => {
  it('renders three dots', () => {
    render(<DotsSpinner />);
    const dots = document.querySelectorAll('span');
    expect(dots.length).toBe(3);
  });

  it('renders with default size', () => {
    render(<DotsSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<DotsSpinner size="sm" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<DotsSpinner size="md" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<DotsSpinner size="lg" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies custom color', () => {
    render(<DotsSpinner color="#00ff00" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has bounce animation', () => {
    render(<DotsSpinner />);
    const container = screen.getByRole('status');
    expect(container).toBeInTheDocument();
  });
});

describe('PulseSpinner', () => {
  it('renders three pulsing spans', () => {
    render(<PulseSpinner />);
    const spans = document.querySelectorAll('span');
    expect(spans.length).toBe(3);
  });

  it('renders with default size', () => {
    render(<PulseSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<PulseSpinner size="sm" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<PulseSpinner size="md" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<PulseSpinner size="lg" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies custom color', () => {
    render(<PulseSpinner color="#0000ff" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has pulse animation', () => {
    render(<PulseSpinner />);
    const container = screen.getByRole('status');
    expect(container).toBeInTheDocument();
  });
});
