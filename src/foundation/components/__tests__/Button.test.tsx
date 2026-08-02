import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button/Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies primary variant', () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('applies secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('applies ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('applies danger variant', () => {
    render(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('applies size sm', () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('applies size lg', () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders with left icon', () => {
    render(<Button leftIcon={<span>icon</span>}>With Icon</Button>);
    expect(screen.getByText('icon')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    render(<Button rightIcon={<span>icon</span>}>With Icon</Button>);
    expect(screen.getByText('icon')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = { current: null } as React.RefObject<HTMLButtonElement>;
    render(<Button ref={ref}>Button</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
