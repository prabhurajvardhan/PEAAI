/**
 * PEAAI API Client
 * Core HTTP client with authentication support
 */

import { API_CONFIG, TOKEN_STORAGE_KEYS } from './api-config';
import type { APIError } from './api-types';

// Custom error class for API errors
export class APIException extends Error {
  statusCode: number;
  error: string;
  detail?: string;

  constructor(message: string, statusCode: number, error?: string, detail?: string) {
    super(message);
    this.name = 'APIException';
    this.statusCode = statusCode;
    this.error = error || 'unknown_error';
    this.detail = detail;
  }
}

// Token management
export class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage(): void {
    try {
      this.accessToken = localStorage.getItem(TOKEN_STORAGE_KEYS.accessToken);
      this.refreshToken = localStorage.getItem(TOKEN_STORAGE_KEYS.refreshToken);
      const expiryStr = localStorage.getItem(TOKEN_STORAGE_KEYS.tokenExpiry);
      this.tokenExpiry = expiryStr ? parseInt(expiryStr, 10) : null;
    } catch (e) {
      // localStorage may not be available in some environments
      console.warn('Could not load tokens from storage:', e);
    }
  }

  setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + expiresIn * 1000;

    try {
      localStorage.setItem(TOKEN_STORAGE_KEYS.accessToken, accessToken);
      localStorage.setItem(TOKEN_STORAGE_KEYS.refreshToken, refreshToken);
      localStorage.setItem(TOKEN_STORAGE_KEYS.tokenExpiry, this.tokenExpiry.toString());
    } catch (e) {
      console.warn('Could not save tokens to storage:', e);
    }
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    try {
      localStorage.removeItem(TOKEN_STORAGE_KEYS.accessToken);
      localStorage.removeItem(TOKEN_STORAGE_KEYS.refreshToken);
      localStorage.removeItem(TOKEN_STORAGE_KEYS.tokenExpiry);
    } catch (e) {
      console.warn('Could not clear tokens from storage:', e);
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true;
    // Add 60 second buffer before actual expiry
    return Date.now() >= this.tokenExpiry - 60000;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !this.isTokenExpired();
  }
}

// Global token manager instance
export const tokenManager = new TokenManager();

// HTTP Methods
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
}

// Build full URL with query parameters
const buildUrl = (endpoint: string, params?: Record<string, string | number | boolean | undefined>): string => {
  const url = new URL(endpoint, API_CONFIG.baseUrl);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.toString();
};

// Parse error response
const parseError = async (response: Response): Promise<APIException> => {
  let errorMessage = `HTTP Error: ${response.status}`;
  let errorDetail: string | undefined;
  let errorCode = 'http_error';

  try {
    const errorData = await response.json() as APIError;
    errorMessage = errorData.detail || errorData.error || errorMessage;
    errorCode = errorData.error || errorCode;
    errorDetail = errorData.detail;
  } catch {
    // Response body is not JSON
    errorMessage = response.statusText || errorMessage;
  }

  return new APIException(errorMessage, response.status, errorCode, errorDetail);
};

// Main request function
const request = async <T>(
  method: HttpMethod,
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { params, skipAuth = false, body, ...fetchOptions } = options;
  
  const url = buildUrl(endpoint, params);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add authorization header if not skipped
  if (!skipAuth && tokenManager.isAuthenticated()) {
    const token = tokenManager.getAccessToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    method,
    headers,
    ...fetchOptions,
  };

  // Add body for non-GET requests
  if (method !== 'GET' && body) {
    config.body = typeof body === 'string' 
      ? body 
      : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    // Handle error responses
    if (!response.ok) {
      const error = await parseError(response);
      
      // If 401 and not already trying to refresh, attempt token refresh
      if (error.statusCode === 401 && !skipAuth && tokenManager.getRefreshToken()) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          // Retry the original request
          return request<T>(method, endpoint, options);
        }
      }
      
      throw error;
    }

    return await response.json() as T;
  } catch (error) {
    if (error instanceof APIException) {
      throw error;
    }
    // Network or other errors
    throw new APIException(
      error instanceof Error ? error.message : 'Network error',
      0,
      'network_error'
    );
  }
};

// Token refresh function
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const refreshAccessToken = async (): Promise<boolean> => {
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshSubscribers.push((token: string) => {
        resolve(true);
      });
    });
  }

  isRefreshing = true;
  const refreshToken = tokenManager.getRefreshToken();

  if (!refreshToken) {
    isRefreshing = false;
    return false;
  }

  try {
    const response = await fetch(buildUrl(API_CONFIG.endpoints.auth.refresh), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      tokenManager.clearTokens();
      isRefreshing = false;
      refreshSubscribers = [];
      return false;
    }

    const data = await response.json();
    tokenManager.setTokens(data.access_token, data.refresh_token, data.expires_in);
    
    // Notify all waiting requests
    refreshSubscribers.forEach((callback) => callback(data.access_token));
    refreshSubscribers = [];
    isRefreshing = false;
    return true;
  } catch {
    tokenManager.clearTokens();
    isRefreshing = false;
    refreshSubscribers = [];
    return false;
  }
};

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>('GET', endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, body: unknown, options?: RequestOptions) => 
    request<T>('POST', endpoint, { ...options, method: 'POST', body } as RequestOptions),
  
  put: <T>(endpoint: string, body: unknown, options?: RequestOptions) => 
    request<T>('PUT', endpoint, { ...options, method: 'PUT', body } as RequestOptions),
  
  patch: <T>(endpoint: string, body: unknown, options?: RequestOptions) => 
    request<T>('PATCH', endpoint, { ...options, method: 'PATCH', body } as RequestOptions),
  
  delete: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>('DELETE', endpoint, { ...options, method: 'DELETE' }),
};

export default api;
