/**
 * Authentication Hook
 * Manages authentication state and provides auth methods
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  LoginCredentials,
  RegistrationData,
  PasswordResetRequest,
  User,
  AuthState,
  AuthError,
} from './types';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  refreshToken as apiRefreshToken,
  requestPasswordReset as apiRequestPasswordReset,
  confirmPasswordReset as apiConfirmPasswordReset,
  getCurrentUser,
  setStoredTokens,
  clearStoredTokens,
  getStoredTokens,
  AuthApiError,
} from './api';

interface UseAuthReturn extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const setError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, error, isLoading: false }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const handleAuthError = useCallback((error: unknown): string => {
    if (error instanceof AuthApiError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true);
    clearError();

    try {
      const tokens = await apiLogin(credentials);
      setStoredTokens(tokens);
      
      const { user } = await getCurrentUser();
      setState({
        user: user as User,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setError(handleAuthError(error));
      throw error;
    }
  }, [setLoading, clearError, setError, handleAuthError]);

  const register = useCallback(async (data: RegistrationData) => {
    setLoading(true);
    clearError();

    try {
      const response = await apiRegister(data);
      setStoredTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        tokenType: response.tokenType,
        expiresIn: response.expiresIn,
      });

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setError(handleAuthError(error));
      throw error;
    }
  }, [setLoading, clearError, setError, handleAuthError]);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore logout errors - we still want to clear local state
    } finally {
      clearStoredTokens();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    setLoading(true);
    clearError();

    try {
      await apiRequestPasswordReset({ email });
      setLoading(false);
    } catch (error) {
      setError(handleAuthError(error));
      throw error;
    }
  }, [setLoading, clearError, setError, handleAuthError]);

  const confirmPasswordReset = useCallback(async (token: string, newPassword: string) => {
    setLoading(true);
    clearError();

    try {
      await apiConfirmPasswordReset(token, newPassword);
      setLoading(false);
    } catch (error) {
      setError(handleAuthError(error));
      throw error;
    }
  }, [setLoading, clearError, setError, handleAuthError]);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const tokens = getStoredTokens();
      
      if (!tokens.accessToken) {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        return;
      }

      try {
        const { user } = await getCurrentUser();
        setState({
          user: user as User,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch {
        // Token expired - try to refresh
        if (tokens.refreshToken) {
          try {
            const newTokens = await apiRefreshToken(tokens.refreshToken);
            setStoredTokens(newTokens);
            
            const { user } = await getCurrentUser();
            setState({
              user: user as User,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch {
            // Refresh failed - clear session
            clearStoredTokens();
            setState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        } else {
          clearStoredTokens();
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      }
    };

    checkAuth();
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    requestPasswordReset,
    confirmPasswordReset,
    clearError,
  };
}
