// src/hooks/usePurchaseInvoices.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
      qc.invalidateQueries({ queryKey: [PURCHASE_INVOICES_KEY, businessId] });
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
    },
  });
}

// ─── Approuver ──────────────────────────────────────
export function useApprovePurchaseInvoice(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approvePurchaseInvoice(businessId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PURCHASE_INVOICES_KEY, businessId] });
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
      qc.invalidateQueries({ queryKey: [PURCHASE_INVOICES_KEY, businessId] });
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
      qc.invalidateQueries({ queryKey: [PURCHASE_INVOICES_KEY, businessId] });
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