/**
 * PEAAI Memories Service
 * Handles AI memory storage and retrieval
 */

import { api } from './api-client';
import { API_CONFIG } from './api-config';
import type {
  MemoryResponse,
  MemoryCreate,
  MemoryUpdate,
  MemoryListResponse,
  PaginationParams,
} from './api-types';

export interface MemorySearchParams extends PaginationParams {
  query?: string;
  memory_type?: string;
  importance?: string;
  tags?: string[];
  is_pinned?: boolean;
  is_active?: boolean;
}

export class MemoriesService {
  /**
   * List memories for the current user
   */
  async listMemories(params?: PaginationParams): Promise<MemoryListResponse> {
    return api.get<MemoryListResponse>(API_CONFIG.endpoints.memories.list, { 
      params: params as Record<string, string | number | boolean | undefined> 
    });
  }

  /**
   * Get a memory by ID
   */
  async getMemory(memoryId: string): Promise<MemoryResponse> {
    return api.get<MemoryResponse>(API_CONFIG.endpoints.memories.get(memoryId));
  }

  /**
   * Create a new memory
   */
  async createMemory(data: MemoryCreate): Promise<MemoryResponse> {
    return api.post<MemoryResponse>(API_CONFIG.endpoints.memories.create, data);
  }

  /**
   * Update a memory
   */
  async updateMemory(memoryId: string, data: MemoryUpdate): Promise<MemoryResponse> {
    return api.put<MemoryResponse>(API_CONFIG.endpoints.memories.update(memoryId), data);
  }

  /**
   * Delete a memory
   */
  async deleteMemory(memoryId: string): Promise<void> {
    return api.delete(API_CONFIG.endpoints.memories.delete(memoryId));
  }

  /**
   * Search memories
   */
  async searchMemories(params: MemorySearchParams): Promise<MemoryListResponse> {
    return api.post<MemoryListResponse>(API_CONFIG.endpoints.memories.search, params);
  }

  /**
   * Get memories related to a conversation
   */
  async getRelatedMemories(conversationId: string, params?: PaginationParams): Promise<MemoryListResponse> {
    return api.get<MemoryListResponse>(
      API_CONFIG.endpoints.memories.related(conversationId),
      { params: params as Record<string, string | number | boolean | undefined> }
    );
  }
}

// Singleton instance
export const memoriesService = new MemoriesService();
export default memoriesService;
