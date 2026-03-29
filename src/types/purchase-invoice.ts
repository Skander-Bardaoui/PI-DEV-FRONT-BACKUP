// src/types/purchase-invoice.types.ts

import { Supplier } from "./supplier";
import { SupplierPO } from "./supplier-po";


// ── Enums ─────────────────────────────────────────────────────────────────
export enum InvoiceStatus {
  PENDING        = 'PENDING',
  APPROVED       = 'APPROVED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID           = 'PAID',
  OVERDUE        = 'OVERDUE',
  DISPUTED       = 'DISPUTED',
  CANCELLED       = 'CANCELLED',

}

// ── Labels et couleurs pour l'UI ──────────────────────────────────────────
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PENDING]:        'En attente',
  [InvoiceStatus.APPROVED]:       'Approuvée',
  [InvoiceStatus.PARTIALLY_PAID]: 'Partiellement payée',
  [InvoiceStatus.PAID]:           'Payée',
  [InvoiceStatus.OVERDUE]:        'En retard',
  [InvoiceStatus.DISPUTED]:       'En litige',
  [InvoiceStatus.CANCELLED]:       'Annuler',

};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PENDING]:        'bg-gray-100 text-gray-700',
  [InvoiceStatus.APPROVED]:       'bg-blue-100 text-blue-700',
  [InvoiceStatus.PARTIALLY_PAID]: 'bg-yellow-100 text-yellow-700',
  [InvoiceStatus.PAID]:           'bg-green-100 text-green-700',
  [InvoiceStatus.OVERDUE]:        'bg-red-100 text-red-700',
  [InvoiceStatus.DISPUTED]:       'bg-orange-100 text-orange-700',
[InvoiceStatus.CANCELLED]:        'bg-blue-100 text-blue-700',

};

// ── Facture Fournisseur ───────────────────────────────────────────────────
export interface PurchaseInvoice {
  id:                      string;
  invoice_number_supplier: string;
  status:                  InvoiceStatus;
  business_id:             string;
  supplier_id:             string;
  supplier:                Supplier;
  supplier_po_id:          string | null;
  supplier_po:             SupplierPO | null;
  invoice_date:            string;
  due_date:                string;
  subtotal_ht:             number;
  tax_amount:              number;
  timbre_fiscal:           number;
  net_amount:              number;
  paid_amount:             number;
  receipt_url:             string | null;
  dispute_reason:          string | null;
  created_at:              string;
  updated_at:              string;

  // Calculé côté frontend
  remaining_amount?: number;
  is_overdue?:       boolean;
}

// ── DTOs ─────────────────────────────────────────────────────────────────
export interface CreatePurchaseInvoiceDto {
  invoice_number_supplier: string;
  supplier_id:             string;
  supplier_po_id?:         string;
  invoice_date:            string;
  due_date?:               string;
  subtotal_ht:             number;
  tax_amount:              number;
  timbre_fiscal?:          number;
  net_amount?:             number;
  receipt_url?:            string;
}

export interface UpdatePurchaseInvoiceDto extends Partial<Omit<CreatePurchaseInvoiceDto, 'supplier_id' | 'supplier_po_id'>> {}

export interface DisputeInvoiceDto {
  dispute_reason: string;
}

export interface UpdatePaymentAmountDto {
  paid_amount: number;
}

// ── Query Params ──────────────────────────────────────────────────────────
export interface PurchaseInvoicesQueryParams {
  supplier_id?: string;
  status?:      string;
  due_before?:  string;
  date_from?:   string;
  date_to?:     string;
  page?:        number;
  limit?:       number;
  sort_field?: string;
  sort_dir?:   'asc' | 'desc';
}

// ── Réponse paginée ───────────────────────────────────────────────────────
export interface PaginatedPurchaseInvoices {
  data:         PurchaseInvoice[];
  total:        number;
  page:         number;
  limit:        number;
  total_pages?: number;
}