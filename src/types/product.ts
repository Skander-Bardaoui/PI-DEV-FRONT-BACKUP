import { Category } from './category';

export interface StockProduct {
  sku: string;
  price: any;
  cost: import("react/jsx-runtime").JSX.Element;
  quantity: any;
  minQuantity: any;
  isActive: any;
  id: string;
  business_id: string;
  name: string;
  reference: string;
  description: string | null;
  category_id: string | null;
  category?: Category;
  unit: string;
  sale_price_ht: number;
  purchase_price_ht: number;
  tax_rate_id: string | null;
  current_stock: number;
  min_stock_threshold: number;
  is_stockable: boolean;
  is_active: boolean;
  barcode: string | null;
  created_at: string;
  updated_at: string;
}

// Keep Product as alias for backward compatibility
export type Product = StockProduct;

export interface CreateProductDto {
  name: string;
  reference: string;
  description?: string;
  category_id?: string;
  unit?: string;
  sale_price_ht?: number;
  purchase_price_ht?: number;
  tax_rate_id?: string;
  current_stock?: number;
  min_stock_threshold?: number;
  is_stockable?: boolean;
  barcode?: string;
}

export interface UpdateProductDto {
  name?: string;
  reference?: string;
  description?: string;
  category_id?: string;
  unit?: string;
  sale_price_ht?: number;
  purchase_price_ht?: number;
  tax_rate_id?: string;
  current_stock?: number;
  min_stock_threshold?: number;
  is_stockable?: boolean;
  is_active?: boolean;
  barcode?: string;
}

export interface QueryProductsDto {
  search?: string;
  category_id?: string;
  is_active?: boolean;
  low_stock?: boolean;
}
