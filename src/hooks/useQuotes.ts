// src/hooks/useQuotes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import {
  CreateQuoteDto,
  UpdateQuoteDto,
  QuotesQueryParams,
} from '@/types/quote';
import {
  getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  sendQuote,
  acceptQuote,
  rejectQuote,
  expireQuote,
  convertQuote,
} from '@/api/quotes';

export const QUOTES_KEY = 'quotes';

export const useQuotes = (businessId: string, params?: QuotesQueryParams) =>
  useQuery({
    queryKey: [QUOTES_KEY, businessId, params],
    queryFn: () => getQuotes(businessId, params),
    enabled: !!businessId,
  });

export const useQuote = (businessId: string, id: string) =>
  useQuery({
    queryKey: [QUOTES_KEY, businessId, id],
    queryFn: () => getQuote(businessId, id),
    enabled: !!businessId && !!id,
  });

export const useCreateQuote = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateQuoteDto) => createQuote(businessId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUOTES_KEY, businessId] }),
  });
};

export const useUpdateQuote = (businessId: string, id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateQuoteDto) => updateQuote(businessId, id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUOTES_KEY, businessId] }),
  });
};

export const useSendQuote = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sendQuote(businessId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUOTES_KEY, businessId] }),
  });
};

export const useAcceptQuote = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => acceptQuote(businessId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUOTES_KEY, businessId] }),
  });
};

export const useRejectQuote = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rejectQuote(businessId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUOTES_KEY, businessId] }),
  });
};

export const useExpireQuote = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expireQuote(businessId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUOTES_KEY, businessId] }),
  });
};

export const useConvertQuote = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => convertQuote(businessId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUOTES_KEY, businessId] }),
  });
};

export const useConvertQuoteToInvoice = (businessId: string) => {
  // Don't use queryClient here - no automatic invalidation
  // The parent component will handle refresh manually
  return useMutation({
    mutationFn: (id: string) => import('@/api/quotes').then(m => m.convertQuoteToInvoice(businessId, id)),
  });
};

export const useConvertQuoteToOrder = (businessId: string) => {
  // Don't use queryClient here - no automatic invalidation
  // The parent component will handle refresh manually
  return useMutation({
    mutationFn: (id: string) => import('@/api/quotes').then(m => m.convertQuoteToOrder(businessId, id)),
  });
};

export const useDeleteQuote = (businessId: string) => {
  const qc = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (id: string) => import('@/api/quotes').then(m => m.deleteQuote(businessId, id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUOTES_KEY, businessId] });
      toast.success('Devis supprimé', 'Le devis a été supprimé avec succès');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Erreur lors de la suppression';
      toast.error('Suppression impossible', errorMessage);
    },
  });
};

