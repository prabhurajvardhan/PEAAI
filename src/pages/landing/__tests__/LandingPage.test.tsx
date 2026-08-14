import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LandingPage } from '../LandingPage';

describe('LandingPage', () => {
  it('renders main element with main role', () => {
    render(<LandingPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders all sections', () => {
    render(<LandingPage />);
    // Check that the Hero section heading exists
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
