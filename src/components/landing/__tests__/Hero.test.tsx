import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Hero } from '../Hero';

describe('Hero', () => {
  it('renders hero section with heading', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('has accessible title', () => {
    render(<Hero />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveAttribute('id', 'hero-heading');
  });

  it('renders CTA buttons', () => {
    render(<Hero />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders subtitle text', () => {
    render(<Hero />);
    expect(screen.getByText(/PEAAI is not just another chatbot/i)).toBeInTheDocument();
  });

  it('has no credit card required badge', () => {
    render(<Hero />);
    expect(screen.getByText(/no credit card required/i)).toBeInTheDocument();
  });
});
