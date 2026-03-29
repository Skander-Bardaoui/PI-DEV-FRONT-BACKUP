// src/components/treasury/TransferModal.tsx
import { useState, useEffect } from 'react';
import { X, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { Account, CreateTransferDto } from '@/types/treasury';

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTransferDto) => Promise<void>;
  accounts: Account[];
  preselectedFromId?: string | null;
}

const defaultForm: CreateTransferDto = {
  from_account_id: '',
  to_account_id: '',
  amount: 0,
  transfer_date: new Date().toISOString().split('T')[0],
  reference: undefined,
  notes: undefined,
};

export default function TransferModal({
  open,
  onClose,
  onSubmit,
  accounts,
  preselectedFromId,
}: TransferModalProps) {
  const [form, setForm] = useState<CreateTransferDto>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateTransferDto, string>>>({});

  const activeAccounts = accounts.filter((a) => a.is_active);

  useEffect(() => {
    if (open) {
      setForm({
        ...defaultForm,
        from_account_id: preselectedFromId || '',
        transfer_date: new Date().toISOString().split('T')[0],
      });
      setErrors({});
    }
  }, [open, preselectedFromId]);

  const fromAccount = activeAccounts.find((a) => a.id === form.from_account_id);
  const toAccount = activeAccounts.find((a) => a.id === form.to_account_id);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateTransferDto, string>> = {};
    if (!form.from_account_id) newErrors.from_account_id = 'Source account is required';
    if (!form.to_account_id) newErrors.to_account_id = 'Destination account is required';
    if (form.from_account_id && form.to_account_id && form.from_account_id === form.to_account_id)
      newErrors.to_account_id = 'Source and destination must be different';
    if (!form.amount || form.amount <= 0) newErrors.amount = 'Amount must be positive';
    if (fromAccount && form.amount > Number(fromAccount.current_balance))
      newErrors.amount = `Insufficient balance (available: ${Number(fromAccount.current_balance).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} ${fromAccount.currency})`;
    if (!form.transfer_date) newErrors.transfer_date = 'Transfer date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        from_account_id: form.from_account_id,
        to_account_id: form.to_account_id,
        amount: form.amount,
        transfer_date: form.transfer_date,
        reference: form.reference?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const formatBalance = (account: Account) =>
    `${Number(account.current_balance).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} ${account.currency}`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">New Transfer</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* From → To accounts */}
          <div className="grid grid-cols-2 gap-4">
            {/* From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From *</label>
              <select
                value={form.from_account_id}
                onChange={(e) => setForm((f) => ({ ...f, from_account_id: e.target.value }))}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.from_account_id ? 'border-red-400' : 'border-gray-300'
                }`}
              >
                <option value="">Select account</option>
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id} disabled={a.id === form.to_account_id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {errors.from_account_id && (
                <p className="text-xs text-red-500 mt-1">{errors.from_account_id}</p>
              )}
              {fromAccount && (
                <p className="text-xs text-gray-400 mt-1">
                  Balance: {formatBalance(fromAccount)}
                </p>
              )}
            </div>

            {/* To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To *</label>
              <select
                value={form.to_account_id}
                onChange={(e) => setForm((f) => ({ ...f, to_account_id: e.target.value }))}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.to_account_id ? 'border-red-400' : 'border-gray-300'
                }`}
              >
                <option value="">Select account</option>
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id} disabled={a.id === form.from_account_id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {errors.to_account_id && (
                <p className="text-xs text-red-500 mt-1">{errors.to_account_id}</p>
              )}
              {toAccount && (
                <p className="text-xs text-gray-400 mt-1">
                  Balance: {formatBalance(toAccount)}
                </p>
              )}
            </div>
          </div>

          {/* Insufficient balance warning */}
          {fromAccount && form.amount > 0 && form.amount > Number(fromAccount.current_balance) && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                Insufficient balance — available:{' '}
                <span className="font-semibold">{formatBalance(fromAccount)}</span>
              </span>
            </div>
          )}

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input
                type="number"
                min={0}
                step="0.001"
                value={form.amount || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    amount: e.target.value === '' ? 0 : parseFloat(e.target.value),
                  }))
                }
                placeholder="0.000"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.amount ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Date *</label>
              <input
                type="date"
                value={form.transfer_date}
                onChange={(e) => setForm((f) => ({ ...f, transfer_date: e.target.value }))}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.transfer_date ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.transfer_date && (
                <p className="text-xs text-red-500 mt-1">{errors.transfer_date}</p>
              )}
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.reference || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, reference: e.target.value || undefined }))
              }
              placeholder="e.g. VIR-2024-001"
              maxLength={100}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.notes || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value || undefined }))
              }
              placeholder="Additional notes..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

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
              {submitting ? 'Processing...' : 'Confirm Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
