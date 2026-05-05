// src/services/platform/platformSupport.service.ts
import { platformAxios } from './platformAxios';
import { SupportTicket, PaginatedResponse } from '@/types/console.types';

export const platformSupportService = {
  async listTickets(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    tenantId?: string;
    assignedToId?: string;
  }): Promise<PaginatedResponse<SupportTicket>> {
    const { data } = await platformAxios.get('/support/tickets', { params });
    return data;
  },

  async updateTicket(
    id: string,
    updates: {
      status?: string;
      priority?: string;
      assigned_to_id?: string;
    }
  ): Promise<SupportTicket> {
    const { data } = await platformAxios.patch(`/support/tickets/${id}`, updates);
    return data;
  },

  async replyToTicket(id: string, message: string): Promise<void> {
    await platformAxios.post(`/support/tickets/${id}/reply`, { message });
  },
};
