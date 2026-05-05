// src/hooks/useDisputeResponses.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';

export interface DisputeResponseItem {
  id: string;
  invoice_number: string;
  supplier_name: string;
  response_message: string;
  proposed_solution: string | null;
  proposed_amount: number | null;
  created_at: string;
  invoice_amount: number;
  expected_amount: number;
}

const base = (bId: string) => `/businesses/${bId}/dispute-resolution`;

// Obtenir toutes les réponses en attente
export function usePendingDisputeResponses(businessId: string) {
  return useQuery({
    queryKey: ['dispute-responses', businessId],
    queryFn: () =>
      axiosInstance
        .get<DisputeResponseItem[]>(`${base(businessId)}/responses`)
        .then((r) => r.data),
    enabled: !!businessId,
    staleTime: 30_000,
  });
}

// Traiter une réponse (accepter/rejeter)
export function useProcessDisputeResponse(businessId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      responseId,
      action,
      admin_notes,
    }: {
      responseId: string;
      action: 'accept' | 'reject';
      admin_notes?: string;
    }) =>
      axiosInstance
        .post(`${base(businessId)}/response/${responseId}/process`, {
          action,
          admin_notes,
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dispute-responses', businessId] });
      qc.invalidateQueries({ queryKey: ['purchase-invoices', businessId] });
    },
  });
}
