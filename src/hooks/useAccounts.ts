// src/hooks/useAccounts.ts
import { useState, useEffect, useCallback } from 'react';
import {
  getAccounts,
  createAccount as apiCreateAccount,
  updateAccount as apiUpdateAccount,
  toggleAccountActive as apiToggleActive,
  getTotalBalance as apiGetTotalBalance,
} from '@/api/treasury.api';
import { Account, CreateAccountDto, UpdateAccountDto } from '@/types/treasury';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAccounts();
      setAccounts(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Error fetching accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  const createAccount = async (dto: CreateAccountDto): Promise<Account> => {
    try {
      setLoading(true);
      setError(null);
      const newAccount = await apiCreateAccount(dto);
      setAccounts((prev) => [newAccount, ...prev]);
      return newAccount;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Error creating account';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (id: string, dto: UpdateAccountDto): Promise<Account> => {
    try {
      setLoading(true);
      setError(null);
      const updated = await apiUpdateAccount(id, dto);
      setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Error updating account';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string): Promise<Account> => {
    try {
      setLoading(true);
      setError(null);
      const updated = await apiToggleActive(id);
      setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Error toggling account';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTotalBalance = async () => {
    try {
      return await apiGetTotalBalance();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Error fetching total balance';
      setError(msg);
      throw err;
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    createAccount,
    updateAccount,
    toggleActive,
    getTotalBalance,
  };
}
