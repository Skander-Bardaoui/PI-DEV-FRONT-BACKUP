import { Category } from './category';
import { Warehouse } from './warehouse';

export enum ProductType {
  PHYSICAL = 'PHYSICAL',
  SERVICE = 'SERVICE',
  DIGITAL = 'DIGITAL',
}

export interface StockProduct {
  sku: string;
  price: any;
  cost: any;
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
  warehouse_id?: string | null;
  warehouse?: Warehouse;
  unit: string;
  sale_price_ht: number;
  purchase_price_ht: number;
  tax_rate_id: string | null;
  current_stock: number;
  min_stock_threshold: number;
  is_stockable: boolean;
  is_active: boolean;
  barcode: string | null;
  type: ProductType;
  // ==================== Product image ====================
  image_url: string | null;
  // ======================================================
  created_at: string;
  updated_at: string;
}

export type Product = StockProduct;

export interface CreateProductDto {
  name: string;
  reference: string;
  description?: string;
  category_id?: string;
  warehouse_id?: string;
  unit?: string;
  sale_price_ht?: number;
  purchase_price_ht?: number;
  tax_rate_id?: string;
  current_stock?: number;
  min_stock_threshold?: number;
  is_stockable?: boolean;
  barcode?: string;
  type?: ProductType;
  // ==================== Product image ====================
  image_url?: string;
  // ======================================================
}

export interface UpdateProductDto {
  name?: string;
  reference?: string;
  description?: string;
  category_id?: string;
  warehouse_id?: string;
  unit?: string;
  sale_price_ht?: number;
  purchase_price_ht?: number;
  tax_rate_id?: string;
  current_stock?: number;
  min_stock_threshold?: number;
  is_stockable?: boolean;
  is_active?: boolean;
  barcode?: string;
  type?: ProductType;
  // ==================== Product image ====================
  image_url?: string;
  // ======================================================
}

export interface QueryProductsDto {
  search?: string;
  category_id?: string;
  is_active?: boolean;
  low_stock?: boolean;
  type?: ProductType;
}