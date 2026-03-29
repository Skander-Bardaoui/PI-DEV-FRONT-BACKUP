// src/api/delivery-notes.ts
import axiosInstance from './axiosInstance';
import {
  CreateDeliveryNoteDto,
  UpdateDeliveryNoteDto,
  DeliveryNote,
  DeliveryNotesQueryParams,
  PaginatedDeliveryNotes,
} from '@/types/delivery-note';

const base = (businessId: string) => `/businesses/${businessId}/delivery-notes`;

export const getDeliveryNotes = async (
  businessId: string,
  params?: DeliveryNotesQueryParams,
): Promise<PaginatedDeliveryNotes> => {
  const { data } = await axiosInstance.get(base(businessId), { params });
  return data;
};

export const getDeliveryNote = async (
  businessId: string,
  id: string,
): Promise<DeliveryNote> => {
  const { data } = await axiosInstance.get(`${base(businessId)}/${id}`);
  return data;
};

export const createDeliveryNote = async (
  businessId: string,
  dto: CreateDeliveryNoteDto,
): Promise<DeliveryNote> => {
  const { data } = await axiosInstance.post(base(businessId), dto);
  return data;
};

export const updateDeliveryNote = async (
  businessId: string,
  id: string,
  dto: UpdateDeliveryNoteDto,
): Promise<DeliveryNote> => {
  const { data } = await axiosInstance.patch(`${base(businessId)}/${id}`, dto);
  return data;
};

export const markDelivered = async (
  businessId: string,
  id: string,
): Promise<DeliveryNote> => {
  const { data} = await axiosInstance.post(`${base(businessId)}/${id}/deliver`);
  return data;
};

export const cancelDeliveryNote = async (
  businessId: string,
  id: string,
): Promise<DeliveryNote> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/cancel`);
  return data;
};

export const deleteDeliveryNote = async (
  businessId: string,
  id: string,
): Promise<void> => {
  await axiosInstance.delete(`${base(businessId)}/${id}`);
};

export const cleanDuplicates = async (
  businessId: string,
  id: string,
): Promise<DeliveryNote> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/clean-duplicates`);
  return data;
};

export const getDeliveryNotesBySalesOrder = async (
  businessId: string,
  salesOrderId: string,
): Promise<DeliveryNote[]> => {
  const { data } = await axiosInstance.get(`${base(businessId)}`, {
    params: { sales_order_id: salesOrderId },
  });
  return data.data || [];
};
