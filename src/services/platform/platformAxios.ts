// src/services/platform/platformAxios.ts
import axios from 'axios';

export const platformAxios = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/platform`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Response interceptor for error handling
platformAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login for 401 errors that are NOT from password verification
    // (i.e., actual authentication failures, not wrong password in delete flow)
    if (error.response?.status === 401 && !error.config?.url?.includes('/tenants/')) {
      // Redirect to console login if unauthorized
      window.location.href = '/console/login';
    }
    return Promise.reject(error);
  }
);
