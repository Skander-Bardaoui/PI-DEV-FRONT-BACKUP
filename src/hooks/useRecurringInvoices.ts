// src/hooks/useRecurringInvoices.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import {
  CreateRecurringInvoiceDto,
  UpdateRecurringInvoiceDto,
  RecurringInvoicesQueryParams,
} from '@/types/recurring-invoice';
import {
  getRecurringInvoices,
  getRecurringInvoice,
  createRecurringInvoice,
  updateRecurringInvoice,
  deleteRecurringInvoice,
  activateRecurringInvoice,
  deactivateRecurringInvoice,
} from '@/api/recurring-invoices';

export const RECURRING_INVOICES_KEY = 'recurring-invoices';

export const useRecurringInvoices = (businessId: string, params?: RecurringInvoicesQueryParams) =>
  useQuery({
    queryKey: [RECURRING_INVOICES_KEY, businessId, params],
    queryFn: () => getRecurringInvoices(businessId, params),
    enabled: !!businessId,
  });

export const useRecurringInvoice = (businessId: string, id: string) =>
  useQuery({
    queryKey: [RECURRING_INVOICES_KEY, businessId, id],
    queryFn: () => getRecurringInvoice(businessId, id),
    enabled: !!businessId && !!id,
  });

export const useCreateRecurringInvoice = (businessId: string) => {
  const qc = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (dto: CreateRecurringInvoiceDto) => createRecurringInvoice(businessId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RECURRING_INVOICES_KEY, businessId] });
      toast.success('Facture récurrente créée', 'La facture récurrente a été créée avec succès');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Erreur lors de la création';
      toast.error('Création impossible', errorMessage);
    },
  });
};

export const useUpdateRecurringInvoice = (businessId: string, id: string) => {
  const qc = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (dto: UpdateRecurringInvoiceDto) => updateRecurringInvoice(businessId, id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RECURRING_INVOICES_KEY, businessId] });
      toast.success('Facture récurrente modifiée', 'La facture récurrente a été modifiée avec succès');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Erreur lors de la modification';
      toast.error('Modification impossible', errorMessage);
    },
  });
};

export const useDeleteRecurringInvoice = (businessId: string) => {
  const qc = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (id: string) => deleteRecurringInvoice(businessId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RECURRING_INVOICES_KEY, businessId] });
      toast.success('Facture récurrente supprimée', 'La facture récurrente a été supprimée avec succès');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Erreur lors de la suppression';
      toast.error('Suppression impossible', errorMessage);
    },
  });
};

export const useActivateRecurringInvoice = (businessId: string) => {
  const qc = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (id: string) => activateRecurringInvoice(businessId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RECURRING_INVOICES_KEY, businessId] });
      toast.success('Facture récurrente activée', 'La facture récurrente a été activée avec succès');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Erreur lors de l\'activation';
      toast.error('Activation impossible', errorMessage);
    },
  });
};

export const useDeactivateRecurringInvoice = (businessId: string) => {
  const qc = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (id: string) => deactivateRecurringInvoice(businessId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RECURRING_INVOICES_KEY, businessId] });
      toast.success('Facture récurrente désactivée', 'La facture récurrente a été désactivée avec succès');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Erreur lors de la désactivation';
      toast.error('Désactivation impossible', errorMessage);
    },
  });
};
