// ===================== ACCOUNTS =====================
export type AccountType = 'BANK' | 'CASH';

export interface Account {
  id: string;
  business_id: string;
  name: string;
  type: AccountType;
  bank_name?: string;
  rib?: string;
  opening_balance: number;
  current_balance: number;
  currency: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountBalance {
  account: Account;
  current_balance: number;
  opening_balance: number;
}

// For creating/updating accounts
export interface CreateAccountDto {
  name: string;
  type: AccountType;
  bank_name?: string;
  rib?: string;
  opening_balance?: number;
  currency?: string;
  is_default?: boolean;
}

export type UpdateAccountDto = Partial<CreateAccountDto>;

// ===================== TRANSACTIONS =====================
export type TransactionType = 'ENCAISSEMENT' | 'DECAISSEMENT' | 'VIREMENT_INTERNE';

export interface Transaction {
  id: string;
  business_id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  transaction_date: string;
  description?: string;
  reference?: string;
  notes?: string;
  related_entity_type?: 'Payment' | 'SupplierPayment' | 'Transfer';
  related_entity_id?: string;
  is_reconciled: boolean;
  created_by: string;
  created_at: string;
}

// ===================== TRANSFERS =====================
export interface CreateTransferDto {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  transfer_date: string;
  reference?: string;
  notes?: string;
}

// ===================== PAYMENTS =====================
export type PaymentMethod = 'VIREMENT' | 'CHEQUE' | 'ESPECES' | 'TRAITE' | 'CARTE';

export interface Payment {
  id: string;
  business_id: string;
  invoice_id: string;
  account_id: string;
  amount: number;
  payment_date: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

// DTO for creating payments
export interface CreatePaymentDto {
  invoice_id: string;
  account_id: string;
  amount: number;
  payment_date: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

// ===================== SUPPLIER PAYMENTS =====================
export interface SupplierPayment {
  id: string;
  business_id: string;
  supplier_id: string;
  purchase_invoice_id?: string | null;
  account_id?: string | null;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierPaymentDto {
  supplier_id: string;
  purchase_invoice_id?: string;
  account_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference?: string;
  notes?: string;
}
