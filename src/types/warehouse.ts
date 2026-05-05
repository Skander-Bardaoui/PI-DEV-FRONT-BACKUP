export interface Warehouse {
  id: string;
  business_id: string;
  name: string;
  code: string;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWarehouseDto {
  name: string;
  code: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
}

export interface UpdateWarehouseDto {
  name?: string;
  code?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
}
