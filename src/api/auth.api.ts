// src/api/auth.api.ts
import axiosInstance from './axiosInstance';
import {
  LoginRequest,
  RegisterRequest,
  User,
} from '../types/auth.types';

// ─── Register ────────────────────────────────────────────────────────────
export const registerUser = async (data: RegisterRequest): Promise<{ message: string; user: any }> => {
  const response = await axiosInstance.post('/auth/register', data);
  return response.data;
};

// ─── Login ───────────────────────────────────────────────────────────────
export const loginUser = async (data: LoginRequest): Promise<{ message: string; user: any }> => {
  const response = await axiosInstance.post('/auth/login', data);
  return response.data;
};

// ─── Get Current User ────────────────────────────────────────────────────
export const getCurrentUser = async (): Promise<User> => {
  const response = await axiosInstance.get<User>('/auth/me');
  return response.data;
};

// ─── Logout ──────────────────────────────────────────────────────────────
export const logoutUser = async (): Promise<void> => {
  await axiosInstance.post('/auth/logout');
};

// ─── Update Profile ──────────────────────────────────────────────────────
export const updateProfile = async (data: {
  name?: string;
  email?: string;
  password?: string;
}): Promise<User> => {
  const response = await axiosInstance.patch<User>('/auth/profile', data);
  return response.data;
};

// ─── Verify Email ────────────────────────────────────────────────────────
export const verifyEmail = async (token: string): Promise<void> => {
  await axiosInstance.post('/auth/verify-email', { token });
};

// ─── Forgot Password ─────────────────────────────────────────────────────
export const forgotPassword = async (email: string): Promise<void> => {
  await axiosInstance.post('/auth/forgot-password', { email });
};

// ─── Reset Password ──────────────────────────────────────────────────────
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  await axiosInstance.post('/auth/reset-password', { token, newPassword });
};