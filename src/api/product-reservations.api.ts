// ==================== Alaa change for product reservations ====================
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ProductReservation {
  id: string;
  name: string;
  sku: string;
  reserved_quantity: number;
  current_quantity: number;
  min_quantity: number;
  unit: string;
  cost: number | null;
  price: number;
  default_supplier_id: string | null;
  supplier_name?: string | null;
  reserved_supplier_id?: string | null;
  reserved_supplier_name?: string | null;
}

export interface CreateReservationDto {
  product_id: string;
  quantity: number;
  supplier_id?: string;
}

export const productReservationsApi = {
  create: async (
    businessId: string,
    data: CreateReservationDto,
  ): Promise<ProductReservation> => {
    const response = await axios.post(
      `${API_URL}/products/reservations`,
      data,
      { withCredentials: true },
    );
    return response.data;
  },

  getAll: async (businessId: string): Promise<ProductReservation[]> => {
    const response = await axios.get(
      `${API_URL}/products/reservations`,
      { withCredentials: true },
    );
    return response.data;
  },

  clear: async (businessId: string, productId: string): Promise<void> => {
    await axios.delete(
      `${API_URL}/products/reservations/${productId}`,
      { withCredentials: true },
    );
  },

  update: async (
    businessId: string,
    productId: string,
    quantity: number,
  ): Promise<ProductReservation> => {
    const response = await axios.put(
      `${API_URL}/products/reservations/${productId}`,
      { quantity },
      { withCredentials: true },
    );
    return response.data;
  },
};
// ====================================================================
