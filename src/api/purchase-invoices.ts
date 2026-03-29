// src/api/purchase-invoices.api.ts
import {
  CreatePurchaseInvoiceDto,
  DisputeInvoiceDto,
  PaginatedPurchaseInvoices,
  PurchaseInvoice,
  PurchaseInvoicesQueryParams,
  UpdatePaymentAmountDto,
  UpdatePurchaseInvoiceDto
} from '@/types';
import axiosInstance from './axiosInstance';

const base = (businessId: string) =>
  `/businesses/${businessId}/purchase-invoices`;

export const getPurchaseInvoices = async (
  businessId: string,
  params?: PurchaseInvoicesQueryParams,
): Promise<PaginatedPurchaseInvoices> => {
  const { data } = await axiosInstance.get(base(businessId), { params });
  return data;
};

export const getPurchaseInvoice = async (
  businessId: string,
  id: string,
): Promise<PurchaseInvoice> => {
  const { data } = await axiosInstance.get(`${base(businessId)}/${id}`);
  return data;
};

// ✅ FROM main (keep it)
export const getPurchaseInvoicesByPO = async (
  businessId: string,
  poId: string,
): Promise<PurchaseInvoice[]> => {
  const { data } = await axiosInstance.get(`${base(businessId)}/by-po/${poId}`);
  return data;
};

export const createPurchaseInvoice = async (
  businessId: string,
  dto: CreatePurchaseInvoiceDto,
): Promise<PurchaseInvoice> => {
  const { data } = await axiosInstance.post(base(businessId), dto);
  return data;
};

export const updatePurchaseInvoice = async (
  businessId: string,
  id: string,
  dto: UpdatePurchaseInvoiceDto,
): Promise<PurchaseInvoice> => {
  const { data } = await axiosInstance.patch(`${base(businessId)}/${id}`, dto);
  return data;
};

export const approvePurchaseInvoice = async (
  businessId: string,
  id: string,
): Promise<PurchaseInvoice> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/approve`);
  return data;
};

export const disputePurchaseInvoice = async (
  businessId: string,
  id: string,
  dto: DisputeInvoiceDto,
): Promise<PurchaseInvoice> => {
  const { data } = await axiosInstance.post(
    `${base(businessId)}/${id}/dispute`,
    dto,
  );
  return data;
};

export const resolveDisputePurchaseInvoice = async (
  businessId: string,
  id: string,
): Promise<PurchaseInvoice> => {
  const { data } = await axiosInstance.post(
    `${base(businessId)}/${id}/resolve-dispute`,
  );
  return data;
};

export const updatePaymentAmount = async (
  businessId: string,
  id: string,
  dto: UpdatePaymentAmountDto,
): Promise<PurchaseInvoice> => {
  const { data } = await axiosInstance.patch(
    `${base(businessId)}/${id}/payment`,
    dto,
  );
  return data;
};

//////// treasury ////////
// ✅ FROM Achraf branch (keep it)
export const getApprovedOrPartialInvoices = async (
  businessId: string,
  params?: PurchaseInvoicesQueryParams,
): Promise<PaginatedPurchaseInvoices> => {
  const { data } = await axiosInstance.get(
    `${base(businessId)}/approved-partial`,
    { params }
  );
  return data;
};