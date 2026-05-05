// src/services/platform/platformDashboard.service.ts
import { platformAxios } from './platformAxios';
import {
  DashboardSummary,
  RevenueTrendItem,
  PlanBreakdownItem,
} from '@/types/console.types';

export const platformDashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const { data } = await platformAxios.get('/dashboard/summary');
    return data;
  },

  async getRevenueTrend(months: number = 8): Promise<RevenueTrendItem[]> {
    const { data } = await platformAxios.get('/dashboard/revenue-trend', {
      params: { months },
    });
    return data;
  },

  async getPlanBreakdown(): Promise<PlanBreakdownItem[]> {
    const { data } = await platformAxios.get('/dashboard/plan-breakdown');
    return data;
  },
};
