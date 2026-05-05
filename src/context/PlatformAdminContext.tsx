// src/context/PlatformAdminContext.tsx
import { createContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlatformAdmin,
  PlatformAuthContextType,
} from '../types/platform-admin.types';
import {
  platformLogin,
  platformLoginWithTotp,
  getPlatformAdmin,
  platformLogout,
} from '../api/platform-admin.api';

// ─── Create Context ──────────────────────────────────────────────────────
export const PlatformAdminContext = createContext<PlatformAuthContextType | undefined>(
  undefined
);

// ─── Provider Component ──────────────────────────────────────────────────
export function PlatformAdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // ─── On Mount: Check if Admin is Already Logged In ──────────────────────
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const adminData = await getPlatformAdmin();
        setAdmin(adminData);
      } catch (error) {
        console.log('No active platform admin session');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ─── Login Function (Step 1) ─────────────────────────────────────────────
  const login = async (
    email: string,
    password: string
  ): Promise<{ totp_required?: boolean }> => {
    try {
      const response = await platformLogin({ email, password });

      if (response.totp_required) {
        return { totp_required: true };
      }

      // No TOTP required, fetch admin data
      const adminData = await getPlatformAdmin();
      setAdmin(adminData);
      navigate('/console/dashboard');

      return {};
    } catch (error: any) {
      console.error('Platform login failed:', error);
      throw new Error(
        error.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    }
  };

  // ─── Login with TOTP (Step 2) ────────────────────────────────────────────
  const loginWithTotp = async (email: string, code: string): Promise<void> => {
    try {
      await platformLoginWithTotp({ email, code });

      // Fetch admin data after successful TOTP verification
      const adminData = await getPlatformAdmin();
      setAdmin(adminData);
      navigate('/console/dashboard');
    } catch (error: any) {
      console.error('TOTP verification failed:', error);
      throw new Error(
        error.response?.data?.message || 'Invalid verification code.'
      );
    }
  };

  // ─── Logout Function ─────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await platformLogout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      setAdmin(null);
      navigate('/console/login');
    }
  };

  // ─── Refresh Admin Data ──────────────────────────────────────────────────
  const refreshAdmin = async () => {
    try {
      const adminData = await getPlatformAdmin();
      setAdmin(adminData);
    } catch (error) {
      console.error('Failed to refresh admin data:', error);
    }
  };

  // ─── Context Value ───────────────────────────────────────────────────────
  const value: PlatformAuthContextType = {
    admin,
    isLoading,
    isAuthenticated: !!admin,
    login,
    loginWithTotp,
    logout,
    refreshAdmin,
  };

  return (
    <PlatformAdminContext.Provider value={value}>
      {children}
    </PlatformAdminContext.Provider>
  );
}
