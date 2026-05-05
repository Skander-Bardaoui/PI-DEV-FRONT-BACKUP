// src/hooks/useRecurringInvoicePayments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRecurringInvoicePayments,
  getRecurringInvoicePayment,
  validateRecurringInvoicePayment,
  sendRecurringInvoiceReminder,
  ValidatePaymentDto,
} from '@/api/recurring-invoice-payments.api';

export const RECURRING_INVOICE_PAYMENTS_KEY = 'recurring-invoice-payments';

// Get all recurring invoices
export const useRecurringInvoicePayments = () =>
  useQuery({
    queryKey: [RECURRING_INVOICE_PAYMENTS_KEY],
    queryFn: getRecurringInvoicePayments,
  });

// Get single recurring invoice
export const useRecurringInvoicePayment = (id: string) =>
  useQuery({
    queryKey: [RECURRING_INVOICE_PAYMENTS_KEY, id],
    queryFn: () => getRecurringInvoicePayment(id),
    enabled: !!id,
  });

// Validate payment mutation
export const useValidateRecurringInvoicePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ValidatePaymentDto }) =>
      validateRecurringInvoicePayment(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECURRING_INVOICE_PAYMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

// Send reminder mutation
export const useSendRecurringInvoiceReminder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sendRecurringInvoiceReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECURRING_INVOICE_PAYMENTS_KEY] });
    },
  });
};
