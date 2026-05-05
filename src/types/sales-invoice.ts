// src/types/sales-invoice.ts

export enum SalesInvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum SalesInvoiceType {
  NORMAL = 'NORMAL',
  AVOIR = 'AVOIR',
  PROFORMA = 'PROFORMA',
  ACOMPTE = 'ACOMPTE',
}

export const SALES_INVOICE_STATUS_LABELS: Record<SalesInvoiceStatus, string> = {
  [SalesInvoiceStatus.DRAFT]: 'Brouillon',
  [SalesInvoiceStatus.SENT]: 'Envoyée',
  [SalesInvoiceStatus.PARTIALLY_PAID]: 'Partiellement payée',
  [SalesInvoiceStatus.PAID]: 'Payée',
  [SalesInvoiceStatus.OVERDUE]: 'En retard',
  [SalesInvoiceStatus.CANCELLED]: 'Annulée',
};

export const SALES_INVOICE_STATUS_COLORS: Record<SalesInvoiceStatus, string> = {
  [SalesInvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-700',
  [SalesInvoiceStatus.SENT]: 'bg-blue-100 text-blue-700',
  [SalesInvoiceStatus.PARTIALLY_PAID]: 'bg-yellow-100 text-yellow-700',
  [SalesInvoiceStatus.PAID]: 'bg-green-100 text-green-700',
  [SalesInvoiceStatus.OVERDUE]: 'bg-red-100 text-red-700',
  [SalesInvoiceStatus.CANCELLED]: 'bg-gray-100 text-gray-700',
};

export interface SalesInvoiceItem {
  id: string;
  invoice_id: string;
  productId?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate_id: string | null;
  tax_rate_value: number;
  line_total_ht: number;
  line_tax: number;
  line_total_ttc: number;
  sort_order: number;
}

export interface SalesInvoice {
  sales_order_id: import("react/jsx-runtime").JSX.Element;
  id: string;
  invoice_number: string;
  type: SalesInvoiceType;
  status: SalesInvoiceStatus;
  business_id: string;
  client_id: string;
  client: any;
  purchase_order_id: string | null;
  quote_id: string | null;
  original_invoice_id: string | null;
  date: string;
  due_date: string;
  subtotal_ht: number;
  tax_amount: number;
  timbre_fiscal: number;
  total_ttc: number;
  net_amount: number;
  paid_amount: number;
  notes: string | null;
  pdf_url: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  items: SalesInvoiceItem[];
}

export interface CreateSalesInvoiceItemDto {
  productId?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate_id?: string;
  tax_rate_value: number;
  sort_order?: number;
}

export interface CreateSalesInvoiceDto {
  client_id: string;
  type?: SalesInvoiceType;
  date?: string;
  due_date?: string;
  purchase_order_id?: string;
  quote_id?: string;
  original_invoice_id?: string;
  notes?: string;
  items: CreateSalesInvoiceItemDto[];
}

export interface UpdateSalesInvoiceDto extends Partial<CreateSalesInvoiceDto> {
  status?: SalesInvoiceStatus;
}

export interface SalesInvoicesQueryParams {
  client_id?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedSalesInvoices {
  data: SalesInvoice[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
