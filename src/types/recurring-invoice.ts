// src/types/recurring-invoice.ts

export enum RecurringFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum RecurringInvoiceStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  INACTIVE = 'INACTIVE',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  [RecurringFrequency.DAILY]: 'Quotidien',
  [RecurringFrequency.WEEKLY]: 'Hebdomadaire',
  [RecurringFrequency.MONTHLY]: 'Mensuel',
  [RecurringFrequency.QUARTERLY]: 'Trimestriel',
  [RecurringFrequency.YEARLY]: 'Annuel',
};

export const RECURRING_STATUS_LABELS: Record<RecurringInvoiceStatus, string> = {
  [RecurringInvoiceStatus.ACTIVE]: 'Active',
  [RecurringInvoiceStatus.PAUSED]: 'En pause',
  [RecurringInvoiceStatus.INACTIVE]: 'Inactive',
};

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  [DiscountType.PERCENTAGE]: 'Pourcentage',
  [DiscountType.FIXED]: 'Montant fixe',
};

export interface RecurringInvoice {
  id: string;
  business_id: string;
  client_id: string;
  client: any;
  description: string;
  frequency: RecurringFrequency;
  start_date: string;
  end_date: string | null;
  next_invoice_date: string;
  last_generated_date: string | null;
  amount: number;
  tax_rate: number;
  notes: string | null;
  is_active: boolean;
  status: RecurringInvoiceStatus;
  discount_type: DiscountType | null;
  discount_value: number | null;
  invoices_generated: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringInvoiceDto {
  client_id: string;
  description: string;
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string;
  amount: number;
  tax_rate?: number;
  notes?: string;
  discount_type?: DiscountType;
  discount_value?: number;
}

export interface UpdateRecurringInvoiceDto extends Partial<CreateRecurringInvoiceDto> {
  is_active?: boolean;
}

export interface RecurringInvoicesQueryParams {
  status?: RecurringInvoiceStatus;
  frequency?: RecurringFrequency;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedRecurringInvoices {
  data: RecurringInvoice[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface RecurringInvoiceStats {
  total_active: number;
  total_inactive: number;
  total_paused: number;
  monthly_revenue_forecast: number;
  invoices_generated_this_month: number;
  activation_rate: number;
}

export interface BulkUpdateRecurringInvoicesDto {
  ids: string[];
  action: 'activate' | 'pause' | 'delete';
}

export interface InvoiceHistoryItem {
  id: string;
  invoice_number: string;
  created_at: string;
  total_ttc: number;
  status: string;
}
