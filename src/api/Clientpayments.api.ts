// src/api/clientPayments.api.ts
import axiosInstance from './axiosInstance';
import { PaymentMethod } from '@/types/PaymentMethod';

// ─── DTOs ─────────────────────────────────────────────────────────────────
export interface CreatePaymentDto {
  invoice_id:   string;
  account_id:   string;
  amount:       number;
  payment_date: string;        // "YYYY-MM-DD"
  method:       PaymentMethod;
  reference?:   string;
  notes?:       string;
}

export interface ClientPayment {
  id:           string;
  business_id:  string;
  invoice_id:   string;
  account_id:   string;
  amount:       number;
  payment_date: string;
  method:       PaymentMethod;
  reference?:   string;
  notes?:       string;
  created_by:   string;
  created_at:   string;
  invoice?:     any;
  account?:     any;
}

// ─── Endpoints ────────────────────────────────────────────────────────────

// POST /payments
export const createPayment = async (
  dto: CreatePaymentDto,
): Promise<ClientPayment> => {
  const { data } = await axiosInstance.post<ClientPayment>('/payments', dto);
  return data;
};

// GET /payments
export const getPayments = async (): Promise<ClientPayment[]> => {
  const { data } = await axiosInstance.get<ClientPayment[]>('/payments');
  return data;
};

// GET /payments/:id
export const getPayment = async (id: string): Promise<ClientPayment> => {
  const { data } = await axiosInstance.get<ClientPayment>(`/payments/${id}`);
  return data;
};

// GET /payments/invoice/:invoiceId
export const getPaymentsByInvoice = async (
  invoiceId: string,
): Promise<ClientPayment[]> => {
  const { data } = await axiosInstance.get<ClientPayment[]>(
    `/payments/invoice/${invoiceId}`,
  );
  return data;
};
