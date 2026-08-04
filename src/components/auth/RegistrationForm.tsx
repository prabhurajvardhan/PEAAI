/**
 * Registration Form Component
 * User registration form with validation and error handling
 */

import React, { useState, useCallback } from 'react';
import { Button, Input, Card, CardBody, CardFooter } from '../../foundation/components';
import type { RegistrationData } from './types';

export interface RegistrationFormProps {
  onSubmit: (data: RegistrationData) => Promise<void>;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
  error?: string | null;
}

interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  displayName?: string;
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

const validateUsername = (username: string): string | undefined => {
  if (!username) {
    return 'Username is required';
  }
  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (username.length > 100) {
    return 'Username must be less than 100 characters';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  return undefined;
};

const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least one digit';
  }
  return undefined;
};

const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
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

const hintStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--color-text-secondary)',
  marginTop: '-0.5rem',
};

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSubmit,
  onSwitchToLogin,
  isLoading = false,
  error = null,
}) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {
      email: validateEmail(email),
      username: validateUsername(username),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };

    setErrors(newErrors);
    return !newErrors.email && !newErrors.username && !newErrors.password && !newErrors.confirmPassword;
  }, [email, username, password, confirmPassword]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      setTouched({
        email: true,
        username: true,
        password: true,
        confirmPassword: true,
      });
      
      if (!validateForm()) {
        return;
      }

      try {
        await onSubmit({
          email,
          username,
          password,
          displayName: displayName || undefined,
        });
      } catch {
        // Error is handled by parent component
      }
    },
    [email, username, password, confirmPassword, displayName, onSubmit, validateForm]
  );

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    switch (field) {
      case 'email':
        setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
        break;
      case 'username':
        setErrors((prev) => ({ ...prev, username: validateUsername(username) }));
        break;
      case 'password':
        setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
        break;
      case 'confirmPassword':
        setErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(password, confirmPassword) }));
        break;
    }
  }, [email, username, password, confirmPassword]);

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
            Create Account
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
              type="text"
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => handleBlur('username')}
              error={touched.username ? errors.username : undefined}
              autoComplete="username"
              required
              fullWidth
              disabled={isLoading}
            />

            <Input
              type="text"
              label="Display Name"
              placeholder="Your display name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              fullWidth
              disabled={isLoading}
            />

            <div>
              <Input
                type="password"
                label="Password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                error={touched.password ? errors.password : undefined}
                autoComplete="new-password"
                required
                fullWidth
                disabled={isLoading}
              />
              <div style={hintStyles}>
                At least 8 characters with uppercase, lowercase, and digit
              </div>
            </div>

            <Input
              type="password"
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              error={touched.confirmPassword ? errors.confirmPassword : undefined}
              autoComplete="new-password"
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
              Create Account
            </Button>
          </form>
        </CardBody>

        <CardFooter bordered={false} style={{ justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: '0.25rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Already have an account?
            </span>
            <span
              style={linkStyles}
              onClick={onSwitchToLogin}
              onKeyDown={(e) => e.key === 'Enter' && onSwitchToLogin()}
              role="button"
              tabIndex={0}
            >
              Sign in
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
