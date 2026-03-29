// src/types/recurring-invoice.ts

export enum RecurringFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  [RecurringFrequency.DAILY]: 'Quotidien',
  [RecurringFrequency.WEEKLY]: 'Hebdomadaire',
  [RecurringFrequency.MONTHLY]: 'Mensuel',
  [RecurringFrequency.QUARTERLY]: 'Trimestriel',
  [RecurringFrequency.YEARLY]: 'Annuel',
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
}

export interface UpdateRecurringInvoiceDto extends Partial<CreateRecurringInvoiceDto> {
  is_active?: boolean;
}

export interface RecurringInvoicesQueryParams {
  is_active?: boolean;
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
