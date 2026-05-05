// ==================== Alaa change for stock dashboard ====================
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface StockDashboardSummary {
  total_products: number;
  total_services: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_categories: number;
  total_movements: number;
  total_stock_value: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  min_quantity: number;
  unit: string;
  category_name: string | null;
  stock_percentage: number;
}

export interface RecentMovement {
  id: string;
  type: string;
  quantity: number;
  created_at: string;
  product_name: string;
  product_sku: string;
  reference: string | null;
}

export interface MovementsChart {
  date: string;
  entrees: number;
  sorties: number;
  ajustements: number;
}

export interface StockForecast {
  id: string;
  name: string;
  sku: string;
  unit: string;
  current_quantity: number;
  avg_daily_consumption: number;
  days_remaining: number | null;
  risk_level: 'CRITICAL' | 'WARNING' | 'OK';
}

export interface StockDashboardResponse {
  summary: StockDashboardSummary;
  low_stock_products: LowStockProduct[];
  recent_movements: RecentMovement[];
  movements_chart: MovementsChart[];
  stock_forecast: StockForecast[];
}

export const stockDashboardApi = {
  getDashboard: async (businessId: string): Promise<StockDashboardResponse> => {
    const response = await axios.get(
      `${API_URL}/businesses/${businessId}/stock/dashboard`,
      { withCredentials: true }
    );
    return response.data;
  },
  
  getProductsDashboard: async (businessId: string): Promise<StockDashboardResponse> => {
    const response = await axios.get(
      `${API_URL}/businesses/${businessId}/stock/dashboard/products`,
      { withCredentials: true }
    );
    return response.data;
  },
  
  getServicesDashboard: async (businessId: string): Promise<StockDashboardResponse> => {
    const response = await axios.get(
      `${API_URL}/businesses/${businessId}/stock/dashboard/services`,
      { withCredentials: true }
    );
    return response.data;
  },
};
// ====================================================================
