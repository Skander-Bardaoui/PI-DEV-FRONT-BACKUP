import axiosInstance from './axiosInstance';

export interface SalesForecast {
  forecast_days: number;
  predicted_sales: number;
  predicted_daily_avg: number;
  current_daily_avg: number;
  trend: string;
  confidence: number;
  best_selling_days: string[];
  seasonality_detected: boolean;
  growth_rate: number;
  recommendation: string;
}

export interface ClientChurnRisk {
  client_id: string;
  churn_risk_score: number;
  risk_level: string;
  days_since_last_purchase: number;
  average_purchase_interval: number;
  purchase_frequency_per_month: number;
  recommendation: string;
}

export const salesMLApi = {
  getSalesForecast: async (businessId: string, days: number = 30): Promise<SalesForecast> => {
    const { data } = await axiosInstance.get(
      `/businesses/${businessId}/sales/ml/forecast?days=${days}`
    );
    return data;
  },

  getClientChurnRisk: async (businessId: string, clientId: string): Promise<ClientChurnRisk> => {
    const { data } = await axiosInstance.get(
      `/businesses/${businessId}/sales/ml/churn/client/${clientId}`
    );
    return data;
  },

  getHighRiskClients: async (businessId: string): Promise<ClientChurnRisk[]> => {
    const { data } = await axiosInstance.get(
      `/businesses/${businessId}/sales/ml/churn/high-risk`
    );
    return data;
  },
};
