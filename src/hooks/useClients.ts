// src/hooks/useClients.ts
import { useQuery } from '@tanstack/react-query';
import { getClients, getClient } from '@/api/clients';

export const CLIENTS_KEY = 'clients';

export const useClients = (
  businessId: string,
  params?: { page?: number; limit?: number; search?: string }
) =>
  useQuery({
    queryKey: [CLIENTS_KEY, businessId, params],
    queryFn: () => getClients(businessId, params),
    enabled: !!businessId,
  });

export const useClient = (businessId: string, id: string) =>
  useQuery({
    queryKey: [CLIENTS_KEY, businessId, id],
    queryFn: () => getClient(businessId, id),
    enabled: !!businessId && !!id,
  });
