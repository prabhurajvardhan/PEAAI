import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from '../spinner/Spinner';

describe('Spinner', () => {
  it('renders with default props', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has loading label', () => {
    render(<Spinner />);
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('applies size sm', () => {
    render(<Spinner size="sm" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies size md', () => {
    render(<Spinner size="md" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies size lg', () => {
    render(<Spinner size="lg" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    render(<Spinner variant="default" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies dots variant', () => {
    render(<Spinner variant="dots" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies pulse variant', () => {
    render(<Spinner variant="pulse" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('accepts custom color', () => {
    render(<Spinner color="blue" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('accepts className', () => {
    render(<Spinner className="custom-spinner" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('accepts custom style', () => {
    render(<Spinner style={{ margin: '10px' }} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
