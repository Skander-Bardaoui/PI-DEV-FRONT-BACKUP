import axios from 'axios';
import {
  StockMovement,
  CreateStockMovementDto,
  QueryStockMovementsDto,
  StockMovementResponse,
  ProductStockSummary,
} from '../types/stock-movement';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const stockMovementsApi = {
  /**
   * Create a manual stock movement
   */
  createManual: async (
    businessId: string,
    data: CreateStockMovementDto,
  ): Promise<StockMovement> => {
    const response = await axios.post(
      `${API_URL}/businesses/${businessId}/stock-movements/manual`,
      data,
      { withCredentials: true },
    );
    return response.data;
  },

  /**
   * Get all stock movements with filters
   */
  getAll: async (
    businessId: string,
    params?: QueryStockMovementsDto,
  ): Promise<StockMovementResponse> => {
    const response = await axios.get(
      `${API_URL}/businesses/${businessId}/stock-movements`,
      {
        params,
        withCredentials: true,
      },
    );
    return response.data;
  },

  /**
   * Get a single stock movement
   */
  getOne: async (businessId: string, id: string): Promise<StockMovement> => {
    const response = await axios.get(
      `${API_URL}/businesses/${businessId}/stock-movements/${id}`,
      { withCredentials: true },
    );
    return response.data;
  },

  /**
   * Get stock movement history for a product
   */
  getProductHistory: async (
    businessId: string,
    productId: string,
    limit?: number,
  ): Promise<StockMovement[]> => {
    const response = await axios.get(
      `${API_URL}/businesses/${businessId}/stock-movements/product/${productId}/history`,
      {
        params: { limit },
        withCredentials: true,
      },
    );
    return response.data;
  },

  /**
   * Get stock summary for a product
   */
  getProductSummary: async (
    businessId: string,
    productId: string,
  ): Promise<ProductStockSummary> => {
    const response = await axios.get(
      `${API_URL}/businesses/${businessId}/stock-movements/product/${productId}/summary`,
      { withCredentials: true },
    );
    return response.data;
  },

  /**
   * Get stock movements by source
   */
  getBySource: async (
    businessId: string,
    sourceType: string,
    sourceId: string,
  ): Promise<StockMovement[]> => {
    const response = await axios.get(
      `${API_URL}/businesses/${businessId}/stock-movements/source/${sourceType}/${sourceId}`,
      { withCredentials: true },
    );
    return response.data;
  },
};
