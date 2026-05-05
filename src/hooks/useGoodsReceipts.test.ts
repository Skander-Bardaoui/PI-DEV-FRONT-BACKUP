import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGoodsReceipts } from './useGoodsReceipts';
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

describe('useGoodsReceipts', () => {
  const mockBusinessId = 'business-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useGetGoodsReceipts', () => {
    it('should fetch goods receipts successfully', async () => {
      const mockReceipts = {
        data: [
          {
            id: 'gr-1',
            purchase_order_id: 'po-1',
            received_date: '2024-01-15',
            status: 'completed',
          },
        ],
        total: 1,
      };

      vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockReceipts });

      const { result } = renderHook(
        () => useGoodsReceipts(mockBusinessId).useGetGoodsReceipts({}),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockReceipts);
    });

    it('should handle error when fetching goods receipts', async () => {
      vi.mocked(axiosInstance.get).mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(
        () => useGoodsReceipts(mockBusinessId).useGetGoodsReceipts({}),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useCreateGoodsReceipt', () => {
    it('should create goods receipt successfully', async () => {
      const newReceipt = {
        purchase_order_id: 'po-1',
        received_date: '2024-01-15',
        items: [{ po_item_id: 'item-1', received_quantity: 10 }],
      };

      vi.mocked(axiosInstance.post).mockResolvedValueOnce({
        data: { id: 'gr-new', ...newReceipt },
      });

      const { result } = renderHook(
        () => useGoodsReceipts(mockBusinessId).useCreateGoodsReceipt(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(newReceipt);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useGetGoodsReceipt', () => {
    it('should fetch single goods receipt', async () => {
      const mockReceipt = {
        id: 'gr-1',
        purchase_order_id: 'po-1',
        received_date: '2024-01-15',
      };

      vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockReceipt });

      const { result } = renderHook(
        () => useGoodsReceipts(mockBusinessId).useGetGoodsReceipt('gr-1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockReceipt);
    });

    it('should not fetch if id is empty', () => {
      const { result } = renderHook(
        () => useGoodsReceipts(mockBusinessId).useGetGoodsReceipt(''),
        { wrapper: createWrapper() }
      );

      expect(result.current.data).toBeUndefined();
      expect(axiosInstance.get).not.toHaveBeenCalled();
    });
  });
});
