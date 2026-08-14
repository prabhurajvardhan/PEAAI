/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import type {
  LoginCredentials,
  RegistrationData,
  PasswordResetRequest,
  AuthTokens,
  AuthResponse,
} from './types';

// Use environment variable or default API URL
const getApiBaseUrl = (): string => {
  // Check for Vite environment variable
  if (typeof process !== 'undefined' && process.env?.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  // Default API URL for development
  return '/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

export class AuthApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    let errorCode = 'UNKNOWN_ERROR';
    let details: Array<{ field: string; message: string }> | undefined;

    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
      errorCode = errorData.code || errorCode;
      if (errorData.details) {
        details = errorData.details;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new AuthApiError(errorCode, errorMessage, response.status, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function login(credentials: LoginCredentials): Promise<AuthTokens> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  return handleResponse<AuthTokens>(response);
}

export async function register(data: RegistrationData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<AuthResponse>(response);
}

export async function logout(): Promise<void> {
  const token = localStorage.getItem('accessToken');
  if (!token) return;

  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse<void>(response);
}

export async function refreshToken(refreshToken: string): Promise<AuthTokens> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  return handleResponse<AuthTokens>(response);
}

export async function requestPasswordReset(data: PasswordResetRequest): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/password-reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<{ message: string }>(response);
}

export async function confirmPasswordReset(
  token: string,
  newPassword: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/password-reset/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      new_password: newPassword,
    }),
  });

  return handleResponse<{ message: string }>(response);
}

export async function getCurrentUser(): Promise<{ user: { id: string; email: string; username: string } }> {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new AuthApiError('UNAUTHORIZED', 'Not authenticated', 401);
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse<{ user: { id: string; email: string; username: string } }>(response);
}

export function getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  };
}

export function setStoredTokens(tokens: AuthTokens): void {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
}

export function clearStoredTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}
