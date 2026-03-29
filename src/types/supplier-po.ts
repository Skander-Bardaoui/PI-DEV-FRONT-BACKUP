// src/types/supplier-po.types.ts

import { Supplier } from "./supplier";


// ── Enums ─────────────────────────────────────────────────────────────────
export enum POStatus {
  DRAFT              = 'DRAFT',
  SENT               = 'SENT',
  CONFIRMED          = 'CONFIRMED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  FULLY_RECEIVED     = 'FULLY_RECEIVED',
  CANCELLED          = 'CANCELLED',
}

// ── Labels et couleurs pour l'UI ──────────────────────────────────────────
export const PO_STATUS_LABELS: Record<POStatus, string> = {
  [POStatus.DRAFT]:              'Brouillon',
  [POStatus.SENT]:               'Envoyé',
  [POStatus.CONFIRMED]:          'Confirmé',
  [POStatus.PARTIALLY_RECEIVED]: 'Partiellement reçu',
  [POStatus.FULLY_RECEIVED]:     'Entièrement reçu',
  [POStatus.CANCELLED]:          'Annulé',
};

export const PO_STATUS_COLORS: Record<POStatus, string> = {
  [POStatus.DRAFT]:              'bg-gray-100 text-gray-700',
  [POStatus.SENT]:               'bg-blue-100 text-blue-700',
  [POStatus.CONFIRMED]:          'bg-indigo-100 text-indigo-700',
  [POStatus.PARTIALLY_RECEIVED]: 'bg-yellow-100 text-yellow-700',
  [POStatus.FULLY_RECEIVED]:     'bg-green-100 text-green-700',
  [POStatus.CANCELLED]:          'bg-red-100 text-red-700',
};

// ── Ligne de BC ───────────────────────────────────────────────────────────
export interface SupplierPOItem {
  id:                string;
  supplier_po_id:    string;
  product_id:        string | null;
  description:       string;
  quantity_ordered:  number;
  quantity_received: number;
  unit_price_ht:     number;
  tax_rate_value:    number;
  line_total_ht:     number;
  line_tax:          number;
  sort_order:        number;
}

// ── Bon de Commande ───────────────────────────────────────────────────────
export interface SupplierPO {
  id:                string;
  po_number:         string;
  status:            POStatus;
  business_id:       string;
  supplier_id:       string;
  supplier:          Supplier;
  expected_delivery: string | null;
  subtotal_ht:       number;
  tax_amount:        number;
  timbre_fiscal:     number;
  net_amount:        number;
  notes:             string | null;
  pdf_url:           string | null;
  sent_at:           string | null;
  created_at:        string;
  updated_at:        string;
  items:             SupplierPOItem[];
}

// ── DTOs ─────────────────────────────────────────────────────────────────
export interface CreateSupplierPOItemDto {
  product_id?:    string;
  description:    string;
  quantity_ordered: number;
  unit_price_ht:  number;
  tax_rate_value: number;
  sort_order?:    number;
}

export interface CreateSupplierPODto {
  supplier_id:        string;
  expected_delivery?: string;
  notes?:             string;
  items:              CreateSupplierPOItemDto[];
}

export interface UpdateSupplierPODto {
  expected_delivery?: string;
  notes?:             string;
  items?:             CreateSupplierPOItemDto[];
}

// ── Query Params ──────────────────────────────────────────────────────────
export interface SupplierPOsQueryParams {
  supplier_id?: string;
  status?:      string;
  date_from?:   string;
  date_to?:     string;
  page?:        number;
  limit?:       number;
}

// ── Réponse paginée ───────────────────────────────────────────────────────
export interface PaginatedSupplierPOs {
  data:        SupplierPO[];
  total:       number;
  page:        number;
  limit:       number;
  total_pages?: number;
}