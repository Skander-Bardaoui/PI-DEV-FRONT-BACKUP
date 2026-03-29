export interface Category {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products?: Product[];
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface QueryCategoriesDto {
  search?: string;
  is_active?: boolean;
}

// Import Product type to avoid circular dependency
interface Product {
  id: string;
  name: string;
}
