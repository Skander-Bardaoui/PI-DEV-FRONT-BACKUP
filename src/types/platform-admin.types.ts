// src/types/platform-admin.types.ts

export interface PlatformAdmin {
  id: string;
  email: string;
  totp_enabled: boolean;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PlatformLoginRequest {
  email: string;
  password: string;
}

export interface PlatformLoginResponse {
  message: string;
  totp_required?: boolean;
}

export interface PlatformTotpRequest {
  email: string;
  code: string;
}

export interface PlatformTotpSetupResponse {
  secret: string;
  qrCodeUrl: string;
}

export interface PlatformEnableTotpRequest {
  code: string;
}

export interface PlatformAuthContextType {
  admin: PlatformAdmin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ totp_required?: boolean }>;
  loginWithTotp: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}
