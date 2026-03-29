// src/api/supplier-pos.api.ts
import { CreateSupplierPODto, PaginatedSupplierPOs, SupplierPO, SupplierPOsQueryParams, UpdateSupplierPODto } from '@/types';
import axiosInstance from './axiosInstance';


const base = (businessId: string) => `/businesses/${businessId}/supplier-pos`;

export const getSupplierPOs = async (
  businessId: string,
  params?: SupplierPOsQueryParams,
): Promise<PaginatedSupplierPOs> => {
  const { data } = await axiosInstance.get(base(businessId), { params });
  return data;
};

export const getSupplierPO = async (
  businessId: string,
  id: string,
): Promise<SupplierPO> => {
  const { data } = await axiosInstance.get(`${base(businessId)}/${id}`);
  return data;
};

export const createSupplierPO = async (
  businessId: string,
  dto: CreateSupplierPODto,
): Promise<SupplierPO> => {
  const { data } = await axiosInstance.post(base(businessId), dto);
  return data;
};

export const updateSupplierPO = async (
  businessId: string,
  id: string,
  dto: UpdateSupplierPODto,
): Promise<SupplierPO> => {
  const { data } = await axiosInstance.patch(`${base(businessId)}/${id}`, dto);
  return data;
};

export const sendSupplierPO = async (
  businessId: string,
  id: string,
): Promise<SupplierPO> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/send`);
  return data;
};

export const confirmSupplierPO = async (
  businessId: string,
  id: string,
): Promise<SupplierPO> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/confirm`);
  return data;
};

export const cancelSupplierPO = async (
  businessId: string,
  id: string,
): Promise<SupplierPO> => {
  const { data } = await axiosInstance.post(`${base(businessId)}/${id}/cancel`);
  return data;
};