// src/hooks/useRecurringInvoices.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import {
  CreateRecurringInvoiceDto,
  UpdateRecurringInvoiceDto,
  RecurringInvoicesQueryParams,
  BulkUpdateRecurringInvoicesDto,
} from '@/types/recurring-invoice';
import {
  getRecurringInvoices,
  getRecurringInvoice,
  getRecurringInvoiceStats,
  createRecurringInvoice,
  updateRecurringInvoice,
  deleteRecurringInvoice,
  activateRecurringInvoice,
  deactivateRecurringInvoice,
  pauseRecurringInvoice,
  resumeRecurringInvoice,
  bulkUpdateRecurringInvoices,
  getRecurringInvoiceHistory,
} from '@/api/recurring-invoices';

export const RECURRING_INVOICES_KEY = 'recurring-invoices';
export const RECURRING_INVOICES_STATS_KEY = 'recurring-invoices-stats';
export const RECURRING_INVOICE_HISTORY_KEY = 'recurring-invoice-history';

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

export const useRecurringInvoiceStats = (businessId: string) =>
  useQuery({
    queryKey: [RECURRING_INVOICES_STATS_KEY, businessId],
    queryFn: () => getRecurringInvoiceStats(businessId),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export const useRecurringInvoiceHistory = (businessId: string, recurringId: string | null, page = 1, limit = 10) =>
  useQuery({
    queryKey: [RECURRING_INVOICE_HISTORY_KEY, businessId, recurringId, page, limit],
    queryFn: () => getRecurringInvoiceHistory(businessId, recurringId!, page, limit),
    enabled: !!businessId && !!recurringId,
  });

export const useCreateRecurringInvoice = (businessId: string) => {
  const qc = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (dto: CreateRecurringInvoiceDto) => createRecurringInvoice(businessId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RECURRING_INVOICES_KEY, businessId] });
      qc.invalidateQueries({ queryKey: [RECURRING_INVOICES_STATS_KEY, businessId] });
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
      qc.invalidateQueries({ queryKey: [RECURRING_INVOICES_STATS_KEY, businessId] });
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
      qc.invalidateQueries({ queryKey: [RECURRING_INVOICES_STATS_KEY, businessId] });
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
      qc.invalidateQueries({ queryKey: [RECURRING_INVOICES_STATS_KEY, businessId] });
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
      qc.invalidateQueries({ queryKey: [RECURRING_INVOICES_STATS_KEY, businessId] });
      toast.success('Facture récurrente désactivée', 'La facture récurrente a été désactivée avec succès');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Erreur lors de la désactivation';
      toast.error('Désactivation impossible', errorMessage);
    },
  });
};

export const usePauseRecurringInvoice = (businessId: string) => {
  const qc = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (id: string) => pauseRecurringInvoice(businessId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RECURRING_INVOICES_KEY, businessId] });
      qc.invalidateQueries({ queryKey: [RECURRING_INVOICES_STATS_KEY, businessId] });
      toast.success('Facture récurrente mise en pause', 'La facture récurrente a été mise en pause');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Erreur lors de la mise en pause';
      toast.error('Mise en pause impossible', errorMessage);
    },
  });
};

export const useResumeRecurringInvoice = (businessId: string) => {
  const qc = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (id: string) => resumeRecurringInvoice(businessId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RECURRING_INVOICES_KEY, businessId] });
      qc.invalidateQueries({ queryKey: [RECURRING_INVOICES_STATS_KEY, businessId] });
      toast.success('Facture récurrente reprise', 'La facture récurrente a été reprise');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Erreur lors de la reprise';
      toast.error('Reprise impossible', errorMessage);
    },
  });
};

export const useBulkUpdateRecurringInvoices = (businessId: string) => {
  const qc = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (dto: BulkUpdateRecurringInvoicesDto) => bulkUpdateRecurringInvoices(businessId, dto),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: [RECURRING_INVOICES_KEY, businessId] });
      qc.invalidateQueries({ queryKey: [RECURRING_INVOICES_STATS_KEY, businessId] });
      
      const actionLabels = {
        activate: 'activées',
        pause: 'mises en pause',
        delete: 'supprimées',
      };
      
      toast.success(
        'Action effectuée',
        `${data.affected} facture(s) récurrente(s) ${actionLabels[variables.action]}`
      );
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Erreur lors de l\'action en masse';
      toast.error('Action impossible', errorMessage);
    },
  });
};
