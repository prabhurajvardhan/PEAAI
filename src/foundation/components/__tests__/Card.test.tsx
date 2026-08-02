import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardBody, CardFooter, CardTitle, CardDescription } from '../card/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies elevated variant', () => {
    render(<Card variant="elevated">Elevated</Card>);
    expect(screen.getByText('Elevated')).toBeInTheDocument();
  });

  it('applies outlined variant', () => {
    render(<Card variant="outlined">Outlined</Card>);
    expect(screen.getByText('Outlined')).toBeInTheDocument();
  });

  it('applies filled variant', () => {
    render(<Card variant="filled">Filled</Card>);
    expect(screen.getByText('Filled')).toBeInTheDocument();
  });

  it('renders as clickable button', () => {
    render(<Card clickable onClick={() => {}}>Clickable</Card>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });
});

describe('CardBody', () => {
  it('renders children', () => {
    render(<CardBody>Body content</CardBody>);
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('renders children', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});

describe('CardTitle', () => {
  it('renders as heading', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });
});

describe('CardDescription', () => {
  it('renders as paragraph', () => {
    render(<CardDescription>Description</CardDescription>);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });
});
