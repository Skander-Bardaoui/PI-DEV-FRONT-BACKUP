// src/context/AuthContext.tsx
import { createContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  AuthContextType,
  RegisterRequest,
  Role,
} from '../types/auth.types';
import {
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser,
} from '../api/auth.api';

// ─── Create Context ──────────────────────────────────────────────────────
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider Component ──────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // ─── On Mount: Check if User is Already Logged In ─────────────────────
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to fetch user data from /auth/me
        // If there's a valid cookie, this will succeed
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        // No valid session, user is not logged in
        console.log('No active session');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ─── Login Function ──────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    try {
      await loginUser({ email, password });
      
      // Fetch user data after successful login
      const userData = await getCurrentUser();
      setUser(userData);
      
      // Redirect based on role
      if (userData.role === Role.CLIENT) {
        navigate('/portal');
      } else {
        navigate('/app');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(
        error.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    }
  };

  // ─── Register Function ───────────────────────────────────────────────
  const register = async (data: RegisterRequest) => {
    try {
      await registerUser(data);
      
      // Fetch user data after successful registration
      const userData = await getCurrentUser();
      setUser(userData);
      
      // Redirect to dashboard
      navigate('/app');
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw new Error(
        error.response?.data?.message || 'Registration failed. Please try again.'
      );
    }
  };

  // ─── Logout Function ─────────────────────────────────────────────────
  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local state
      setUser(null);
      navigate('/login');
    }
  };

  // ─── Refresh User Data ───────────────────────────────────────────────
  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // ─── Context Value ───────────────────────────────────────────────────
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}