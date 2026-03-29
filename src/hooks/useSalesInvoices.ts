// src/hooks/useSalesInvoices.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import {
  CreateSalesInvoiceDto,
  UpdateSalesInvoiceDto,
  SalesInvoicesQueryParams,
} from '@/types/sales-invoice';
import {
  getSalesInvoices,
  getSalesInvoice,
  createSalesInvoice,
  updateSalesInvoice,
  sendSalesInvoice,
  markPartiallyPaidSalesInvoice,
  markPaidSalesInvoice,
  markOverdueSalesInvoice,
  cancelSalesInvoice,
} from '@/api/sales-invoices';

export const SALES_INVOICES_KEY = 'sales-invoices';

export const useSalesInvoices = (businessId: string, params?: SalesInvoicesQueryParams) =>
  useQuery({
    queryKey: [SALES_INVOICES_KEY, businessId, params],
    queryFn: () => getSalesInvoices(businessId, params),
    enabled: !!businessId,
  });

export const useSalesInvoice = (businessId: string, id: string) =>
  useQuery({
    queryKey: [SALES_INVOICES_KEY, businessId, id],
    queryFn: () => getSalesInvoice(businessId, id),
    enabled: !!businessId && !!id,
  });

export const useCreateSalesInvoice = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSalesInvoiceDto) => createSalesInvoice(businessId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SALES_INVOICES_KEY, businessId] }),
  });
};

export const useUpdateSalesInvoice = (businessId: string, id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateSalesInvoiceDto) => updateSalesInvoice(businessId, id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SALES_INVOICES_KEY, businessId] }),
  });
};

export const useSendSalesInvoice = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sendSalesInvoice(businessId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SALES_INVOICES_KEY, businessId] }),
  });
};

export const useMarkPartiallyPaidSalesInvoice = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markPartiallyPaidSalesInvoice(businessId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SALES_INVOICES_KEY, businessId] }),
  });
};

export const useMarkPaidSalesInvoice = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markPaidSalesInvoice(businessId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SALES_INVOICES_KEY, businessId] }),
  });
};

export const useMarkOverdueSalesInvoice = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markOverdueSalesInvoice(businessId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SALES_INVOICES_KEY, businessId] }),
  });
};

export const useCancelSalesInvoice = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelSalesInvoice(businessId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SALES_INVOICES_KEY, businessId] }),
  });
};

export const useDeleteSalesInvoice = (businessId: string) => {
  const qc = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (id: string) => import('@/api/sales-invoices').then(m => m.deleteSalesInvoice(businessId, id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SALES_INVOICES_KEY, businessId] });
      toast.success('Facture supprimée', 'La facture a été supprimée avec succès');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Erreur lors de la suppression';
      toast.error('Suppression impossible', errorMessage);
    },
  });
};
