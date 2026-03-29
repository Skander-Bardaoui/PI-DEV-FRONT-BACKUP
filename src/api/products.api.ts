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
      { withCredentials: true }
    );
    return response.data;
  },

  update: async (
    businessId: string,
    id: string,
    data: UpdateProductDto
  ): Promise<Product> => {
    const response = await axios.put(
      `${API_URL}/businesses/${businessId}/products/${id}`,
      data,
      { withCredentials: true }
    );
    return response.data;
  },

  delete: async (businessId: string, id: string): Promise<void> => {
    await axios.delete(`${API_URL}/businesses/${businessId}/products/${id}`, {
      withCredentials: true,
    });
  },

  getAlerts: async (businessId: string): Promise<Product[]> => {
    const response = await axios.get(`${API_URL}/businesses/${businessId}/products/alerts`, {
      withCredentials: true,
    });
    return response.data;
  },
};
