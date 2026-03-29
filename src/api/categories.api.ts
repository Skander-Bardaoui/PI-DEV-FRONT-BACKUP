import axios from 'axios';
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  QueryCategoriesDto,
} from '../types/category';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const categoriesApi = {
  getAll: async (businessId: string, params?: QueryCategoriesDto): Promise<Category[]> => {
    const response = await axios.get(`${API_URL}/businesses/${businessId}/categories`, {
      params,
      withCredentials: true,
    });
    return response.data;
  },

  getOne: async (businessId: string, id: string): Promise<Category> => {
    const response = await axios.get(`${API_URL}/businesses/${businessId}/categories/${id}`, {
      withCredentials: true,
    });
    return response.data;
  },

  create: async (businessId: string, data: CreateCategoryDto): Promise<Category> => {
    const response = await axios.post(
      `${API_URL}/businesses/${businessId}/categories`,
      data,
      { withCredentials: true }
    );
    return response.data;
  },

  update: async (
    businessId: string,
    id: string,
    data: UpdateCategoryDto
  ): Promise<Category> => {
    const response = await axios.put(
      `${API_URL}/businesses/${businessId}/categories/${id}`,
      data,
      { withCredentials: true }
    );
    return response.data;
  },

  delete: async (businessId: string, id: string): Promise<void> => {
    await axios.delete(`${API_URL}/businesses/${businessId}/categories/${id}`, {
      withCredentials: true,
    });
  },
};
