// src/services/platform/platformTenants.service.ts
import { platformAxios } from './platformAxios';
import { Tenant, PaginatedResponse, TenantApproval } from '@/types/console.types';

export const platformTenantsService = {
  async listTenants(params?: {
    page?: number;
    limit?: number;
    status?: string;
    plan?: string;
    search?: string;
  }): Promise<PaginatedResponse<Tenant>> {
    const { data } = await platformAxios.get('/tenants', { params });
    return data;
  },

  async getTenant(id: string): Promise<Tenant> {
    const { data} = await platformAxios.get(`/tenants/${id}`);
    return data;
  },

  async getTenantDetail(id: string): Promise<any> {
    const { data } = await platformAxios.get(`/tenants/${id}`);
    return data;
  },

  async approveTenant(id: string): Promise<void> {
    await platformAxios.post(`/tenants/${id}/approve`);
  },

  async rejectTenant(id: string, reason: string): Promise<void> {
    await platformAxios.post(`/tenants/${id}/reject`, { reason });
  },

  async suspendTenant(id: string, reason?: string): Promise<void> {
    await platformAxios.post(`/tenants/${id}/suspend`, { reason });
  },

  async unsuspendTenant(id: string): Promise<void> {
    await platformAxios.post(`/tenants/${id}/unsuspend`);
  },

  async deleteTenant(id: string): Promise<void> {
    await platformAxios.delete(`/tenants/${id}`);
  },

  async exportTenantData(id: string, format: 'json' | 'csv' | 'excel' | 'sql' = 'json'): Promise<any> {
    const { data } = await platformAxios.get(`/tenants/${id}/export`, {
      params: { format },
    });
    return data;
  },

  async deleteTenantSecure(
    id: string,
    adminPassword: string,
    exportToken: string
  ): Promise<void> {
    console.log('[Frontend] Sending delete request with:', {
      id,
      hasPassword: !!adminPassword,
      hasToken: !!exportToken,
      passwordLength: adminPassword?.length,
      tokenLength: exportToken?.length,
    });
    
    try {
      // Use POST instead of DELETE to ensure body is properly sent
      await platformAxios.post(`/tenants/${id}/delete-secure`, {
        adminPassword,
        exportToken,
      });
      console.log('[Frontend] Delete request successful');
    } catch (error: any) {
      console.error('[Frontend] Delete request failed:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data,
      });
      throw error;
    }
  },

  async impersonateTenant(id: string): Promise<{ token: string }> {
    const { data } = await platformAxios.post(`/tenants/${id}/impersonate`);
    return data;
  },

  async getPendingApprovals(): Promise<TenantApproval[]> {
    const { data } = await platformAxios.get('/tenants', {
      params: { status: 'pending' },
    });
    return data.data || [];
  },
};
