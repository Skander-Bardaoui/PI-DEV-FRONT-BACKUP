import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePurchaseOrders } from './usePurchaseOrders';
import axiosInstance from '@/api/axiosInstance';
import type { ReactNode } from 'react';

vi.mock('@/api/axiosInstance');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('usePurchaseOrders', () => {
  const mockBusinessId = 'business-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useGetPurchaseOrders', () => {
    it('should fetch purchase orders successfully', async () => {
      const mockPOs = {
        data: [
          {
            id: 'po-1',
            po_number: 'PO-2024-001',
            supplier_id: 'supplier-1',
            status: 'approved',
            total_amount: 1000,
          },
        ],
        total: 1,
      };

      vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockPOs });

      const { result } = renderHook(
        () => usePurchaseOrders(mockBusinessId).useGetPurchaseOrders({}),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockPOs);
    });

    it('should handle error when fetching purchase orders', async () => {
      vi.mocked(axiosInstance.get).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(
        () => usePurchaseOrders(mockBusinessId).useGetPurchaseOrders({}),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useCreatePurchaseOrder', () => {
    it('should create purchase order successfully', async () => {
      const newPO = {
        supplier_id: 'supplier-1',
        items: [{ product_id: 'p1', quantity: 10, unit_price: 50 }],
        total_amount: 500,
      };

      vi.mocked(axiosInstance.post).mockResolvedValueOnce({
        data: { id: 'po-new', ...newPO },
      });

      const { result } = renderHook(
        () => usePurchaseOrders(mockBusinessId).useCreatePurchaseOrder(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(newPO);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useUpdatePurchaseOrder', () => {
    it('should update purchase order successfully', async () => {
      const updateData = { status: 'approved' };

      vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
        data: { id: 'po-1', ...updateData },
      });

      const { result } = renderHook(
        () => usePurchaseOrders(mockBusinessId).useUpdatePurchaseOrder(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({ id: 'po-1', data: updateData });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });
});
