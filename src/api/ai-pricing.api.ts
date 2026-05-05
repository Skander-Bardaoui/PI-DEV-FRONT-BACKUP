// src/api/ai-pricing.api.ts
import { platformAxios } from '../services/platform/platformAxios';

export interface AiPricingRequest {
  targetRevenue: number;
  tenants: number;
  growthRate: number;
  currentPrice: number;
}

export interface AiPricingResponse {
  monthlyPrice: number;
  annualPrice: number;
  predictedRevenue: number;
  retentionRate: number;
  explanation: string;
}

export const generatePricingSuggestion = async (
  data: AiPricingRequest
): Promise<AiPricingResponse> => {
  const response = await platformAxios.post('/admin/ai/pricing', data);
  return response.data;
};
