/**
 * PEAAI API Configuration
 * Environment-based configuration for API base URL
 */

// TypeScript declaration for Vite environment variables
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Get API base URL from environment variable
// Fallback to localhost for local development
const getApiBaseUrl = (): string => {
  // Check for Vite environment variable
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Fallback for development without Vite
  if (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) {
    return process.env.VITE_API_BASE_URL;
  }
  
  // Default to localhost for local development
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// Full API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: `${API_PREFIX}/auth/login`,
    register: `${API_PREFIX}/auth/register`,
    logout: `${API_PREFIX}/auth/logout`,
    refresh: `${API_PREFIX}/auth/refresh`,
    me: `${API_PREFIX}/auth/me`,
    passwordReset: `${API_PREFIX}/auth/password-reset`,
    passwordResetConfirm: `${API_PREFIX}/auth/password-reset/confirm`,
  },
  
  // User endpoints
  users: {
    list: `${API_PREFIX}/users`,
    me: `${API_PREFIX}/users/me`,
    get: (userId: string) => `${API_PREFIX}/users/${userId}`,
    update: (userId: string) => `${API_PREFIX}/users/${userId}`,
    delete: (userId: string) => `${API_PREFIX}/users/${userId}`,
  },
  
  // Conversation endpoints
  conversations: {
    list: `${API_PREFIX}/conversations`,
    create: `${API_PREFIX}/conversations`,
    get: (conversationId: string) => `${API_PREFIX}/conversations/${conversationId}`,
    update: (conversationId: string) => `${API_PREFIX}/conversations/${conversationId}`,
    delete: (conversationId: string) => `${API_PREFIX}/conversations/${conversationId}`,
    messages: (conversationId: string) => `${API_PREFIX}/conversations/${conversationId}/messages`,
    createMessage: (conversationId: string) => `${API_PREFIX}/conversations/${conversationId}/messages`,
  },
  
  // Memory endpoints
  memories: {
    list: `${API_PREFIX}/memories`,
    create: `${API_PREFIX}/memories`,
    get: (memoryId: string) => `${API_PREFIX}/memories/${memoryId}`,
    update: (memoryId: string) => `${API_PREFIX}/memories/${memoryId}`,
    delete: (memoryId: string) => `${API_PREFIX}/memories/${memoryId}`,
    search: `${API_PREFIX}/memories/search`,
    related: (conversationId: string) => `${API_PREFIX}/memories/${conversationId}/related`,
  },
  
  // Session endpoints
  sessions: {
    list: `${API_PREFIX}/sessions`,
    get: (sessionId: string) => `${API_PREFIX}/sessions/${sessionId}`,
    delete: (sessionId: string) => `${API_PREFIX}/sessions/${sessionId}`,
  },
  
  // WebSocket endpoint
  websocket: {
    main: '/ws/',
    chat: (roomId: string) => `/ws/chat/${roomId}`,
  },
  
  // Health check
  health: '/health',
  apiInfo: `${API_PREFIX}`,
} as const;

// Token storage keys
export const TOKEN_STORAGE_KEYS = {
  accessToken: 'peaai_access_token',
  refreshToken: 'peaai_refresh_token',
  tokenExpiry: 'peaai_token_expiry',
} as const;

// API configuration
export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  prefix: API_PREFIX,
  endpoints: API_ENDPOINTS,
  tokenStorageKeys: TOKEN_STORAGE_KEYS,
  // Default request timeout in milliseconds
  timeout: 30000,
  // Maximum retry attempts for failed requests
  maxRetries: 3,
} as const;

export default API_CONFIG;
