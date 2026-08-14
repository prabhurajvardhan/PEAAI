/**
 * Authentication Page
 * Main container for all authentication forms
 */

import React, { useState, useCallback } from 'react';
import { LoginForm } from '../../components/auth/LoginForm';
import { RegistrationForm } from '../../components/auth/RegistrationForm';
import { PasswordResetForm } from '../../components/auth/PasswordResetForm';
import { Spinner } from '../../foundation/components';
import { useAuth } from '../../components/auth/useAuth';
import type { AuthFormMode } from '../../components/auth/types';

const pageStyles: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  backgroundColor: 'var(--color-surface)',
};

const loadingStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
};

const logoStyles: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: '700',
  color: 'var(--color-primary)',
  marginBottom: '1.5rem',
  textAlign: 'center' as const,
};

const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
};

export const AuthPage: React.FC = () => {
  const {
    login,
    register,
    requestPasswordReset,
    confirmPasswordReset,
    isLoading,
    error,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<AuthFormMode>('login');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSwitchToRegister = useCallback(() => {
    clearError();
    setSuccessMessage(null);
    setMode('register');
  }, [clearError]);

  const handleSwitchToLogin = useCallback(() => {
    clearError();
    setSuccessMessage(null);
    setMode('login');
  }, [clearError]);

  const handleSwitchToReset = useCallback(() => {
    clearError();
    setSuccessMessage(null);
    setMode('reset-request');
  }, [clearError]);

  const handleLogin = useCallback(
    async (credentials: { email: string; password: string }) => {
      await login(credentials);
    },
    [login]
  );

  const handleRegister = useCallback(
    async (data: { email: string; username: string; password: string; displayName?: string }) => {
      await register(data);
    },
    [register]
  );

  const handleRequestReset = useCallback(
    async (email: string) => {
      await requestPasswordReset(email);
      setSuccessMessage('If an account exists with this email, you will receive a password reset link.');
    },
    [requestPasswordReset]
  );

  const handleConfirmReset = useCallback(
    async (token: string, newPassword: string) => {
      await confirmPasswordReset(token, newPassword);
      setSuccessMessage('Your password has been reset successfully.');
      setTimeout(() => {
        setMode('login');
        setSuccessMessage(null);
      }, 2000);
    },
    [confirmPasswordReset]
  );

  // Get token from URL if present (for password reset confirmation)
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('token');
  const isConfirmMode = resetToken && mode === 'reset-request';

  if (isLoading && mode === 'login') {
    return (
      <div style={loadingStyles}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={pageStyles}>
      <div style={containerStyles}>
        <div style={logoStyles}>PEAAI</div>

        {mode === 'login' && (
          <LoginForm
            onSubmit={handleLogin}
            onSwitchToRegister={handleSwitchToRegister}
            onSwitchToReset={handleSwitchToReset}
            isLoading={isLoading}
            error={error}
          />
        )}

        {mode === 'register' && (
          <RegistrationForm
            onSubmit={handleRegister}
            onSwitchToLogin={handleSwitchToLogin}
            isLoading={isLoading}
            error={error}
          />
        )}

        {(mode === 'reset-request' || isConfirmMode) && (
          <PasswordResetForm
            mode={isConfirmMode ? 'confirm' : 'request'}
            resetToken={resetToken || undefined}
            onSubmitRequest={handleRequestReset}
            onSubmitConfirm={handleConfirmReset}
            onSwitchToLogin={handleSwitchToLogin}
            isLoading={isLoading}
            error={error}
            successMessage={successMessage}
          />
        )}
      </div>
    </div>
  );
};
