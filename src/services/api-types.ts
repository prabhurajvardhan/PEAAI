/**
 * PEAAI API Type Definitions
 * TypeScript interfaces matching the backend API schemas
 */

// User Types
export interface UserResponse {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  bio: string | null;
}

export interface UserUpdate {
  email?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  preferences?: string;
}

export interface UserListResponse {
  items: UserResponse[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  display_name?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserProfileResponse extends UserResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  new_password: string;
}

// Conversation Types
export type MessageRoleEnum = 'user' | 'assistant' | 'system';

export interface MessageResponse {
  id: string;
  conversation_id: string;
  role: MessageRoleEnum;
  content: string;
  sequence_number: number;
  created_at: string;
  meta: Record<string, unknown> | null;
}

export interface MessageCreate {
  content: string;
  role: MessageRoleEnum;
  conversation_id: string;
}

export interface MessageListResponse {
  items: MessageResponse[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export type ConversationMode = 'companion' | 'story';

export interface ConversationResponse {
  id: string;
  user_id: string;
  title: string;
  mode: ConversationMode;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  message_count: number;
  messages?: MessageResponse[];
}

export interface ConversationCreate {
  title: string;
  mode?: ConversationMode;
}

export interface ConversationUpdate {
  title?: string;
  mode?: ConversationMode;
  is_active?: boolean;
}

export interface ConversationListResponse {
  items: ConversationResponse[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

// Memory Types
export type MemoryTypeEnum = 'user_preference' | 'user_fact' | 'relationship' | 'conversation_summary' | 'context' | 'long_term';
export type MemoryImportanceEnum = 'low' | 'medium' | 'high' | 'critical';

export interface MemoryResponse {
  id: string;
  user_id: string;
  conversation_id: string | null;
  memory_type: MemoryTypeEnum;
  content: string;
  summary: string | null;
  importance: MemoryImportanceEnum;
  relevance_score: number;
  access_count: number;
  last_accessed: string | null;
  is_pinned: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  tags: string[] | null;
  meta: Record<string, unknown> | null;
}

export interface MemoryCreate {
  memory_type: MemoryTypeEnum;
  content: string;
  summary?: string;
  importance?: MemoryImportanceEnum;
  is_pinned?: boolean;
  tags?: string[];
  metadata?: Record<string, unknown>;
  conversation_id?: string;
}

export interface MemoryUpdate {
  content?: string;
  summary?: string;
  importance?: MemoryImportanceEnum;
  is_pinned?: boolean;
  is_active?: boolean;
  tags?: string[];
  meta?: Record<string, unknown>;
}

export interface MemoryListResponse {
  items: MemoryResponse[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

// Session Types
export interface SessionResponse {
  session_id: string;
  user_id: string;
  created_at: string;
  last_accessed: string;
  expires_at: string;
  user_agent: string | null;
  ip_address: string | null;
  is_current: boolean;
}

export interface SessionListResponse {
  sessions: SessionResponse[];
  total: number;
  max_concurrent: number;
}

// API Error Types
export interface APIError {
  error: string;
  detail?: string;
}

// Pagination Types
export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface ConversationFilterParams extends PaginationParams {
  mode?: ConversationMode;
  is_active?: boolean;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  data?: unknown;
}

export interface WebSocketAuthMessage extends WebSocketMessage {
  type: 'auth';
  data: { token: string };
}

export interface WebSocketChatMessage extends WebSocketMessage {
  type: 'chat_message';
  data: { conversation_id: string; content: string };
}

export interface WebSocketTypingMessage extends WebSocketMessage {
  type: 'typing_start' | 'typing_stop';
  data: { conversation_id: string };
}
