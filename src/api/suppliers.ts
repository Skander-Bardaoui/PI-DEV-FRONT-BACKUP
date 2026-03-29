// src/api/suppliers.api.ts
import { ApiMessage, CreateSupplierDto, PaginatedSuppliers, Supplier, SuppliersQueryParams, UpdateSupplierDto } from '@/types';
import axiosInstance from './axiosInstance';


const base = (businessId: string) => `/businesses/${businessId}/suppliers`;

export const getSuppliers = async (
  businessId: string,
  params?: SuppliersQueryParams,
): Promise<PaginatedSuppliers> => {
  const { data } = await axiosInstance.get(base(businessId), { params });
  return data;
};

export const getSupplier = async (
  businessId: string,
  id: string,
): Promise<Supplier> => {
  const { data } = await axiosInstance.get(`${base(businessId)}/${id}`);
  return data;
};

export const createSupplier = async (
  businessId: string,
  dto: CreateSupplierDto,
): Promise<Supplier> => {
  const { data } = await axiosInstance.post(base(businessId), dto);
  return data;
};

export const updateSupplier = async (
  businessId: string,
  id: string,
  dto: UpdateSupplierDto,
): Promise<Supplier> => {
  const { data } = await axiosInstance.patch(`${base(businessId)}/${id}`, dto);
  return data;
};

export const archiveSupplier = async (
  businessId: string,
  id: string,
): Promise<ApiMessage> => {
  const { data } = await axiosInstance.delete(`${base(businessId)}/${id}`);
  return data;
};

export const restoreSupplier = async (
  businessId: string,
  id: string,
): Promise<Supplier> => {
  const { data } = await axiosInstance.patch(`${base(businessId)}/${id}/restore`);
  return data;
};

// Invitation de fournisseur
export const inviteSupplier = async (
  businessId: string,
  dto: { email: string; name?: string },
): Promise<{ message: string; token: string }> => {
  const { data } = await axiosInstance.post(
    `/businesses/${businessId}/supplier-onboarding/invite`,
    dto,
  );
  return data;
};
