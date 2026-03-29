// src/api/tenant.api.ts
import axiosInstance from './axiosInstance';

export interface UpdateTenantData {
  name?: string;
  domain?: string;
  contactEmail?: string;
  description?: string;
}

// Get my tenant (for BUSINESS_OWNER)
export const getMyTenant = async () => {
  const response = await axiosInstance.get('/tenants/my');
  return response.data;
};

// Update my tenant
export const updateMyTenant = async (data: UpdateTenantData) => {
  const response = await axiosInstance.patch('/tenants/my', data);
  return response.data;
};

// Upload tenant logo
export const uploadTenantLogo = async (file: File) => {
  const formData = new FormData();
  formData.append('logo', file);
  
  const response = await axiosInstance.post('/tenants/my/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
