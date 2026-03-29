// src/types/auth.types.ts

// ─── User Roles (matching backend enum) ─────────────────────────────────
export enum Role {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  BUSINESS_ADMIN = 'BUSINESS_ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
  TEAM_MEMBER = 'TEAM_MEMBER',
  CLIENT = 'CLIENT',
}

// ─── User Entity (matching backend User without password_hash) ──────────
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  is_verified: boolean;
  business_id: string | null;
  is_suspended: boolean;
  avatarUrl?: string;
  jobTitle?: string;
  preferredLanguage?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

// ─── API Request Payloads ────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  // User Info - Updated to firstName + lastName
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone_number?: string;

  // Tenant Info
  tenant: {
    name: string;
    domain?: string;
    contactEmail?: string;
    description?: string;
  };
  
  // Business Info
  business: {
    name: string;
    logo?: string;
    tax_id?: string;
    currency: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };
  
  // Tax Rate Info
  taxRate: {
    name: string;
    rate: number;
    is_default: boolean;
  };
}
export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  password?: string;
}

// ─── API Response Types ──────────────────────────────────────────────────
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse extends AuthResponse {}

export interface RegisterResponse extends AuthResponse {}

export interface RefreshResponse extends AuthResponse {}

// ─── Auth Context State ──────────────────────────────────────────────────
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}