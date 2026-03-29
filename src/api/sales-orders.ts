// src/api/sales-orders.ts
import axiosInstance from './axiosInstance';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  SalesOrder,
  SalesOrdersQueryParams,
  PaginatedSalesOrders,
} from '@/types/sales-order';

const base = (businessId: string) => `/businesses/${businessId}/sales-orders`;

export const getSalesOrders = async (
  businessId: string,
  params?: SalesOrdersQueryParams,
): Promise<PaginatedSalesOrders> => {
  const { data } = await axiosInstance.get(base(businessId), { params });
  return data;
};

export const getSalesOrder = async (
  businessId: string,
  id: string,
): Promise<SalesOrder> => {
  const { data } = await axiosInstance.get(`${base(businessId)}/${id}`);
  return data;
};

export const createSalesOrder = async (
  businessId: string,
  dto: CreateSalesOrderDto,
): Promise<SalesOrder> => {
  const { data } = await axiosInstance.post(base(businessId), dto);
  return data;
};

export const updateSalesOrder = async (
  businessId: string,
  id: string,
  dto: UpdateSalesOrderDto,
): Promise<SalesOrder> => {
  const { data } = await axiosInstance.patch(`${base(businessId)}/${id}`, dto);
  return data;
};

export const startProgressSalesOrder = async (
  businessId: string,
  id: string,
): Promise<SalesOrder> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/start-progress`);
  return data;
};

export const markDeliveredSalesOrder = async (
  businessId: string,
  id: string,
): Promise<SalesOrder> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/mark-delivered`);
  return data;
};

export const markInvoicedSalesOrder = async (
  businessId: string,
  id: string,
): Promise<SalesOrder> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/mark-invoiced`);
  return data;
};

export const cancelSalesOrder = async (
  businessId: string,
  id: string,
): Promise<SalesOrder> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/cancel`);
  return data;
};

export const convertSalesOrderToInvoice = async (
  businessId: string,
  id: string,
): Promise<any> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/convert-to-invoice`);
  return data;
};

export const deleteSalesOrder = async (
  businessId: string,
  id: string,
): Promise<void> => {
  await axiosInstance.delete(`${base(businessId)}/${id}`);
};

export const sendSalesOrderEmail = async (
  businessId: string,
  id: string,
): Promise<{ message: string }> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/send-email`);
  return data;
};
