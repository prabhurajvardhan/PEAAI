import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Features } from '../Features';

describe('Features', () => {
  it('renders features section with heading', () => {
    render(<Features />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('has accessible title', () => {
    render(<Features />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveAttribute('id', 'features-heading');
  });

  it('renders all 6 feature cards', () => {
    render(<Features />);
    // Cards use div elements, so we check by feature titles instead
    expect(screen.getByText('Unique Personality')).toBeInTheDocument();
    expect(screen.getByText('Living Pixel Canvas')).toBeInTheDocument();
    expect(screen.getByText('Interactive Storytelling')).toBeInTheDocument();
    expect(screen.getByText('Emotional Connection')).toBeInTheDocument();
    expect(screen.getByText('Dynamic Expressions')).toBeInTheDocument();
    expect(screen.getByText('Always Available')).toBeInTheDocument();
  });

  it('renders feature titles', () => {
    render(<Features />);
    expect(screen.getByText('Unique Personality')).toBeInTheDocument();
    expect(screen.getByText('Living Pixel Canvas')).toBeInTheDocument();
    expect(screen.getByText('Interactive Storytelling')).toBeInTheDocument();
  });
});
