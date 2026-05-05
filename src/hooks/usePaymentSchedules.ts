import { useState, useCallback } from 'react';
import { paymentSchedulesApi, CreateSchedulePayload, PayInstallmentPayload } from '@/api/payment-schedules';

export function usePaymentSchedules(businessId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const createSchedule = useCallback(async (data: CreateSchedulePayload) => {
    setLoading(true); setError(null);
    try {
      const res = await paymentSchedulesApi.create(businessId, data);
      return res.data;
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error creating schedule');
      throw e;
    } finally { setLoading(false); }
  }, [businessId]);

  const getByInvoice = useCallback(async (invoiceId: string) => {
    setLoading(true); setError(null);
    try {
      const res = await paymentSchedulesApi.getByInvoice(businessId, invoiceId);
      return res.data;
    } catch { return null; }
    finally { setLoading(false); }
  }, [businessId]);

  const payInstallment = useCallback(async (
    scheduleId: string,
    installmentId: string,
    data: PayInstallmentPayload,
  ) => {
    setLoading(true); setError(null);
    try {
      const res = await paymentSchedulesApi.payInstallment(businessId, scheduleId, installmentId, data);
      return res.data;
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error paying installment');
      throw e;
    } finally { setLoading(false); }
  }, [businessId]);

  return { loading, error, createSchedule, getByInvoice, payInstallment };
}
