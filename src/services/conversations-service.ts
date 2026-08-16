/**
 * PEAAI Conversations Service
 * Handles conversation and message management
 */

import { api } from './api-client';
import { API_CONFIG } from './api-config';
import type {
  ConversationResponse,
  ConversationCreate,
  ConversationUpdate,
  ConversationListResponse,
  ConversationFilterParams,
  MessageResponse,
  MessageCreate,
  MessageListResponse,
  PaginationParams,
} from './api-types';

export class ConversationsService {
  /**
   * List conversations for the current user
   */
  async listConversations(params?: ConversationFilterParams): Promise<ConversationListResponse> {
    return api.get<ConversationListResponse>(API_CONFIG.endpoints.conversations.list, { 
      params: params as Record<string, string | number | boolean | undefined> 
    });
  }

  /**
   * Get a conversation by ID
   */
  async getConversation(conversationId: string): Promise<ConversationResponse> {
    return api.get<ConversationResponse>(
      API_CONFIG.endpoints.conversations.get(conversationId)
    );
  }

  /**
   * Create a new conversation
   */
  async createConversation(data: ConversationCreate): Promise<ConversationResponse> {
    return api.post<ConversationResponse>(
      API_CONFIG.endpoints.conversations.create,
      data
    );
  }

  /**
   * Update a conversation
   */
  async updateConversation(
    conversationId: string,
    data: ConversationUpdate
  ): Promise<ConversationResponse> {
    return api.put<ConversationResponse>(
      API_CONFIG.endpoints.conversations.update(conversationId),
      data
    );
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    return api.delete(API_CONFIG.endpoints.conversations.delete(conversationId));
  }

  /**
   * List messages in a conversation
   */
  async listMessages(
    conversationId: string,
    params?: PaginationParams
  ): Promise<MessageListResponse> {
    return api.get<MessageListResponse>(
      API_CONFIG.endpoints.conversations.messages(conversationId),
      { params: params as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Create a new message in a conversation
   */
  async createMessage(conversationId: string, data: Omit<MessageCreate, 'conversation_id'>): Promise<MessageResponse> {
    return api.post<MessageResponse>(
      API_CONFIG.endpoints.conversations.createMessage(conversationId),
      { ...data, conversation_id: conversationId }
    );
  }
}

// Singleton instance
export const conversationsService = new ConversationsService();
export default conversationsService;
