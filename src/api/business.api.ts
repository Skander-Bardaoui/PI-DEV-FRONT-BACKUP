// src/api/business.api.ts
import axiosInstance from './axiosInstance';

export interface CreateBusinessData {
  name: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  currency?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface UpdateBusinessData {
  name?: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  currency?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

// Get all businesses for current user's tenant
export const getMyBusinesses = async () => {
  const response = await axiosInstance.get('/businesses/my');
  return response.data;
};

// Create a new business
export const createBusiness = async (data: CreateBusinessData) => {
  const response = await axiosInstance.post('/businesses', data);
  return response.data;
};

// Update a business
export const updateBusiness = async (id: string, data: UpdateBusinessData) => {
  const response = await axiosInstance.patch(`/businesses/${id}`, data);
  return response.data;
};

// Delete a business
export const deleteBusiness = async (id: string) => {
  const response = await axiosInstance.delete(`/businesses/${id}`);
  return response.data;
};

// Get business settings
export const getBusinessSettings = async (id: string) => {
  const response = await axiosInstance.get(`/businesses/${id}/settings`);
  return response.data;
};

// Update business settings
export const updateBusinessSettings = async (id: string, data: {
  tax_rate?: number;
  invoice_prefix?: string;
  payment_terms?: number;
  invoice_template?: object;
  other_settings?: object;
}) => {
  const response = await axiosInstance.patch(`/businesses/${id}/settings`, data);
  return response.data;
};
