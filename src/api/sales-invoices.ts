// src/api/sales-invoices.ts
import axiosInstance from './axiosInstance';
import {
  CreateSalesInvoiceDto,
  UpdateSalesInvoiceDto,
  SalesInvoice,
  SalesInvoicesQueryParams,
  PaginatedSalesInvoices,
} from '@/types/sales-invoice';

const base = (businessId: string) => `/businesses/${businessId}/invoices`;

export const getSalesInvoices = async (
  businessId: string,
  params?: SalesInvoicesQueryParams,
): Promise<PaginatedSalesInvoices> => {
  const { data } = await axiosInstance.get(base(businessId), { params });
  return data;
};

export const getSalesInvoice = async (
  businessId: string,
  id: string,
): Promise<SalesInvoice> => {
  const { data } = await axiosInstance.get(`${base(businessId)}/${id}`);
  return data;
};

export const createSalesInvoice = async (
  businessId: string,
  dto: CreateSalesInvoiceDto,
): Promise<SalesInvoice> => {
  const { data } = await axiosInstance.post(base(businessId), dto);
  return data;
};

export const updateSalesInvoice = async (
  businessId: string,
  id: string,
  dto: UpdateSalesInvoiceDto,
): Promise<SalesInvoice> => {
  const { data } = await axiosInstance.patch(`${base(businessId)}/${id}`, dto);
  return data;
};

export const sendSalesInvoice = async (
  businessId: string,
  id: string,
): Promise<SalesInvoice> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/send`);
  return data;
};

export const markPartiallyPaidSalesInvoice = async (
  businessId: string,
  id: string,
): Promise<SalesInvoice> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/mark-partially-paid`);
  return data;
};

export const markPaidSalesInvoice = async (
  businessId: string,
  id: string,
): Promise<SalesInvoice> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/mark-paid`);
  return data;
};

export const markOverdueSalesInvoice = async (
  businessId: string,
  id: string,
): Promise<SalesInvoice> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/mark-overdue`);
  return data;
};

export const cancelSalesInvoice = async (
  businessId: string,
  id: string,
): Promise<SalesInvoice> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/cancel`);
  return data;
};

export const deleteSalesInvoice = async (
  businessId: string,
  id: string,
): Promise<void> => {
  await axiosInstance.delete(`${base(businessId)}/${id}`);
};
