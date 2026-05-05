// src/api/axiosInstance.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ─── Base Configuration ──────────────────────────────────────────────────
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001', // Your NestJS backend
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
});

// ─── Request Interceptor: Log requests for debugging ──────────
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log requests to three-way-matching for debugging
    if (config.url?.includes('three-way-matching')) {
      console.log('🔍 Three-way-matching request:', {
        url: config.url,
        method: config.method,
        withCredentials: config.withCredentials,
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Response Interceptor: Auto Refresh on 401 ───────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response, // Pass through successful responses
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn('⚠️ 401 Unauthorized:', {
        url: originalRequest.url,
        hasRetried: originalRequest._retry,
      });
      
      // Don't retry login/register/refresh/me endpoints during initial auth
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/me')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint - cookies are sent automatically
        await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Refresh succeeded, process queued requests
        processQueue(null);

        // Retry original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        
        // Check if it's a network error vs auth error
        const isNetworkError = !refreshError || !(refreshError as any).response;
        
        if (isNetworkError) {
          console.error('Network error during token refresh');
          // Don't logout on network errors, let the user retry
          return Promise.reject(new Error('Network error. Please check your connection.'));
        }
        
        // Refresh failed → redirect to login only if not already on auth pages
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register')) {
          console.warn('Session expired, redirecting to login');
          // Clear any stored data
          localStorage.removeItem('currentBusinessId');
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Log other errors for debugging
    if (error.response?.status && error.response.status >= 500) {
      console.error('Server error:', error.response.status, originalRequest.url);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;