// src/types/supplier.types.ts

// ── Entité Supplier ───────────────────────────────────────────────────────
export interface Supplier {
  id: string;
  business_id: string;
  name: string;
  matricule_fiscal: string | null;
  email: string | null;
  phone: string | null;
  address: {
    street?:      string;
    city?:        string;
    postal_code?: string;
    country?:     string;
  } | null;
  rib:           string | null;
  bank_name:     string | null;
  payment_terms: number;
  category:      string | null;
  is_active:     boolean;
  notes:         string | null;
  created_at:    string;
  updated_at:    string;
}

// ── DTOs ─────────────────────────────────────────────────────────────────
export interface CreateSupplierDto {
  name:              string;
  matricule_fiscal?: string;
  email?:            string;
  phone?:            string;
  address?: {
    street?:      string;
    city?:        string;
    postal_code?: string;
    country?:     string;
  };
  rib?:           string;
  bank_name?:     string;
  payment_terms?: number;
  category?:      string;
  notes?:         string;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {
  is_active?: boolean;
}

// ── Query Params ──────────────────────────────────────────────────────────
export interface SuppliersQueryParams {
  search?:    string;
  category?:  string;
  is_active?: boolean;
  page?:      number;
  limit?:     number;
}

// ── Réponse paginée ───────────────────────────────────────────────────────
export interface PaginatedSuppliers {
  data:        Supplier[];
  total:       number;
  page:        number;
  limit:       number;
  total_pages: number;
}