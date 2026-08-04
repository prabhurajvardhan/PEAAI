import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Pricing } from '../Pricing';

describe('Pricing', () => {
  it('renders pricing section with heading', () => {
    render(<Pricing />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('has accessible title', () => {
    render(<Pricing />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveAttribute('id', 'pricing-heading');
  });

  it('renders all 3 pricing plans', () => {
    render(<Pricing />);
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
  });

  it('renders plan prices', () => {
    render(<Pricing />);
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$9')).toBeInTheDocument();
    expect(screen.getByText('$29')).toBeInTheDocument();
  });

  it('marks popular plan', () => {
    render(<Pricing />);
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  it('renders money-back guarantee', () => {
    render(<Pricing />);
    expect(screen.getByText(/14-day money-back guarantee/i)).toBeInTheDocument();
  });
});
