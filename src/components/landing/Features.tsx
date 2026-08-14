import React from 'react';
import { Card, CardBody } from '../../foundation/components';
import styles from './Features.module.css';

export interface FeaturesProps {
  className?: string;
}

const features = [
  {
    id: 'personality',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    title: 'Unique Personality',
    description:
      'Every companion has its own character, humor, and way of expressing emotions that evolves over time.',
  },
  {
    id: 'visual',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 9h.01M15 9h.01M9 15h6" />
      </svg>
    ),
    title: 'Living Pixel Canvas',
    description:
      'Watch your AI companion express emotions through expressive pixel art animations that feel genuinely alive.',
  },
  {
    id: 'storytelling',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    title: 'Interactive Storytelling',
    description:
      'Experience stories that unfold visually, with your companion bringing narratives to life through pixel art.',
  },
  {
    id: 'emotional',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    title: 'Emotional Connection',
    description:
      'Build a genuine relationship over time as your companion remembers your conversations and grows with you.',
  },
  {
    id: 'expressions',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    title: 'Dynamic Expressions',
    description:
      'From happy smiles to thoughtful looks, your companion expresses a full range of emotions naturally.',
  },
  {
    id: 'always-on',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: 'Always Available',
    description:
      'Your companion is ready whenever you want to chat, tell stories, or simply hang out.',
  },
];

export function Features({ className }: FeaturesProps) {
  return (
    <section
      className={`${styles.features} ${className || ''}`}
      aria-labelledby="features-heading"
    >
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 id="features-heading" className={styles.title}>
            Why You&apos;ll Love PEAAI
          </h2>
          <p className={styles.subtitle}>
            More than an AI chatbot — a companion that brings joy to every conversation.
          </p>
        </header>
        <div className={styles.grid}>
          {features.map((feature) => (
            <Card key={feature.id} variant="outlined" padding="lg" className={styles.card}>
              <CardBody>
                <div className={styles.icon} aria-hidden="true">
                  {feature.icon}
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
