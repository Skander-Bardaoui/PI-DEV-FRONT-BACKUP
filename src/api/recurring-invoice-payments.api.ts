// src/api/recurring-invoice-payments.api.ts
import axiosInstance from './axiosInstance';

export interface RecurringInvoicePayment {
  id: string;
  business_id: string;
  client_id: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  description: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  start_date: string;
  end_date: string | null;
  next_invoice_date: string;
  last_generated_date: string | null;
  amount: number;
  tax_rate: number;
  notes: string | null;
  is_active: boolean;
  status: 'ACTIVE' | 'PAUSED' | 'INACTIVE';
  discount_type: 'PERCENTAGE' | 'FIXED' | null;
  discount_value: number | null;
  invoices_generated: number;
  created_at: string;
  updated_at: string;
}

export interface ValidatePaymentDto {
  account_id: string;
  payment_date: string;
  reference?: string;
  notes?: string;
}

// Get all recurring invoices for the business
export const getRecurringInvoicePayments = async (): Promise<RecurringInvoicePayment[]> => {
  const response = await axiosInstance.get<RecurringInvoicePayment[]>('/recurring-invoice-payments');
  return response.data;
};

// Get single recurring invoice
export const getRecurringInvoicePayment = async (id: string): Promise<RecurringInvoicePayment> => {
  const response = await axiosInstance.get<RecurringInvoicePayment>(`/recurring-invoice-payments/${id}`);
  return response.data;
};

// Validate payment for recurring invoice
export const validateRecurringInvoicePayment = async (
  id: string,
  dto: ValidatePaymentDto,
): Promise<{
  message: string;
  transaction: any;
  recurringInvoice: RecurringInvoicePayment;
  amount: number;
}> => {
  const response = await axiosInstance.post(`/recurring-invoice-payments/${id}/validate-payment`, dto);
  return response.data;
};

// Send reminder email
export const sendRecurringInvoiceReminder = async (id: string): Promise<{
  message: string;
  sentTo: string;
}> => {
  const response = await axiosInstance.post(`/recurring-invoice-payments/${id}/send-reminder`);
  return response.data;
};
