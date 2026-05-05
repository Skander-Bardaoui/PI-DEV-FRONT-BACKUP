import axiosInstance from './axiosInstance';
import { Warehouse, CreateWarehouseDto, UpdateWarehouseDto } from '../types/warehouse';
import { StockProduct } from '../types/product';

export const warehousesApi = {
  async getAll(businessId: string, params?: { is_active?: boolean }): Promise<Warehouse[]> {
    const response = await axiosInstance.get(`/businesses/${businessId}/warehouses`, {
      params,
    });
    return response.data;
  },

  async getOne(businessId: string, id: string): Promise<Warehouse> {
    const response = await axiosInstance.get(`/businesses/${businessId}/warehouses/${id}`);
    return response.data;
  },

  async create(businessId: string, data: CreateWarehouseDto): Promise<Warehouse> {
    const response = await axiosInstance.post(
      `/businesses/${businessId}/warehouses`,
      data
    );
    return response.data;
  },

  async update(businessId: string, id: string, data: UpdateWarehouseDto): Promise<Warehouse> {
    const response = await axiosInstance.put(
      `/businesses/${businessId}/warehouses/${id}`,
      data
    );
    return response.data;
  },

  async delete(businessId: string, id: string): Promise<void> {
    await axiosInstance.delete(`/businesses/${businessId}/warehouses/${id}`);
  },

  async getWarehouseStock(businessId: string, warehouseId: string): Promise<StockProduct[]> {
    const response = await axiosInstance.get(
      `/businesses/${businessId}/warehouses/${warehouseId}/stock`
    );
    return response.data;
  },
};
