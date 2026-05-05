// src/api/clients.ts
import axiosInstance from './axiosInstance';

export interface Client {
  id: string;
  business_id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  billing_details?: string;
  communication_history?: string;
  has_portal_access: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedClients {
  clients: Client[];
  total: number;
  page: number;
  limit: number;
}

export interface InviteClientDto {
  email: string;
  name?: string;
}

export interface CompleteClientOnboardingDto {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  billing_details?: string;
}

const base = (businessId: string) => `/businesses/${businessId}/sales/clients`;
const onboardingBase = (businessId: string) => `/businesses/${businessId}/sales/client-onboarding`;

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

export const createClient = async (
  businessId: string,
  dto: Partial<Client>
): Promise<Client> => {
  const { data } = await axiosInstance.post(base(businessId), dto);
  return data;
};

export const updateClient = async (
  businessId: string,
  id: string,
  dto: Partial<Client>
): Promise<Client> => {
  const { data } = await axiosInstance.patch(`${base(businessId)}/${id}`, dto);
  return data;
};

export const deleteClient = async (
  businessId: string,
  id: string
): Promise<void> => {
  await axiosInstance.delete(`${base(businessId)}/${id}`);
};

// Client Onboarding APIs
export const inviteClient = async (
  businessId: string,
  dto: InviteClientDto
): Promise<{ message: string; token: string; invitationLink: string }> => {
  const { data } = await axiosInstance.post(`${onboardingBase(businessId)}/invite`, dto);
  return data;
};

export const getInvitationDetails = async (
  token: string
): Promise<{ email: string; name?: string; businessName: string }> => {
  const { data } = await axiosInstance.get(`/businesses/any/sales/client-onboarding/invitation/${token}`);
  return data;
};

export const completeClientOnboarding = async (
  token: string,
  dto: CompleteClientOnboardingDto
): Promise<Client> => {
  const { data } = await axiosInstance.post(`/businesses/any/sales/client-onboarding/invitation/${token}/complete`, dto);
  return data;
};
