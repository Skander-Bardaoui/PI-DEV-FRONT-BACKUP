// src/services/platform/platformAudit.service.ts
import { platformAxios } from './platformAxios';
import { AuditLog, PaginatedResponse, SystemHealth } from '@/types/console.types';

export const platformAuditService = {
  async listAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<AuditLog>> {
    const { data } = await platformAxios.get('/audit-log', { params });
    return data;
  },

  async getSystemHealth(): Promise<SystemHealth> {
    const { data } = await platformAxios.get('/system/health');
    return data;
  },
};
