// src/hooks/useTransfers.ts
import { useState } from 'react';
import { createTransfer } from '@/api/treasury.api';
import { CreateTransferDto } from '@/types/treasury';

export function useTransfers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | { field: string; message: string }[] | null>(null);

  const transfer = async (dto: CreateTransferDto) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createTransfer(dto);
      return result;
    } catch (e: any) {
      const err = e?.response?.data || 'Failed to process transfer';
      setError(err);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { transfer, loading, error };
}
