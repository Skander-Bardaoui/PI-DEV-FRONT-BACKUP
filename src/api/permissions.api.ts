// src/api/permissions.api.ts

import axiosInstance from './axiosInstance';
import {
  BusinessMember,
  UpdatePermissionsDto,
} from '../types/permissions.types';

/**
 * API client for permission management operations
 */
export const permissionsApi = {
  /**
   * Update member permissions
   * @param businessId - The business ID
   * @param userId - The user ID to update permissions for
   * @param collaboration_permissions - The new collaboration permissions object
   * @param stock_permissions - The new stock permissions object
   * @param payment_permissions - The new payment permissions object
   * @param sales_permissions - The new sales permissions object
   * @param purchase_permissions - The new purchase permissions object
   * @returns The updated business member
   */
  async updateMemberPermissions(
    businessId: string,
    userId: string,
    collaboration_permissions: UpdatePermissionsDto['collaboration_permissions'],
    stock_permissions: UpdatePermissionsDto['stock_permissions'],
    payment_permissions: UpdatePermissionsDto['payment_permissions'],
    sales_permissions: UpdatePermissionsDto['sales_permissions'],
    purchase_permissions: UpdatePermissionsDto['purchase_permissions'],
  ): Promise<BusinessMember> {
    const body: UpdatePermissionsDto = {
      collaboration_permissions,
      stock_permissions,
      payment_permissions,
      sales_permissions,
      purchase_permissions,
    };
    
    const response = await axiosInstance.patch<BusinessMember>(
      `/businesses/${businessId}/members/${userId}/permissions`,
      body,
    );
    return response.data;
  },

  /**
   * Get business members (for fetching current permissions)
   * @param businessId - The business ID
   * @returns Array of business members
   */
  async getBusinessMembers(businessId: string): Promise<BusinessMember[]> {
    const response = await axiosInstance.get<BusinessMember[]>(
      `/businesses/${businessId}/members`,
    );
    return response.data;
  },

  /**
   * Get a specific business member
   * @param businessId - The business ID
   * @param userId - The user ID
   * @returns The business member
   */
  async getBusinessMember(
    businessId: string,
    userId: string,
  ): Promise<BusinessMember> {
    const response = await axiosInstance.get<BusinessMember>(
      `/businesses/${businessId}/members/${userId}`,
    );
    return response.data;
  },
};
