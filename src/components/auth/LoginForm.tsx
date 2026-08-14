/**
 * Login Form Component
 * User login form with validation and error handling
 */

import React, { useState, useCallback } from 'react';
import { Button, Input, Card, CardBody, CardFooter } from '../../foundation/components';
import type { LoginCredentials } from './types';

export interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  onSwitchToRegister: () => void;
  onSwitchToReset: () => void;
  isLoading?: boolean;
  error?: string | null;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const validateEmail = (email: string): string | undefined => {
  if (!email) {
    return 'Email is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return undefined;
};

const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return 'Password is required';
  }
  return undefined;
};

const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  maxWidth: '400px',
};

const formStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  width: '100%',
};

const errorStyles: React.CSSProperties = {
  padding: '0.75rem',
  backgroundColor: 'var(--color-error)',
  color: 'white',
  borderRadius: 'var(--border-radius)',
  fontSize: '0.875rem',
  textAlign: 'center',
};

const linkStyles: React.CSSProperties = {
  color: 'var(--color-primary)',
  cursor: 'pointer',
  textDecoration: 'none',
  fontSize: '0.875rem',
  transition: 'color 0.2s',
};

const linkContainerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '1rem',
  marginTop: '0.5rem',
};

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onSwitchToRegister,
  onSwitchToReset,
  isLoading = false,
  error = null,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  }, [email, password]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      setTouched({ email: true, password: true });
      
      if (!validateForm()) {
        return;
      }

      try {
        await onSubmit({ email, password });
      } catch {
        // Error is handled by parent component
      }
    },
    [email, password, onSubmit, validateForm]
  );

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (field === 'email') {
      setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
    } else if (field === 'password') {
      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
    }
  }, [email, password]);

  return (
    <div style={containerStyles}>
      <Card variant="elevated" padding="lg" style={{ width: '100%' }}>
        <CardBody>
          <h2
            style={{
              margin: '0 0 1.5rem 0',
              fontSize: '1.5rem',
              fontWeight: '600',
              textAlign: 'center',
              color: 'var(--color-text-primary)',
            }}
          >
            Welcome Back
          </h2>

          {error && <div style={errorStyles}>{error}</div>}

          <form onSubmit={handleSubmit} style={formStyles} noValidate>
            <Input
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              error={touched.email ? errors.email : undefined}
              autoComplete="email"
              required
              fullWidth
              disabled={isLoading}
            />

            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              error={touched.password ? errors.password : undefined}
              autoComplete="current-password"
              required
              fullWidth
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isLoading}
              style={{ marginTop: '0.5rem' }}
            >
              Sign In
            </Button>
          </form>
        </CardBody>

        <CardFooter bordered={false} style={{ justifyContent: 'center' }}>
          <div style={linkContainerStyles}>
            <span
              style={linkStyles}
              onClick={onSwitchToRegister}
              onKeyDown={(e) => e.key === 'Enter' && onSwitchToRegister()}
              role="button"
              tabIndex={0}
            >
              Create account
            </span>
            <span style={{ color: 'var(--color-text-secondary)' }}>|</span>
            <span
              style={linkStyles}
              onClick={onSwitchToReset}
              onKeyDown={(e) => e.key === 'Enter' && onSwitchToReset()}
              role="button"
              tabIndex={0}
            >
              Forgot password?
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
