// src/api/clients.ts
import axiosInstance from './axiosInstance';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedClients {
  clients: Client[];
  total: number;
  page: number;
  limit: number;
}

const base = (businessId: string) => `/businesses/${businessId}/clients`;

export const getClients = async (
  businessId: string,
  params?: { page?: number; limit?: number; search?: string }
): Promise<PaginatedClients> => {
  const { data } = await axiosInstance.get(base(businessId), { params });
  return data;
};

export const getClient = async (
  businessId: string,
  id: string
): Promise<Client> => {
  const { data } = await axiosInstance.get(`${base(businessId)}/${id}`);
  return data;
};
