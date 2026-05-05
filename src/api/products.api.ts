import axios from 'axios';
import {
  Product,
  CreateProductDto,
  UpdateProductDto,
  QueryProductsDto,
} from '../types/product';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const productsApi = {
  getAll: async (businessId: string, params?: QueryProductsDto): Promise<Product[]> => {
    const response = await axios.get(`${API_URL}/businesses/${businessId}/products`, {
      params,
      withCredentials: true,
    });
    return response.data;
  },

  getOne: async (businessId: string, id: string): Promise<Product> => {
    const response = await axios.get(`${API_URL}/businesses/${businessId}/products/${id}`, {
      withCredentials: true,
    });
    return response.data;
  },

  create: async (businessId: string, data: CreateProductDto): Promise<Product> => {
    const response = await axios.post(
      `${API_URL}/businesses/${businessId}/products`,
      data,
      { withCredentials: true },
    );
    return response.data;
  },

  update: async (businessId: string, id: string, data: UpdateProductDto): Promise<Product> => {
    const response = await axios.put(
      `${API_URL}/businesses/${businessId}/products/${id}`,
      data,
      { withCredentials: true },
    );
    return response.data;
  },

  delete: async (businessId: string, id: string): Promise<void> => {
    await axios.delete(`${API_URL}/businesses/${businessId}/products/${id}`, {
      withCredentials: true,
    });
  },

  softDelete: async (businessId: string, id: string): Promise<Product> => {
    const response = await axios.delete(`${API_URL}/businesses/${businessId}/products/${id}`, {
      withCredentials: true,
    });
    return response.data;
  },

  restore: async (businessId: string, id: string): Promise<Product> => {
    const response = await axios.post(
      `${API_URL}/businesses/${businessId}/products/${id}/restore`,
      {},
      { withCredentials: true },
    );
    return response.data;
  },

  getArchived: async (businessId: string): Promise<Product[]> => {
    const response = await axios.get(`${API_URL}/businesses/${businessId}/products/archived`, {
      withCredentials: true,
    });
    return response.data;
  },

  getAlerts: async (businessId: string): Promise<Product[]> => {
    const response = await axios.get(`${API_URL}/businesses/${businessId}/products/alerts`, {
      withCredentials: true,
    });
    return response.data;
  },

  scanImage: async (businessId: string, imageFile: File): Promise<{
    name: string | null;
    description: string | null;
    barcode: string | null;
    unit: string | null;
    suggested_category_name: string | null;
    sale_price_ht: number | null;
    brand: string | null;
    confidence_note: string;
  }> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await axios.post(
      `${API_URL}/businesses/${businessId}/products/scan-image`,
      formData,
      { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  generateSku: async (
    businessId: string,
    data: {
      category_name?: string | null;
      brand?: string | null;
      name?: string | null;
      unit?: string | null;
      extra_attribute?: string | null;
      type?: 'PHYSICAL' | 'SERVICE' | 'DIGITAL';
    },
  ): Promise<{ sku: string }> => {
    const response = await axios.post(
      `${API_URL}/businesses/${businessId}/products/generate-sku`,
      data,
      { withCredentials: true },
    );
    return response.data;
  },

  generateBarcode: async (businessId: string, productId: string): Promise<Product> => {
    const response = await axios.post(
      `${API_URL}/businesses/${businessId}/products/${productId}/generate-barcode`,
      {},
      { withCredentials: true },
    );
    return response.data;
  },

  downloadLabel: async (businessId: string, productId: string): Promise<Blob> => {
    const response = await axios.get(
      `${API_URL}/businesses/${businessId}/products/${productId}/label`,
      { withCredentials: true, responseType: 'blob' },
    );
    return response.data;
  },

  downloadBulkLabels: async (businessId: string, productIds: string[]): Promise<Blob> => {
    const response = await axios.post(
      `${API_URL}/businesses/${businessId}/products/labels/bulk`,
      { product_ids: productIds },
      { withCredentials: true, responseType: 'blob' },
    );
    return response.data;
  },

  scanServiceDescription: async (businessId: string, description: string): Promise<{
    name: string | null;
    description: string | null;
    suggested_category_name: string | null;
    price_ht: number | null;
    duration_note: string | null;
    confidence_note: string;
  }> => {
    const response = await axios.post(
      `${API_URL}/businesses/${businessId}/products/scan-service-description`,
      { description },
      { withCredentials: true },
    );
    return response.data;
  },

  // ==================== Product image ====================
  uploadImage: async (businessId: string, productId: string, imageFile: File): Promise<Product> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await axios.post(
      `${API_URL}/businesses/${businessId}/products/${productId}/image`,
      formData,
      { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  removeImage: async (businessId: string, productId: string): Promise<Product> => {
    const response = await axios.delete(
      `${API_URL}/businesses/${businessId}/products/${productId}/image`,
      { withCredentials: true },
    );
    return response.data;
  },
  // ======================================================
};