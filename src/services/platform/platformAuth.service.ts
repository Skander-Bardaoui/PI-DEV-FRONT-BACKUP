// src/services/platform/platformAuth.service.ts
import { platformAxios } from './platformAxios';
import { PlatformAdmin } from '@/types/platform-admin.types';

export const platformAuthService = {
  async login(email: string, password: string) {
    const { data } = await platformAxios.post('/auth/login', { email, password });
    return data;
  },

  async loginWithTotp(email: string, code: string) {
    const { data } = await platformAxios.post('/auth/login/totp', { email, code });
    return data;
  },

  async getMe(): Promise<PlatformAdmin> {
    const { data } = await platformAxios.get('/auth/me');
    return data;
  },

  async logout() {
    await platformAxios.post('/auth/logout');
  },

  async setupTotp() {
    const { data } = await platformAxios.post('/auth/setup-totp');
    return data;
  },

  async enableTotp(code: string) {
    const { data } = await platformAxios.post('/auth/enable-totp', { code });
    return data;
  },
};
