import React from 'react';
import { Button } from '../../foundation/components';
import styles from './Hero.module.css';

export interface HeroProps {
  className?: string;
}

export function Hero({ className }: HeroProps) {
  return (
    <section 
      className={`${styles.hero} ${className || ''}`}
      aria-labelledby="hero-heading"
    >
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 id="hero-heading" className={styles.title}>
            Your AI Companion for
            <span className={styles.highlight}> Endless Entertainment</span>
          </h1>
          <p className={styles.subtitle}>
            PEAAI is not just another chatbot. Experience an AI companion with 
            personality, visual expressions, and storytelling that creates 
            genuine emotional connections.
          </p>
          <div className={styles.actions}>
            <Button variant="primary" size="lg">
              Get Started Free
            </Button>
            <Button variant="secondary" size="lg">
              Watch Demo
            </Button>
          </div>
          <p className={styles.badge}>
            <span className={styles.dot} aria-hidden="true" />
            No credit card required
          </p>
        </div>
        <div className={styles.visual}>
          <div className={styles.canvasPreview} aria-hidden="true">
            <div className={styles.pixelFace}>
              <div className={styles.eyeLeft} />
              <div className={styles.eyeRight} />
              <div className={styles.mouth} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
