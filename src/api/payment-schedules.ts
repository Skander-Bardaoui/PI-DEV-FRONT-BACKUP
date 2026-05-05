import api from './axiosInstance';

export const paymentSchedulesApi = {
  create: (businessId: string, data: CreateSchedulePayload) =>
    api.post(`/businesses/${businessId}/payment-schedules`, data),

  getByInvoice: (businessId: string, invoiceId: string) =>
    api.get(`/businesses/${businessId}/payment-schedules/invoice/${invoiceId}`),

  getOne: (businessId: string, scheduleId: string) =>
    api.get(`/businesses/${businessId}/payment-schedules/${scheduleId}`),

  payInstallment: (
    businessId: string,
    scheduleId: string,
    installmentId: string,
    data: PayInstallmentPayload,
  ) =>
    api.post(
      `/businesses/${businessId}/payment-schedules/${scheduleId}/installments/${installmentId}/pay`,
      data,
    ),
};

export interface InstallmentLine {
  due_date: string;
  amount: number;
  payment_method: string;
  reference?: string | null;
  notes?: string | null;
}

export interface CreateSchedulePayload {
  purchase_invoice_id: string;
  notes?: string | null;
  installments: InstallmentLine[];
}

export interface PayInstallmentPayload {
  account_id: string;
  payment_method: string;
  paid_at?: string;
  reference?: string | null;
  notes?: string | null;
}
