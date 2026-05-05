// src/api/treasury.api.ts
import axiosInstance from './axiosInstance';
import {
  Account,
  AccountBalance,
  CreateAccountDto,
  UpdateAccountDto,
  CreateTransferDto,
  Transaction,
} from '@/types/treasury';

// ===================== ACCOUNTS =====================
export const getAccounts = async (): Promise<Account[]> => {
  const response = await axiosInstance.get<Account[]>('/accounts');
  return response.data;
};

export const getAccount = async (id: string): Promise<Account> => {
  const response = await axiosInstance.get<Account>(`/accounts/${id}`);
  return response.data;
};

export const getAccountBalance = async (id: string): Promise<AccountBalance> => {
  const response = await axiosInstance.get<AccountBalance>(`/accounts/${id}/balance`);
  return response.data;
};

export const getTotalBalance = async (): Promise<{
  total: number;
  by_account: { id: string; name: string; balance: number; type: string }[];
}> => {
  const response = await axiosInstance.get('/accounts/balance');
  return response.data;
};

export const createAccount = async (data: CreateAccountDto): Promise<Account> => {
  const response = await axiosInstance.post<Account>('/accounts', data);
  return response.data;
};

export const updateAccount = async (id: string, data: UpdateAccountDto): Promise<Account> => {
  const response = await axiosInstance.patch<Account>(`/accounts/${id}`, data);
  return response.data;
};

export const toggleAccountActive = async (id: string): Promise<Account> => {
  const response = await axiosInstance.patch<Account>(`/accounts/${id}/toggle-active`);
  return response.data;
};

// ===================== TRANSFERS =====================
export const createTransfer = async (data: CreateTransferDto): Promise<{
  debit: Transaction;
  credit: Transaction;
}> => {
  const response = await axiosInstance.post('/transfers', data);
  return response.data;
};

// ===================== TRANSACTIONS =====================
export const getTransactions = async (): Promise<Transaction[]> => {
  const response = await axiosInstance.get<Transaction[]>('/transactions');
  return response.data;
};

export const getTransactionsByAccount = async (accountId: string): Promise<Transaction[]> => {
  const response = await axiosInstance.get<Transaction[]>(`/transactions/account/${accountId}`);
  return response.data;
};

export const getTransactionById = async (id: string): Promise<Transaction> => {
  const response = await axiosInstance.get<Transaction>(`/transactions/${id}`);
  return response.data;
};

export const updateFraudReview = async (
  transactionId: string,
  isFraud: boolean
): Promise<Transaction> => {
  const response = await axiosInstance.patch<Transaction>(
    `/transactions/${transactionId}/fraud-review`,
    { is_fraud: isFraud }
  );
  return response.data;
};

// ===================== SUPPLIER PAYMENTS =====================
export interface CreateSupplierPaymentDto {
  supplier_id:          string;
  purchase_invoice_id?: string;
  account_id:           string;
  amount:               number;
  payment_date:         string;   // ISO date string "YYYY-MM-DD"
  payment_method:       string;   // PaymentMethod enum value
  reference?:           string;
  notes?:               string;
}

export const createSupplierPayment = async (
  businessId: string,
  dto: CreateSupplierPaymentDto,
): Promise<any> => {
  const response = await axiosInstance.post(
    `/businesses/${businessId}/supplier-payments`,
    dto,
  );
  return response.data;
};

// ===================== DEPOSITS =====================
export interface CreateDepositDto {
  account_id: string;
  amount: number;
  description?: string;
  reference?: string;
  notes?: string;
  deposit_date?: string;
}

export const createDeposit = async (dto: CreateDepositDto): Promise<{
  message: string;
  transaction: Transaction;
  account: {
    id: string;
    name: string;
    previous_balance: number;
    new_balance: number;
  };
}> => {
  const response = await axiosInstance.post('/deposits', dto);
  return response.data;
};
