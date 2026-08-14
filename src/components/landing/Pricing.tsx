import React from 'react';
import { Button } from '../../foundation/components';
import { Card, CardBody, CardHeader, CardFooter } from '../../foundation/components';
import styles from './Pricing.module.css';

export interface PricingProps {
  className?: string;
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      '1 AI Companion',
      'Basic expressions',
      '5 story sessions per day',
      'Community support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For those who want more',
    features: [
      'Unlimited AI Companions',
      'Premium expressions',
      'Unlimited story sessions',
      'Priority support',
      'Early access to new features',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: '$29',
    period: '/month',
    description: 'For families and groups',
    features: [
      'Everything in Pro',
      'Up to 5 team members',
      'Shared stories',
      'Team management',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export function Pricing({ className }: PricingProps) {
  return (
    <section
      className={`${styles.pricing} ${className || ''}`}
      aria-labelledby="pricing-heading"
    >
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 id="pricing-heading" className={styles.title}>
            Simple, Transparent Pricing
          </h2>
          <p className={styles.subtitle}>
            Start free, upgrade when you&apos;re ready. No hidden fees.
          </p>
        </header>
        <div className={styles.grid}>
          {plans.map((plan) => (
            <Card
              key={plan.id}
              variant={plan.popular ? 'elevated' : 'outlined'}
              padding="none"
              className={`${styles.plan} ${plan.popular ? styles.popular : ''}`}
            >
              {plan.popular && (
                <div className={styles.badge} aria-label="Most popular plan">
                  Most Popular
                </div>
              )}
              <CardHeader align="center" className={styles.planHeader}>
                <h3 className={styles.planName}>{plan.name}</h3>
                <p className={styles.planDescription}>{plan.description}</p>
              </CardHeader>
              <CardBody className={styles.planBody}>
                <div className={styles.priceContainer}>
                  <span className={styles.price}>{plan.price}</span>
                  <span className={styles.period}>{plan.period}</span>
                </div>
                <ul className={styles.features} role="list">
                  {plan.features.map((feature, index) => (
                    <li key={index} className={styles.feature}>
                      <svg
                        aria-hidden="true"
                        className={styles.checkIcon}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardBody>
              <CardFooter className={styles.planFooter}>
                <Button
                  variant={plan.popular ? 'primary' : 'secondary'}
                  fullWidth
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <p className={styles.guarantee}>
          <svg aria-hidden="true" className={styles.shieldIcon} viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z"
              clipRule="evenodd"
            />
          </svg>
          14-day money-back guarantee on all paid plans
        </p>
      </div>
    </section>
  );
}

export default Pricing;
