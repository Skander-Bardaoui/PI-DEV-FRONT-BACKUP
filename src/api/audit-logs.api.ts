import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface AuditLog {
  id: string;
  business_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'PRINT' | 'EXPORT' | 'IMPORT';
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  performed_by: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  description: string | null;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogFilters {
  action?: string;
  entity_type?: string;
  performed_by?: string;
  start_date?: string;
  end_date?: string;
}

export const auditLogsApi = {
  getBusinessLogs: async (
    businessId: string,
    page: number = 1,
    limit: number = 50,
    filters?: AuditLogFilters,
  ): Promise<{ logs: AuditLog[]; total: number }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters?.action) params.append('action', filters.action);
    if (filters?.entity_type) params.append('entity_type', filters.entity_type);
    if (filters?.performed_by) params.append('performed_by', filters.performed_by);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const response = await axios.get(
      `${API_URL}/businesses/${businessId}/audit-logs?${params}`,
      { withCredentials: true },
    );
    return response.data;
  },

  getEntityLogs: async (
    businessId: string,
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> => {
    const response = await axios.get(
      `${API_URL}/businesses/${businessId}/audit-logs/entity/${entityType}/${entityId}`,
      { withCredentials: true },
    );
    return response.data;
  },

  getRecentActivity: async (businessId: string, limit: number = 20): Promise<AuditLog[]> => {
    const response = await axios.get(
      `${API_URL}/businesses/${businessId}/audit-logs/recent?limit=${limit}`,
      { withCredentials: true },
    );
    return response.data;
  },
};
