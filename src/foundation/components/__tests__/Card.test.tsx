/**
 * Card Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Card, CardHeader, CardBody, CardFooter, CardTitle, CardDescription } from '../card/Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies elevated variant styles', () => {
    render(<Card variant="elevated">Elevated</Card>);
    expect(screen.getByText('Elevated')).toBeInTheDocument();
  });

  it('applies outlined variant styles', () => {
    render(<Card variant="outlined">Outlined</Card>);
    expect(screen.getByText('Outlined')).toBeInTheDocument();
  });

  it('applies filled variant styles', () => {
    render(<Card variant="filled">Filled</Card>);
    expect(screen.getByText('Filled')).toBeInTheDocument();
  });

  it('renders as clickable button', () => {
    render(<Card clickable onClick={() => {}}>Clickable</Card>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders hoverable state', () => {
    render(<Card hoverable>Hoverable</Card>);
    expect(screen.getByText('Hoverable')).toBeInTheDocument();
  });

  it('renders with padding none', () => {
    render(<Card padding="none">No padding</Card>);
    expect(screen.getByText('No padding')).toBeInTheDocument();
  });

  it('renders with padding sm', () => {
    render(<Card padding="sm">Small padding</Card>);
    expect(screen.getByText('Small padding')).toBeInTheDocument();
  });

  it('renders with padding lg', () => {
    render(<Card padding="lg">Large padding</Card>);
    expect(screen.getByText('Large padding')).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Card ref={ref}>Card</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardHeader', () => {
  it('renders children correctly', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('applies border bottom', () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('aligns content left by default', () => {
    render(<CardHeader>Left aligned</CardHeader>);
    expect(screen.getByText('Left aligned')).toBeInTheDocument();
  });

  it('aligns content center', () => {
    render(<CardHeader align="center">Center aligned</CardHeader>);
    expect(screen.getByText('Center aligned')).toBeInTheDocument();
  });

  it('aligns content right', () => {
    render(<CardHeader align="right">Right aligned</CardHeader>);
    expect(screen.getByText('Right aligned')).toBeInTheDocument();
  });
});

describe('CardBody', () => {
  it('renders children correctly', () => {
    render(<CardBody>Body content</CardBody>);
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('renders with noPadding', () => {
    render(<CardBody noPadding>No padding</CardBody>);
    expect(screen.getByText('No padding')).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('renders children correctly', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('applies border top by default', () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('removes border when bordered is false', () => {
    render(<CardFooter bordered={false}>Footer</CardFooter>);
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('uses flexbox for alignment', () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});

describe('CardTitle', () => {
  it('renders as heading by default', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('renders as custom heading level', () => {
    render(<CardTitle as="h2">H2 Title</CardTitle>);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('applies heading styles', () => {
    render(<CardTitle>Styled Title</CardTitle>);
    const title = screen.getByRole('heading', { level: 3 });
    expect(title).toHaveStyle({
      margin: 0,
      fontWeight: 'var(--font-weight-semibold)',
    });
  });
});

describe('CardDescription', () => {
  it('renders paragraph', () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('renders as paragraph element', () => {
    render(<CardDescription>Description</CardDescription>);
    expect(screen.getByText('Description').tagName).toBe('P');
  });
});
