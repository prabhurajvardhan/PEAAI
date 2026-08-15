/**
 * PEAAI Users Service
 * Handles user profile management
 */

import { api } from './api-client';
import { API_CONFIG } from './api-config';
import type {
  UserResponse,
  UserUpdate,
  UserListResponse,
  PaginationParams,
} from './api-types';

export class UsersService {
  /**
   * Get current user's profile
   */
  async getCurrentUser(): Promise<UserResponse> {
    return api.get<UserResponse>(API_CONFIG.endpoints.users.me);
  }

  /**
   * Get a user by ID
   */
  async getUser(userId: string): Promise<UserResponse> {
    return api.get<UserResponse>(API_CONFIG.endpoints.users.get(userId));
  }

  /**
   * Update a user
   */
  async updateUser(userId: string, data: UserUpdate): Promise<UserResponse> {
    return api.put<UserResponse>(API_CONFIG.endpoints.users.update(userId), data);
  }

  /**
   * Delete a user (soft delete)
   */
  async deleteUser(userId: string): Promise<void> {
    return api.delete(API_CONFIG.endpoints.users.delete(userId));
  }

  /**
   * List users (admin endpoint)
   */
  async listUsers(params?: PaginationParams & { search?: string }): Promise<UserListResponse> {
    return api.get<UserListResponse>(API_CONFIG.endpoints.users.list, { 
      params: params as Record<string, string | number | boolean | undefined> 
    });
  }
}

// Singleton instance
export const usersService = new UsersService();
export default usersService;
