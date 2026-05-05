// src/api/forecast.api.ts
import axiosInstance from './axiosInstance';

export interface HistoricalDay {
  date: string;
  inflow: number;
  outflow: number;
  balance: number;
}

export interface ForecastDay {
  date: string;
  predicted_balance: number;
}

export interface CashFlowForecastResponse {
  historical: HistoricalDay[];
  forecast: ForecastDay[];
  insight: string;
  advice: string[];
}

export const getCashFlowForecast = async (): Promise<CashFlowForecastResponse> => {
  const response = await axiosInstance.get<CashFlowForecastResponse>('/forecast/cashflow');
  return response.data;
};
