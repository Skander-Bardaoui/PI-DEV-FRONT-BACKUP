// src/hooks/usePurchaseInvoices.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApprovedOrPartialInvoices } from '@/api/purchase-invoices';

import {
  CreatePurchaseInvoiceDto,
  UpdatePurchaseInvoiceDto,
  DisputeInvoiceDto,
  UpdatePaymentAmountDto,
  PurchaseInvoicesQueryParams,
} from '@/types';

import {
  approvePurchaseInvoice,
  createPurchaseInvoice,
  disputePurchaseInvoice,
  getPurchaseInvoice,
  getPurchaseInvoices,
  getPurchaseInvoicesByPO,
  resolveDisputePurchaseInvoice,
  updatePaymentAmount,
  updatePurchaseInvoice
} from '@/api/purchase-invoices';

// FIX: déclaré localement
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isValidUUID = (v: string | undefined | null): v is string =>
  !!v && UUID_REGEX.test(v);

export const PURCHASE_INVOICES_KEY = 'purchase-invoices';

const invoiceKeys = {
  list: (businessId: string, params?: any) =>
    [PURCHASE_INVOICES_KEY, businessId, params] as const,
  one: (businessId: string, id: string) =>
    [PURCHASE_INVOICES_KEY, businessId, id] as const,
};

// ─── Lister ─────────────────────────────────────────
export function usePurchaseInvoices(
  businessId: string,
  params: PurchaseInvoicesQueryParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: invoiceKeys.list(businessId, params),
    queryFn: () => getPurchaseInvoices(businessId, params),
    enabled: (options?.enabled ?? true) && isValidUUID(businessId),
    staleTime: 30_000,
  });
}

// ─── Détail ─────────────────────────────────────────
export function usePurchaseInvoice(businessId: string, id: string) {
  return useQuery({
    queryKey: invoiceKeys.one(businessId, id),
    queryFn: () => getPurchaseInvoice(businessId, id),
    enabled: isValidUUID(businessId) && isValidUUID(id),
    staleTime: 60_000,
  });
}

// ─── Par BC (main)
export function usePurchaseInvoicesByPO(
  businessId: string,
  poId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [PURCHASE_INVOICES_KEY, businessId, 'by-po', poId] as const,
    queryFn: () => getPurchaseInvoicesByPO(businessId, poId),
    enabled: (options?.enabled ?? true) && isValidUUID(businessId) && isValidUUID(poId),
    staleTime: 30_000,
  });
}

// ─── Créer ─────────────────────────────────────────
export function useCreatePurchaseInvoice(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePurchaseInvoiceDto) =>
      createPurchaseInvoice(businessId, dto),
    onSuccess: () => {
      // Invalider toutes les queries liées aux factures
      qc.invalidateQueries({ queryKey: [PURCHASE_INVOICES_KEY, businessId] });
      // Invalider aussi les stats et scores fournisseurs
      qc.invalidateQueries({ queryKey: ['supplier-score', businessId] });
      qc.invalidateQueries({ queryKey: ['supplier-ranking', businessId] });
      // Invalider les matches 3-voies
      qc.invalidateQueries({ queryKey: ['three-way-match-all', businessId] });
      
      // Toast de succès
      toast.success('Facture créée avec succès', {
        description: 'La facture fournisseur a été enregistrée',
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création', {
        description: error?.response?.data?.message || 'Impossible de créer la facture',
        duration: 5000,
      });
    },
  });
}

// ─── Modifier ───────────────────────────────────────
export function useUpdatePurchaseInvoice(businessId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdatePurchaseInvoiceDto) =>
      updatePurchaseInvoice(businessId, id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PURCHASE_INVOICES_KEY, businessId] });
      
      toast.success('Facture modifiée', {
        description: 'Les modifications ont été enregistrées',
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la modification', {
        description: error?.response?.data?.message || 'Impossible de modifier la facture',
        duration: 5000,
      });
    },
  });
}

// ─── Approuver ──────────────────────────────────────
export function useApprovePurchaseInvoice(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approvePurchaseInvoice(businessId, id),
    onSuccess: () => {
      // Invalider toutes les queries liées aux factures
      qc.invalidateQueries({ queryKey: [PURCHASE_INVOICES_KEY, businessId] });
      // Invalider aussi les stats et scores fournisseurs
      qc.invalidateQueries({ queryKey: ['supplier-score', businessId] });
      qc.invalidateQueries({ queryKey: ['supplier-ranking', businessId] });
      // Invalider les matches 3-voies
      qc.invalidateQueries({ queryKey: ['three-way-match-all', businessId] });
    },
  });
}

// ─── Litige ─────────────────────────────────────────
export function useDisputePurchaseInvoice(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: DisputeInvoiceDto }) =>
      disputePurchaseInvoice(businessId, id, dto),
    onSuccess: () => {
      // Invalider toutes les queries liées aux factures
      qc.invalidateQueries({ queryKey: [PURCHASE_INVOICES_KEY, businessId] });
      // Invalider aussi les stats et scores fournisseurs
      qc.invalidateQueries({ queryKey: ['supplier-score', businessId] });
      qc.invalidateQueries({ queryKey: ['supplier-ranking', businessId] });
      // Invalider les matches 3-voies
      qc.invalidateQueries({ queryKey: ['three-way-match-all', businessId] });
      // Invalider les réponses aux litiges
      qc.invalidateQueries({ queryKey: ['dispute-responses', businessId] });
      
      toast.warning('Litige créé', {
        description: 'Le litige a été enregistré et le fournisseur sera notifié',
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création du litige', {
        description: error?.response?.data?.message || 'Impossible de créer le litige',
        duration: 5000,
      });
    },
  });
}

// ─── Résoudre litige ────────────────────────────────
export function useResolveDispute(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resolveDisputePurchaseInvoice(businessId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PURCHASE_INVOICES_KEY, businessId] });
      
      toast.success('Litige résolu', {
        description: 'Le litige a été résolu avec succès',
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la résolution', {
        description: error?.response?.data?.message || 'Impossible de résoudre le litige',
        duration: 5000,
      });
    },
  });
}

// ─── Paiement ───────────────────────────────────────
export function useUpdatePayment(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePaymentAmountDto }) =>
      updatePaymentAmount(businessId, id, dto),
    onSuccess: () => {
      // Invalider toutes les queries liées aux factures
      qc.invalidateQueries({ queryKey: [PURCHASE_INVOICES_KEY, businessId] });
      // Invalider aussi les stats et scores fournisseurs
      qc.invalidateQueries({ queryKey: ['supplier-score', businessId] });
      qc.invalidateQueries({ queryKey: ['supplier-ranking', businessId] });
      // Invalider les données de trésorerie
      qc.invalidateQueries({ queryKey: ['treasury', businessId] });
      
      toast.success('Paiement enregistré', {
        description: 'Le paiement a été enregistré avec succès',
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast.error('Erreur lors du paiement', {
        description: error?.response?.data?.message || 'Impossible d\'enregistrer le paiement',
        duration: 5000,
      });
    },
  });
}

//////////////// treasury (Achraf) //////////////////
export const useApprovedOrPartialInvoices = (
  businessId: string,
  params?: PurchaseInvoicesQueryParams,
) =>
  useQuery({
    queryKey: ['purchase-invoices', 'approved-partial', businessId, params],
    queryFn: () => getApprovedOrPartialInvoices(businessId, params),
    enabled: !!businessId,
  });