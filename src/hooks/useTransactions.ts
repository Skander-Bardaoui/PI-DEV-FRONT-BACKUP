// src/hooks/useTransactions.ts
import { useQuery } from '@tanstack/react-query';
import {
  getTransactions,
  getTransactionById,
  getTransactionsByAccount,
} from '@/api/treasury.api';

// All transactions for the business
export const useTransactions = () =>
  useQuery({
    queryKey: ['transactions'],
    queryFn:  getTransactions,
  });

// Single transaction
export const useTransaction = (id: string) =>
  useQuery({
    queryKey: ['transactions', id],
    queryFn:  () => getTransactionById(id),
    enabled:  !!id,
  });

// Transactions filtered by account
export const useTransactionsByAccount = (accountId: string) =>
  useQuery({
    queryKey: ['transactions', 'account', accountId],
    queryFn:  () => getTransactionsByAccount(accountId),
    enabled:  !!accountId,
  });
