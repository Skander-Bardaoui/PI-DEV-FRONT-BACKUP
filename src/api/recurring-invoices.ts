// src/api/recurring-invoices.ts
import axiosInstance from './axiosInstance';
import {
  CreateRecurringInvoiceDto,
  UpdateRecurringInvoiceDto,
  RecurringInvoice,
  RecurringInvoicesQueryParams,
  PaginatedRecurringInvoices,
  RecurringInvoiceStats,
  BulkUpdateRecurringInvoicesDto,
  InvoiceHistoryItem,
} from '@/types/recurring-invoice';

const base = (businessId: string) => `/businesses/${businessId}/recurring-invoices`;

export const getRecurringInvoices = async (
  businessId: string,
  params?: RecurringInvoicesQueryParams,
): Promise<PaginatedRecurringInvoices> => {
  const { data } = await axiosInstance.get(base(businessId), { params });
  return data;
};

export const getRecurringInvoice = async (
  businessId: string,
  id: string,
): Promise<RecurringInvoice> => {
  const { data } = await axiosInstance.get(`${base(businessId)}/${id}`);
  return data;
};

export const getRecurringInvoiceStats = async (
  businessId: string,
): Promise<RecurringInvoiceStats> => {
  const { data } = await axiosInstance.get(`${base(businessId)}/stats`);
  return data;
};

export const createRecurringInvoice = async (
  businessId: string,
  dto: CreateRecurringInvoiceDto,
): Promise<RecurringInvoice> => {
  const { data } = await axiosInstance.post(base(businessId), dto);
  return data;
};

export const updateRecurringInvoice = async (
  businessId: string,
  id: string,
  dto: UpdateRecurringInvoiceDto,
): Promise<RecurringInvoice> => {
  const { data } = await axiosInstance.patch(`${base(businessId)}/${id}`, dto);
  return data;
};

export const deleteRecurringInvoice = async (
  businessId: string,
  id: string,
): Promise<void> => {
  await axiosInstance.delete(`${base(businessId)}/${id}`);
};

export const activateRecurringInvoice = async (
  businessId: string,
  id: string,
): Promise<RecurringInvoice> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/activate`);
  return data;
};

export const deactivateRecurringInvoice = async (
  businessId: string,
  id: string,
): Promise<RecurringInvoice> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/deactivate`);
  return data;
};

export const pauseRecurringInvoice = async (
  businessId: string,
  id: string,
): Promise<RecurringInvoice> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/pause`);
  return data;
};

export const resumeRecurringInvoice = async (
  businessId: string,
  id: string,
): Promise<RecurringInvoice> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/resume`);
  return data;
};

export const bulkUpdateRecurringInvoices = async (
  businessId: string,
  dto: BulkUpdateRecurringInvoicesDto,
): Promise<{ success: boolean; affected: number }> => {
  const { data } = await axiosInstance.patch(`${base(businessId)}/bulk`, dto);
  return data;
};

export const getRecurringInvoiceHistory = async (
  businessId: string,
  id: string,
  page = 1,
  limit = 10,
): Promise<{ data: InvoiceHistoryItem[]; total: number; page: number; limit: number; total_pages: number }> => {
  const { data } = await axiosInstance.get(`${base(businessId)}/${id}/invoices`, {
    params: { page, limit },
  });
  return data;
};
