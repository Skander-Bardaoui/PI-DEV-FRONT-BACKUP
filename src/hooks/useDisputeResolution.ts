// src/hooks/useDisputeResolution.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';

// ─── Types ────────────────────────────────────────────────────────────────

export enum DisputeCategory {
  PRICE_DISCREPANCY = 'PRICE_DISCREPANCY',
  QUANTITY_MISMATCH = 'QUANTITY_MISMATCH',
  MISSING_DELIVERY = 'MISSING_DELIVERY',
  PARTIAL_DELIVERY = 'PARTIAL_DELIVERY',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  UNAUTHORIZED_CHARGE = 'UNAUTHORIZED_CHARGE',
  DUPLICATE_INVOICE = 'DUPLICATE_INVOICE',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  OTHER = 'OTHER',
}

export enum ResolutionAction {
  APPROVE_AS_IS = 'APPROVE_AS_IS',
  CORRECT_AMOUNTS = 'CORRECT_AMOUNTS',
  REQUEST_CREDIT_NOTE = 'REQUEST_CREDIT_NOTE',
  REQUEST_CORRECTED_INVOICE = 'REQUEST_CORRECTED_INVOICE',
  REJECT_INVOICE = 'REJECT_INVOICE',
  WAIT_FOR_DELIVERY = 'WAIT_FOR_DELIVERY',
  CONTACT_SUPPLIER = 'CONTACT_SUPPLIER',
}

export interface SuggestedAction {
  action: ResolutionAction;
  label: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimated_time: string;
}

export interface DisputeInfo {
  invoice_id: string;
  invoice_number: string;
  supplier_name: string;
  supplier_email: string | null;
  status: string;
  dispute_reason: string | null;
  dispute_category: DisputeCategory | null;
  created_at: string;
  days_in_dispute: number;
  invoiced_amount: number;
  expected_amount: number;
  discrepancy: number;
  discrepancy_pct: number;
  suggested_actions: SuggestedAction[];
}

export interface DisputeResolutionDto {
  action: ResolutionAction;
  resolution_notes?: string;
  corrected_amounts?: {
    subtotal_ht?: number;
    tax_amount?: number;
    timbre_fiscal?: number;
  };
  notify_supplier?: boolean;
}

export interface DisputeResolutionResponse {
  success: boolean;
  message: string;
  invoice: any;
}

// ─── Hooks ────────────────────────────────────────────────────────────────

const base = (bId: string) => `/businesses/${bId}/dispute-resolution`;

// Obtenir les informations détaillées d'un litige
export function useDisputeInfo(businessId: string, invoiceId: string) {
  return useQuery({
    queryKey: ['dispute-info', businessId, invoiceId],
    queryFn: () =>
      axiosInstance
        .get<DisputeInfo>(`${base(businessId)}/invoice/${invoiceId}`)
        .then((r) => r.data),
    enabled: !!businessId && !!invoiceId,
    staleTime: 30_000,
  });
}

// Résoudre un litige
export function useResolveDispute(businessId: string) {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invoiceId, dto }: { invoiceId: string; dto: DisputeResolutionDto }) =>
      axiosInstance
        .post<DisputeResolutionResponse>(
          `${base(businessId)}/invoice/${invoiceId}/resolve`,
          dto
        )
        .then((r) => r.data),
    onSuccess: (_, variables) => {
      // Invalider les queries liées
      qc.invalidateQueries({ queryKey: ['dispute-info', businessId, variables.invoiceId] });
      qc.invalidateQueries({ queryKey: ['purchase-invoices', businessId] });
      qc.invalidateQueries({ queryKey: ['three-way-match', businessId] });
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────

export const ACTION_LABELS: Record<ResolutionAction, string> = {
  [ResolutionAction.APPROVE_AS_IS]: 'Approuver malgré l\'écart',
  [ResolutionAction.CORRECT_AMOUNTS]: 'Corriger les montants',
  [ResolutionAction.REQUEST_CREDIT_NOTE]: 'Demander un avoir',
  [ResolutionAction.REQUEST_CORRECTED_INVOICE]: 'Demander facture rectificative',
  [ResolutionAction.REJECT_INVOICE]: 'Rejeter la facture',
  [ResolutionAction.WAIT_FOR_DELIVERY]: 'Attendre la livraison',
  [ResolutionAction.CONTACT_SUPPLIER]: 'Contacter le fournisseur',
};

export const CATEGORY_LABELS: Record<DisputeCategory, string> = {
  [DisputeCategory.PRICE_DISCREPANCY]: 'Écart de Prix',
  [DisputeCategory.QUANTITY_MISMATCH]: 'Écart de Quantité',
  [DisputeCategory.MISSING_DELIVERY]: 'Livraison Manquante',
  [DisputeCategory.PARTIAL_DELIVERY]: 'Livraison Partielle',
  [DisputeCategory.CALCULATION_ERROR]: 'Erreur de Calcul',
  [DisputeCategory.UNAUTHORIZED_CHARGE]: 'Frais Non Autorisés',
  [DisputeCategory.DUPLICATE_INVOICE]: 'Facture en Double',
  [DisputeCategory.QUALITY_ISSUE]: 'Problème de Qualité',
  [DisputeCategory.OTHER]: 'Autre',
};

export const CATEGORY_COLORS: Record<DisputeCategory, string> = {
  [DisputeCategory.PRICE_DISCREPANCY]: 'bg-red-100 text-red-800 border-red-300',
  [DisputeCategory.QUANTITY_MISMATCH]: 'bg-orange-100 text-orange-800 border-orange-300',
  [DisputeCategory.MISSING_DELIVERY]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  [DisputeCategory.PARTIAL_DELIVERY]: 'bg-blue-100 text-blue-800 border-blue-300',
  [DisputeCategory.CALCULATION_ERROR]: 'bg-purple-100 text-purple-800 border-purple-300',
  [DisputeCategory.UNAUTHORIZED_CHARGE]: 'bg-red-100 text-red-800 border-red-300',
  [DisputeCategory.DUPLICATE_INVOICE]: 'bg-gray-100 text-gray-800 border-gray-300',
  [DisputeCategory.QUALITY_ISSUE]: 'bg-pink-100 text-pink-800 border-pink-300',
  [DisputeCategory.OTHER]: 'bg-gray-100 text-gray-800 border-gray-300',
};

export const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-800 border-red-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-green-100 text-green-800 border-green-300',
};

export const PRIORITY_ICONS = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
};
