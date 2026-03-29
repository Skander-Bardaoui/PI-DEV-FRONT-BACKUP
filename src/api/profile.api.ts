// src/api/profile.api.ts
import axiosInstance from './axiosInstance';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  jobTitle?: string;
  preferredLanguage?: string;
  timezone?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// Get current user profile
export const getMyProfile = async () => {
  const response = await axiosInstance.get('/users/me');
  return response.data;
};

// Update profile
export const updateProfile = async (data: UpdateProfileData) => {
  const response = await axiosInstance.patch('/users/me', data);
  return response.data;
};

// Upload avatar
export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await axiosInstance.post('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Change password
export const changePassword = async (data: ChangePasswordData) => {
  const response = await axiosInstance.patch('/users/me/password', data);
  return response.data;
};
