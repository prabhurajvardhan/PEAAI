/**
 * Password Reset Form Component
 * Handles both password reset request and confirmation
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Button, Input, Card, CardBody, CardFooter } from '../../foundation/components';

export interface PasswordResetFormProps {
  mode: 'request' | 'confirm';
  resetToken?: string;
  onSubmitRequest: (email: string) => Promise<void>;
  onSubmitConfirm: (token: string, newPassword: string) => Promise<void>;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
  error?: string | null;
  successMessage?: string | null;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
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

const successStyles: React.CSSProperties = {
  padding: '0.75rem',
  backgroundColor: 'var(--color-success)',
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

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  mode,
  resetToken,
  onSubmitRequest,
  onSubmitConfirm,
  onSwitchToLogin,
  isLoading = false,
  error = null,
  successMessage = null,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset form when mode changes
  useEffect(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setTouched({});
  }, [mode]);

  const validateRequestForm = useCallback((): boolean => {
    const newErrors: FormErrors = {
      email: validateEmail(email),
    };
    setErrors(newErrors);
    return !newErrors.email;
  }, [email]);

  const validateConfirmForm = useCallback((): boolean => {
    const newErrors: FormErrors = {
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };
    setErrors(newErrors);
    return !newErrors.password && !newErrors.confirmPassword;
  }, [password, confirmPassword]);

  const handleSubmitRequest = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      setTouched({ email: true });
      
      if (!validateRequestForm()) {
        return;
      }

      try {
        await onSubmitRequest(email);
      } catch {
        // Error is handled by parent component
      }
    },
    [email, onSubmitRequest, validateRequestForm]
  );

  const handleSubmitConfirm = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      setTouched({ password: true, confirmPassword: true });
      
      if (!validateConfirmForm()) {
        return;
      }

      if (!resetToken) {
        return;
      }

      try {
        await onSubmitConfirm(resetToken, password);
      } catch {
        // Error is handled by parent component
      }
    },
    [resetToken, password, onSubmitConfirm, validateConfirmForm]
  );

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (mode === 'request') {
      if (field === 'email') {
        setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
      }
    } else {
      if (field === 'password') {
        setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
      } else if (field === 'confirmPassword') {
        setErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(password, confirmPassword) }));
      }
    }
  }, [mode, email, password]);

  if (mode === 'confirm') {
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
              Set New Password
            </h2>

            {error && <div style={errorStyles}>{error}</div>}
            {successMessage && <div style={successStyles}>{successMessage}</div>}

            <form onSubmit={handleSubmitConfirm} style={formStyles} noValidate>
              <div>
                <Input
                  type="password"
                  label="New Password"
                  placeholder="Enter new password"
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
                label="Confirm New Password"
                placeholder="Confirm new password"
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
                Reset Password
              </Button>
            </form>
          </CardBody>

          <CardFooter bordered={false} style={{ justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: '0.25rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                Remember your password?
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
  }

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
            Reset Password
          </h2>

          <p
            style={{
              margin: '0 0 1.5rem 0',
              color: 'var(--color-text-secondary)',
              textAlign: 'center',
              fontSize: '0.875rem',
            }}
          >
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {error && <div style={errorStyles}>{error}</div>}
          {successMessage && <div style={successStyles}>{successMessage}</div>}

          <form onSubmit={handleSubmitRequest} style={formStyles} noValidate>
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

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isLoading}
              style={{ marginTop: '0.5rem' }}
            >
              Send Reset Link
            </Button>
          </form>
        </CardBody>

        <CardFooter bordered={false} style={{ justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: '0.25rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Remember your password?
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
