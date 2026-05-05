// src/api/plans.api.ts
import axios from 'axios';

// Create a separate axios instance for public API calls (no auth required)
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001', // Backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_annual: number;
  max_users?: number;
  max_businesses?: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const plansApi = {
  /**
   * Get all active plans (public endpoint - no auth required)
   * Used by landing page to display pricing
   */
  async getPublicPlans(): Promise<Plan[]> {
    try {
      const response = await publicApi.get<Plan[]>('/api/plans/public');
      return response.data;
    } catch (error) {
      console.error('Error fetching public plans:', error);
      throw error;
    }
  },
};
