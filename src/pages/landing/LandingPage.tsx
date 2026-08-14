import React from 'react';
import { ThemeProvider } from '../../foundation/theme';
import { Hero } from '../../components/landing/Hero';
import { Features } from '../../components/landing/Features';
import { Pricing } from '../../components/landing/Pricing';
import { Footer } from '../../components/landing/Footer';

export interface LandingPageProps {
  className?: string;
}

export function LandingPage({ className }: LandingPageProps) {
  return (
    <ThemeProvider>
      <main className={className} role="main">
        <Hero />
        <Features />
        <Pricing />
        <Footer />
      </main>
    </ThemeProvider>
  );
}

export default LandingPage;
