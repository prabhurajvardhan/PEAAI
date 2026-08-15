/**
 * PEAAI Authentication Service
 * Handles user authentication and token management
 */

import { api, tokenManager } from './api-client';
import { API_CONFIG } from './api-config';
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserProfileResponse,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  UserResponse,
} from './api-types';

export class AuthService {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<UserProfileResponse> {
    const response = await api.post<UserProfileResponse>(
      API_CONFIG.endpoints.auth.login,
      credentials,
      { skipAuth: true }
    );
    
    // Store tokens
    tokenManager.setTokens(
      response.access_token,
      response.refresh_token,
      response.expires_in
    );
    
    return response;
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<UserProfileResponse> {
    const response = await api.post<UserProfileResponse>(
      API_CONFIG.endpoints.auth.register,
      data,
      { skipAuth: true }
    );
    
    // Store tokens
    tokenManager.setTokens(
      response.access_token,
      response.refresh_token,
      response.expires_in
    );
    
    return response;
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    try {
      await api.post(API_CONFIG.endpoints.auth.logout, undefined);
    } catch {
      // Ignore errors - we still want to clear local tokens
    } finally {
      tokenManager.clearTokens();
    }
  }

  /**
   * Get the currently authenticated user
   */
  async getCurrentUser(): Promise<UserResponse> {
    return api.get<UserResponse>(API_CONFIG.endpoints.auth.me);
  }

  /**
   * Refresh the access token
   */
  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<TokenResponse>(
      API_CONFIG.endpoints.auth.refresh,
      { refresh_token: refreshToken },
      { skipAuth: true }
    );

    // Update stored tokens
    tokenManager.setTokens(
      response.access_token,
      response.refresh_token,
      response.expires_in
    );

    return response;
  }

  /**
   * Request a password reset
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    await api.post(API_CONFIG.endpoints.auth.passwordReset, data, { skipAuth: true });
  }

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(data: PasswordResetConfirmRequest): Promise<void> {
    await api.post(API_CONFIG.endpoints.auth.passwordResetConfirm, data, { skipAuth: true });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated();
  }

  /**
   * Get the current access token
   */
  getAccessToken(): string | null {
    return tokenManager.getAccessToken();
  }

  /**
   * Clear all authentication data
   */
  clearAuth(): void {
    tokenManager.clearTokens();
  }
}

// Singleton instance
export const authService = new AuthService();
export default authService;
