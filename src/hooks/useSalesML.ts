import { useQuery } from '@tanstack/react-query';
import { salesMLApi, SalesForecast, ClientChurnRisk } from '../api/sales-ml.api';

export const useSalesForecast = (businessId: string, days: number = 30) => {
  return useQuery<SalesForecast>({
    queryKey: ['sales-forecast', businessId, days],
    queryFn: () => salesMLApi.getSalesForecast(businessId, days),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useClientChurnRisk = (businessId: string, clientId: string) => {
  return useQuery<ClientChurnRisk>({
    queryKey: ['client-churn', businessId, clientId],
    queryFn: () => salesMLApi.getClientChurnRisk(businessId, clientId),
    enabled: !!businessId && !!clientId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useHighRiskClients = (businessId: string) => {
  return useQuery<ClientChurnRisk[]>({
    queryKey: ['high-risk-clients', businessId],
    queryFn: () => salesMLApi.getHighRiskClients(businessId),
    enabled: !!businessId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};
