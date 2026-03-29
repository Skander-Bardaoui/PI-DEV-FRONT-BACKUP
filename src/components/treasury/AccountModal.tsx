// src/components/treasury/AccountModal.tsx
import { useState, useEffect } from 'react';
import { X, Building2, Wallet } from 'lucide-react';
import { Account, CreateAccountDto, AccountType } from '@/types/treasury';

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAccountDto & { current_balance?: number }) => Promise<void>;
  account?: Account | null;
}

const defaultForm = {
  name: '',
  type: 'BANK' as AccountType,
  bank_name: undefined as string | undefined,
  rib: undefined as string | undefined,
  opening_balance: 0,
  currency: 'TND',
  is_default: false,
  current_balance: undefined as number | undefined, // only used in edit mode
};

export default function AccountModal({ open, onClose, onSubmit, account }: AccountModalProps) {
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const isEdit = !!account;

  useEffect(() => {
    if (account) {
      setForm({
        name: account.name || '',
        type: account.type || 'BANK',
        bank_name: account.bank_name || undefined,
        rib: account.rib || undefined,
        opening_balance: account.opening_balance ?? 0,
        currency: account.currency || 'TND',
        is_default: account.is_default ?? false,
        current_balance: account.current_balance ?? 0, // ← prefill with existing current_balance
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [account, open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name?.trim()) newErrors.name = 'Account name is required';
    if (form.type === 'BANK' && !form.bank_name?.trim())
      newErrors.bank_name = 'Bank name is required for bank accounts';
    if (!isEdit && form.opening_balance !== undefined && form.opening_balance < 0)
      newErrors.opening_balance = 'Balance cannot be negative';
    if (isEdit && form.current_balance !== undefined && form.current_balance < 0)
      newErrors.current_balance = 'Balance cannot be negative';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload: CreateAccountDto & { current_balance?: number } = {
        name: form.name?.trim() || '',
        type: form.type || 'BANK',
        bank_name: form.bank_name?.trim() || undefined,
        rib: form.rib?.trim() || undefined,
        currency: form.currency || 'TND',
        is_default: form.is_default ?? false,
        // On create → send opening_balance, on edit → send current_balance
        ...(isEdit
          ? { current_balance: typeof form.current_balance === 'number' ? form.current_balance : 0 }
          : { opening_balance: typeof form.opening_balance === 'number' ? form.opening_balance : 0 }
        ),
      };

      await onSubmit(payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              {form.type === 'BANK' ? (
                <Building2 className="h-5 w-5 text-indigo-600" />
              ) : (
                <Wallet className="h-5 w-5 text-indigo-600" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Edit Account' : 'New Account'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              {(['BANK', 'CASH'] as AccountType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type }))}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    form.type === type
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {type === 'BANK' ? (
                    <Building2 className="h-4 w-4" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                  <span className="font-medium">{type === 'BANK' ? 'Bank Account' : 'Cash'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Main Bank Account"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.name ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Bank fields */}
          {form.type === 'BANK' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={form.bank_name || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bank_name: e.target.value || undefined }))
                  }
                  placeholder="e.g. Banque Zitouna"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.bank_name ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {errors.bank_name && (
                  <p className="text-xs text-red-500 mt-1">{errors.bank_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RIB</label>
                <input
                  type="text"
                  value={form.rib || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, rib: e.target.value || undefined }))
                  }
                  placeholder="Bank account number (RIB)"
                  maxLength={23}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          {/* Balance + Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              {isEdit ? (
                // Edit mode → Current Balance (editable)
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Balance
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={form.current_balance ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        current_balance: e.target.value === '' ? 0 : parseFloat(e.target.value),
                      }))
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.current_balance ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  {errors.current_balance && (
                    <p className="text-xs text-red-500 mt-1">{errors.current_balance}</p>
                  )}
                </>
              ) : (
                // Create mode → Opening Balance
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opening Balance
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={form.opening_balance ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        opening_balance: e.target.value === '' ? 0 : parseFloat(e.target.value),
                      }))
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.opening_balance ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  {errors.opening_balance && (
                    <p className="text-xs text-red-500 mt-1">{errors.opening_balance}</p>
                  )}
                </>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TND">TND</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Default */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Set as default account</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
