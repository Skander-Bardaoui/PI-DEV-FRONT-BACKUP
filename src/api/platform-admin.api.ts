// src/api/platform-admin.api.ts
import axios from 'axios';
import {
  PlatformAdmin,
  PlatformLoginRequest,
  PlatformLoginResponse,
  PlatformTotpRequest,
  PlatformTotpSetupResponse,
  PlatformEnableTotpRequest,
} from '../types/platform-admin.types';

// Create a separate axios instance for platform admin
const platformAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies
});

// ─── Login (Step 1) ──────────────────────────────────────────────────────
export const platformLogin = async (
  data: PlatformLoginRequest
): Promise<PlatformLoginResponse> => {
  const response = await platformAxios.post('/platform/auth/login', data);
  return response.data;
};

// ─── Login with TOTP (Step 2) ────────────────────────────────────────────
export const platformLoginWithTotp = async (
  data: PlatformTotpRequest
): Promise<{ message: string }> => {
  const response = await platformAxios.post('/platform/auth/login/totp', data);
  return response.data;
};

// ─── Get Current Admin ───────────────────────────────────────────────────
export const getPlatformAdmin = async (): Promise<PlatformAdmin> => {
  const response = await platformAxios.get<PlatformAdmin>('/platform/auth/me');
  return response.data;
};

// ─── Logout ──────────────────────────────────────────────────────────────
export const platformLogout = async (): Promise<void> => {
  await platformAxios.post('/platform/auth/logout');
};

// ─── Refresh Token ───────────────────────────────────────────────────────
export const platformRefresh = async (): Promise<void> => {
  await platformAxios.post('/platform/auth/refresh');
};

// ─── Setup TOTP ──────────────────────────────────────────────────────────
export const setupPlatformTotp = async (): Promise<PlatformTotpSetupResponse> => {
  const response = await platformAxios.post<PlatformTotpSetupResponse>(
    '/platform/auth/setup-totp'
  );
  return response.data;
};

// ─── Enable TOTP ─────────────────────────────────────────────────────────
export const enablePlatformTotp = async (
  data: PlatformEnableTotpRequest
): Promise<{ message: string }> => {
  const response = await platformAxios.post('/platform/auth/enable-totp', data);
  return response.data;
};

// ─── Plans Management ────────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_annual: number;
  max_users?: number;
  max_businesses?: number;
  features: string[];
  ai_enabled: boolean;
  trial_days?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdatePlanDto {
  name?: string;
  price_monthly?: number;
  price_annual?: number;
  is_active?: boolean;
}

// Get all plans (platform admin only)
export const getPlatformPlans = async (): Promise<Plan[]> => {
  const response = await platformAxios.get<Plan[]>('/api/platform/plans');
  return response.data;
};

// Update a plan (platform admin only)
export const updatePlatformPlan = async (
  planId: string,
  data: UpdatePlanDto
): Promise<Plan> => {
  const response = await platformAxios.patch<Plan>(`/api/platform/plans/${planId}`, data);
  return response.data;
};

// Seed default plans (platform admin only)
export const seedPlatformPlans = async (): Promise<{ message: string }> => {
  const response = await platformAxios.post('/api/platform/plans/seed');
  return response.data;
};
