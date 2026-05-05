// src/hooks/useThreeWayMatching.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';

export type MatchStatus =
  | 'MATCHED' | 'PARTIAL_MATCH' | 'MISMATCH'
  | 'MISSING_PO' | 'MISSING_GR' | 'OVER_INVOICED' | 'UNDER_INVOICED';

export interface LineDiscrepancy {
  description:        string;
  po_quantity:        number;
  received_quantity:  number;
  invoiced_quantity:  number;
  po_unit_price:      number;
  po_line_total:      number;
  received_total:     number;
  discrepancy_amount: number;
  discrepancy_pct:    number;
  status:             'OK' | 'PRICE_MISMATCH' | 'QTY_MISMATCH' | 'NOT_RECEIVED' | 'OVER_INVOICED';
}

export interface AIMatchingAnalysis {
  confidence_score:         number;
  risk_level:               'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommended_action:       'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'AUTO_DISPUTE' | 'CONTACT_SUPPLIER';
  explanation:              string;
  key_findings:             string[];
  suggested_next_steps:     string[];
  dispute_category:         string | null;
  estimated_resolution_time: string;
}

export interface MatchResult {
  invoice_id:           string;
  invoice_number:       string;
  supplier_name:        string;
  supplier_email:       string | null;  // ← Ajout de l'email du fournisseur
  status:               MatchStatus;
  can_auto_approve:     boolean;
  should_auto_dispute:  boolean;
  po_total:             number;
  received_total:       number;
  invoiced_total:       number;
  total_discrepancy:    number;
  discrepancy_pct:      number;
  line_discrepancies:   LineDiscrepancy[];
  issues:               string[];
  recommendations:      string[];
  po_number:            string | null;
  gr_numbers:           string[];
  matching_date:        string;
  ai_analysis?:         AIMatchingAnalysis;
}

const base = (bId: string) => `/businesses/${bId}/three-way-matching`;

// Rapprochement d'une facture spécifique
export function useInvoiceMatch(businessId: string, invoiceId: string, useAI: boolean = true) {
  return useQuery({
    queryKey: ['three-way-match', businessId, invoiceId, useAI],
    queryFn:  () => axiosInstance
      .get(`${base(businessId)}/invoice/${invoiceId}`, {
        params: { useAI: useAI ? 'true' : 'false' },
      })
      .then(r => r.data as MatchResult),
    enabled: !!businessId && !!invoiceId,
    staleTime: 30_000,
  });
}

// Rapprochement de toutes les factures PENDING
export function useAllPendingMatches(businessId: string, useAI: boolean = true) {
  return useQuery({
    queryKey: ['three-way-match-all', businessId, useAI],
    queryFn:  () => axiosInstance
      .get(`${base(businessId)}/pending`, {
        params: { useAI: useAI ? 'true' : 'false' },
      })
      .then(r => r.data as MatchResult[]),
    enabled:  !!businessId,
    staleTime: 60_000,
  });
}

// Appliquer l'action automatique sur une facture
export function useApplyMatch(businessId: string, useAI: boolean = true) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => axiosInstance
      .post(`${base(businessId)}/invoice/${invoiceId}/apply`, {}, {
        params: { useAI: useAI ? 'true' : 'false' },
      })
      .then(r => r.data as MatchResult),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-invoices', businessId] });
      qc.invalidateQueries({ queryKey: ['three-way-match-all', businessId] });
    },
  });
}


// Contacter le fournisseur par email
export function useContactSupplier(businessId: string, useAI: boolean = true) {
  return useMutation({
    mutationFn: (invoiceId: string) => axiosInstance
      .post(`${base(businessId)}/invoice/${invoiceId}/contact-supplier`, {}, {
        params: { useAI: useAI ? 'true' : 'false' },
      })
      .then(r => r.data as { success: boolean; message: string }),
  });
}
